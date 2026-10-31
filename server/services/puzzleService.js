import crypto from 'crypto';
import defaultDb from '../db/index.js';
import config from '../config/index.js';
import { fetchPuzzle as defaultFetchPuzzle } from './bananaService.js';
import { createTokenForPuzzle } from './tokenService.js';

let activeDb = defaultDb;

export function setDatabase(customDb) {
  activeDb = customDb;
}

export function resetDatabase() {
  activeDb = defaultDb;
}

function getDb(customDb) {
  return customDb || activeDb;
}

/**
 * Cleans up old failed or expired puzzles older than 1 hour.
 * Preserves solved puzzles to protect associated play tokens and leaderboard records.
 */
export function cleanupOldPuzzles(customDb) {
  const dbToUse = getDb(customDb);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  dbToUse
    .prepare(
      "DELETE FROM puzzles WHERE status IN ('failed', 'expired') AND (created_at < ? OR datetime(created_at) < datetime('now', '-1 hour'))"
    )
    .run(oneHourAgo);
}

/**
 * Creates a new puzzle for the given user.
 * - Expires any pending puzzle for the user
 * - Fetches a new puzzle from the Banana API
 * - Stores puzzle in the database
 * - Returns { id, image, expiresAt, maxAttempts } and NOTHING else
 */
export async function createPuzzle(userId, customDb, fetchFn = defaultFetchPuzzle) {
  const dbToUse = getDb(customDb);

  // 1. Clean up old non-pending puzzles older than 1 hour
  cleanupOldPuzzles(dbToUse);

  // 2. Mark any existing pending puzzle for this user as expired
  dbToUse
    .prepare("UPDATE puzzles SET status = 'expired' WHERE user_id = ? AND status = 'pending'")
    .run(userId);

  // 3. Fetch puzzle from external API
  const { image, solution } = await fetchFn();

  // 4. Calculate timing and generate unique ID
  const puzzleId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.puzzleTtlSeconds * 1000).toISOString();

  // 5. Store puzzle in database
  dbToUse
    .prepare(
      'INSERT INTO puzzles (id, user_id, solution, image, attempts, status, created_at, expires_at) VALUES (?, ?, ?, ?, 0, \'pending\', ?, ?)'
    )
    .run(puzzleId, userId, String(solution), image, now.toISOString(), expiresAt);

  // 6. Return strictly safe payload
  return {
    id: puzzleId,
    image,
    expiresAt,
    maxAttempts: config.puzzleMaxAttempts,
  };
}

/**
 * Checks an answer against an existing puzzle within a database transaction.
 * Prevents race conditions on attempt counts.
 */
export function checkAnswer(userId, puzzleId, guess, customDb) {
  const dbToUse = getDb(customDb);

  const tx = dbToUse.transaction(() => {
    // 1. Load the puzzle by id AND user_id to prevent leaking existence of other users' puzzles
    const puzzle = dbToUse
      .prepare('SELECT id, user_id, solution, attempts, status, expires_at FROM puzzles WHERE id = ? AND user_id = ?')
      .get(puzzleId, userId);

    if (!puzzle) {
      return { status: 'not_found' };
    }

    // 2. Check if the puzzle is pending
    if (puzzle.status !== 'pending') {
      return { status: 'not_active' };
    }

    // 3. Check if the puzzle is expired
    const now = new Date();
    const expiry = new Date(puzzle.expires_at);
    if (now.getTime() > expiry.getTime()) {
      dbToUse.prepare("UPDATE puzzles SET status = 'expired' WHERE id = ?").run(puzzleId);
      return { status: 'expired' };
    }

    // 4. Increment attempts
    const newAttempts = puzzle.attempts + 1;

    // 5. Compare guess with solution as strings
    const isCorrect = String(guess) === String(puzzle.solution);

    if (isCorrect) {
      dbToUse
        .prepare("UPDATE puzzles SET attempts = ?, status = 'solved' WHERE id = ?")
        .run(newAttempts, puzzleId);
      // Issue play token inside the same transaction
      createTokenForPuzzle(dbToUse, userId, puzzleId);
      return { correct: true, unlocked: true };
    }

    if (newAttempts >= config.puzzleMaxAttempts) {
      dbToUse
        .prepare("UPDATE puzzles SET attempts = ?, status = 'failed' WHERE id = ?")
        .run(newAttempts, puzzleId);
      return { correct: false, attemptsLeft: 0, failed: true };
    }

    dbToUse
      .prepare('UPDATE puzzles SET attempts = ? WHERE id = ?')
      .run(newAttempts, puzzleId);

    return {
      correct: false,
      attemptsLeft: config.puzzleMaxAttempts - newAttempts,
    };
  });

  return tx();
}

export default {
  createPuzzle,
  checkAnswer,
  cleanupOldPuzzles,
  setDatabase,
  resetDatabase,
};
