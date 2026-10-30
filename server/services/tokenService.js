import crypto from 'crypto';
import defaultDb from '../db/index.js';
import config from '../config/index.js';

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
 * Creates an 'unused' play token for a solved puzzle.
 *
 * TRANSACTION EXPLANATION:
 * This function accepts a `db` (or transaction context) parameter so it can be called
 * within the caller's transaction (e.g., in puzzleService.checkAnswer). Executing token creation
 * in the same transaction as marking a puzzle 'solved' ensures atomicity: either both succeed,
 * or neither does. A solved puzzle is guaranteed to have exactly one play token, avoiding orphaned
 * solves without tokens or duplicate tokens from uncoordinated writes.
 *
 * @param {import('better-sqlite3').Database} db - Database connection or active transaction
 * @param {number} userId - ID of the user who solved the puzzle
 * @param {string} puzzleId - ID of the solved puzzle
 * @returns {string} The created token ID (internal use only)
 */
export function createTokenForPuzzle(db, userId, puzzleId) {
  const dbToUse = getDb(db);
  const tokenId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.playTokenTtlSeconds * 1000).toISOString();

  dbToUse
    .prepare(
      `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at)
       VALUES (?, ?, ?, 'unused', ?, ?)`
    )
    .run(tokenId, userId, puzzleId, now.toISOString(), expiresAt);

  return tokenId;
}

/**
 * Marks expired tokens as 'expired':
 * 1. 'unused' tokens whose expires_at date has passed.
 * 2. 'started' tokens whose started_at timestamp is older than RUN_MAX_SECONDS.
 *
 * @param {number} [userId] - Optional user ID to scope expiration cleanup
 * @param {import('better-sqlite3').Database} [customDb] - Optional database instance
 */
export function expireStaleTokens(userId, customDb) {
  const dbToUse = getDb(customDb);
  const now = new Date();
  const nowIso = now.toISOString();
  const startedCutoffIso = new Date(now.getTime() - config.runMaxSeconds * 1000).toISOString();

  if (userId !== undefined && userId !== null) {
    // Expire stale unused tokens for this user
    dbToUse
      .prepare(
        `UPDATE play_tokens
         SET status = 'expired'
         WHERE user_id = ?
           AND status = 'unused'
           AND (expires_at < ? OR datetime(expires_at) < datetime(?))`
      )
      .run(userId, nowIso, nowIso);

    // Expire abandoned started runs for this user
    dbToUse
      .prepare(
        `UPDATE play_tokens
         SET status = 'expired'
         WHERE user_id = ?
           AND status = 'started'
           AND (started_at < ? OR datetime(started_at) < datetime(?))`
      )
      .run(userId, startedCutoffIso, startedCutoffIso);
  } else {
    // Expire stale unused tokens globally
    dbToUse
      .prepare(
        `UPDATE play_tokens
         SET status = 'expired'
         WHERE status = 'unused'
           AND (expires_at < ? OR datetime(expires_at) < datetime(?))`
      )
      .run(nowIso, nowIso);

    // Expire abandoned started runs globally
    dbToUse
      .prepare(
        `UPDATE play_tokens
         SET status = 'expired'
         WHERE status = 'started'
           AND (started_at < ? OR datetime(started_at) < datetime(?))`
      )
      .run(startedCutoffIso, startedCutoffIso);
  }
}

/**
 * Counts the number of active, unused tokens available for the user.
 * Automatically purges stale expired tokens before counting.
 *
 * @param {number} userId - The user ID
 * @param {import('better-sqlite3').Database} [customDb] - Optional database instance
 * @returns {number} The count of unused tokens
 */
export function countAvailable(userId, customDb) {
  const dbToUse = getDb(customDb);
  expireStaleTokens(userId, dbToUse);
  const row = dbToUse
    .prepare("SELECT COUNT(*) AS count FROM play_tokens WHERE user_id = ? AND status = 'unused'")
    .get(userId);
  return row ? row.count : 0;
}

/**
 * Spends the oldest unused play token to initiate a game run.
 *
 * TRANSACTION EXPLANATION:
 * This operation MUST run inside a single better-sqlite3 transaction because:
 * 1. Atomicity & Race Condition Prevention: Multiple concurrent requests from the same user
 *    (e.g., pressing Start twice rapidly or multiple browser tabs) could both query for available tokens.
 *    Without a transaction, both requests could see the same token as 'unused' (TOCTOU race condition)
 *    and both proceed to spend it.
 * 2. Strict Serialization: Executing stale expiration, token selection, and the status transition
 *    to 'started' inside one synchronous transaction ensures that token consumption is completely exclusive:
 *    exactly one request acquires the token, while subsequent or concurrent requests see it as already spent.
 *
 * @param {number} userId - The user ID starting the run
 * @param {import('better-sqlite3').Database} [customDb] - Optional database instance
 * @returns {{ runId: string, startedAt: string } | null} Run information, or null if no token is available
 */
export function startRun(userId, customDb) {
  const dbToUse = getDb(customDb);

  const tx = dbToUse.transaction(() => {
    // 1. Expire any stale tokens before picking
    expireStaleTokens(userId, dbToUse);

    // 2. Select the oldest unused token for this user
    const token = dbToUse
      .prepare(
        `SELECT id, created_at FROM play_tokens
         WHERE user_id = ? AND status = 'unused'
         ORDER BY datetime(created_at) ASC, id ASC
         LIMIT 1`
      )
      .get(userId);

    if (!token) {
      return null;
    }

    const startedAt = new Date().toISOString();

    // 3. Mark the selected token as started atomically
    const result = dbToUse
      .prepare(
        `UPDATE play_tokens
         SET status = 'started', started_at = ?
         WHERE id = ? AND status = 'unused'`
      )
      .run(startedAt, token.id);

    if (result.changes === 0) {
      return null;
    }

    return {
      runId: token.id,
      startedAt,
    };
  });

  return tx();
}

export default {
  createTokenForPuzzle,
  expireStaleTokens,
  countAvailable,
  startRun,
  setDatabase,
  resetDatabase,
};
