import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPuzzle, checkAnswer, cleanupOldPuzzles } from '../services/puzzleService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('puzzleService.checkAnswer', () => {
  let memDb;

  beforeEach(() => {
    // 1. Initialize fresh in-memory SQLite database for test isolation
    memDb = new Database(':memory:');
    memDb.pragma('foreign_keys = ON');

    // 2. Load and apply project schema
    const schemaPath = path.resolve(__dirname, '../db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    memDb.exec(schemaSql);

    // 3. Seed test users
    memDb.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(1, 'alice', 'hash1');
    memDb.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(2, 'bob', 'hash2');
  });

  it('correct answer returns { correct: true } and marks puzzle solved', async () => {
    // Mock bananaService
    const mockBanana = async () => ({
      image: 'fake-base64-image-data',
      solution: '7',
    });

    const puzzle = await createPuzzle(1, memDb, mockBanana);
    assert.ok(puzzle.id);
    assert.strictEqual(puzzle.image, 'fake-base64-image-data');
    assert.strictEqual(puzzle.solution, undefined, 'Solution must never be returned to client payload');

    const result = checkAnswer(1, puzzle.id, '7', memDb);
    assert.deepStrictEqual(result, { correct: true, unlocked: true });

    // Verify database state
    const record = memDb.prepare('SELECT attempts, status FROM puzzles WHERE id = ?').get(puzzle.id);
    assert.strictEqual(record.status, 'solved');
    assert.strictEqual(record.attempts, 1);
  });

  it('wrong answer decrements attempts and returns { correct: false, attemptsLeft }', async () => {
    const mockBanana = async () => ({
      image: 'fake-base64-image-data',
      solution: '7',
    });

    const puzzle = await createPuzzle(1, memDb, mockBanana);

    // Attempt 1: wrong answer '3'
    const result = checkAnswer(1, puzzle.id, '3', memDb);
    assert.deepStrictEqual(result, { correct: false, attemptsLeft: 2 });

    const record = memDb.prepare('SELECT attempts, status FROM puzzles WHERE id = ?').get(puzzle.id);
    assert.strictEqual(record.status, 'pending');
    assert.strictEqual(record.attempts, 1);
  });

  it('failure after reaching max attempts (3 wrong guesses)', async () => {
    const mockBanana = async () => ({
      image: 'fake-base64-image-data',
      solution: '7',
    });

    const puzzle = await createPuzzle(1, memDb, mockBanana);

    // Attempt 1
    const res1 = checkAnswer(1, puzzle.id, '1', memDb);
    assert.deepStrictEqual(res1, { correct: false, attemptsLeft: 2 });

    // Attempt 2
    const res2 = checkAnswer(1, puzzle.id, '2', memDb);
    assert.deepStrictEqual(res2, { correct: false, attemptsLeft: 1 });

    // Attempt 3: final attempt exhaustion
    const res3 = checkAnswer(1, puzzle.id, '3', memDb);
    assert.deepStrictEqual(res3, { correct: false, attemptsLeft: 0, failed: true });

    const record = memDb.prepare('SELECT attempts, status FROM puzzles WHERE id = ?').get(puzzle.id);
    assert.strictEqual(record.status, 'failed');
    assert.strictEqual(record.attempts, 3);
  });

  it('expired puzzle returns { status: "expired" } and updates database status', async () => {
    // Insert an already expired puzzle directly into test database
    const expiredId = 'test-expired-uuid';
    const pastExpiry = new Date(Date.now() - 5000).toISOString();
    memDb
      .prepare(
        'INSERT INTO puzzles (id, user_id, solution, image, attempts, status, created_at, expires_at) VALUES (?, ?, ?, ?, 0, \'pending\', ?, ?)'
      )
      .run(expiredId, 1, '5', 'img-data', new Date().toISOString(), pastExpiry);

    const result = checkAnswer(1, expiredId, '5', memDb);
    assert.deepStrictEqual(result, { status: 'expired' });

    const record = memDb.prepare('SELECT status FROM puzzles WHERE id = ?').get(expiredId);
    assert.strictEqual(record.status, 'expired');
  });

  it('puzzle belonging to another user returns not found (no existence leak)', async () => {
    const mockBanana = async () => ({
      image: 'bob-image',
      solution: '4',
    });

    // Create puzzle for Bob (user_id = 2)
    const bobPuzzle = await createPuzzle(2, memDb, mockBanana);

    // Alice (user_id = 1) attempts to answer Bob's puzzle
    const result = checkAnswer(1, bobPuzzle.id, '4', memDb);
    assert.deepStrictEqual(result, { status: 'not_found' });

    // Non-existent puzzle id also returns not_found identically
    const nonexistent = checkAnswer(1, 'non-existent-id', '4', memDb);
    assert.deepStrictEqual(nonexistent, { status: 'not_found' });
  });

  it('solved puzzle cannot be answered again and returns { status: "not_active" }', async () => {
    const mockBanana = async () => ({
      image: 'puzzle-image',
      solution: '9',
    });

    const puzzle = await createPuzzle(1, memDb, mockBanana);

    // Solve the puzzle successfully
    const firstRes = checkAnswer(1, puzzle.id, '9', memDb);
    assert.deepStrictEqual(firstRes, { correct: true, unlocked: true });

    // Attempting to answer again
    const secondRes = checkAnswer(1, puzzle.id, '9', memDb);
    assert.deepStrictEqual(secondRes, { status: 'not_active' });
  });

  describe('cleanupOldPuzzles', () => {
    it('deletes failed and expired puzzles older than 1 hour, but preserves solved and pending puzzles', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const futureExpiry = new Date(Date.now() + 60 * 1000).toISOString();

      // Seed old failed puzzle (should be deleted)
      memDb.prepare(
        "INSERT INTO puzzles (id, user_id, solution, image, attempts, status, created_at, expires_at) VALUES ('p-old-failed', 1, '1', 'img', 3, 'failed', ?, ?)"
      ).run(twoHoursAgo, twoHoursAgo);

      // Seed old expired puzzle (should be deleted)
      memDb.prepare(
        "INSERT INTO puzzles (id, user_id, solution, image, attempts, status, created_at, expires_at) VALUES ('p-old-expired', 1, '2', 'img', 0, 'expired', ?, ?)"
      ).run(twoHoursAgo, twoHoursAgo);

      // Seed recent failed puzzle (should NOT be deleted because < 1 hour)
      memDb.prepare(
        "INSERT INTO puzzles (id, user_id, solution, image, attempts, status, created_at, expires_at) VALUES ('p-recent-failed', 1, '3', 'img', 3, 'failed', ?, ?)"
      ).run(thirtyMinsAgo, thirtyMinsAgo);

      // Seed old pending puzzle (should NOT be deleted because status is pending)
      memDb.prepare(
        "INSERT INTO puzzles (id, user_id, solution, image, attempts, status, created_at, expires_at) VALUES ('p-old-pending', 1, '4', 'img', 0, 'pending', ?, ?)"
      ).run(twoHoursAgo, futureExpiry);

      // Seed old solved puzzle with associated play token (must NEVER be deleted to protect leaderboard)
      memDb.prepare(
        "INSERT INTO puzzles (id, user_id, solution, image, attempts, status, created_at, expires_at) VALUES ('p-old-solved', 1, '5', 'img', 1, 'solved', ?, ?)"
      ).run(twoHoursAgo, twoHoursAgo);

      memDb.prepare(
        "INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at, started_at, finished_at, score) VALUES ('tok-solved', 1, 'p-old-solved', 'finished', ?, ?, ?, ?, 42)"
      ).run(twoHoursAgo, twoHoursAgo, twoHoursAgo, twoHoursAgo);

      // Run cleanup
      cleanupOldPuzzles(memDb);

      // Assert old failed and old expired were removed
      const oldFailed = memDb.prepare('SELECT id FROM puzzles WHERE id = ?').get('p-old-failed');
      const oldExpired = memDb.prepare('SELECT id FROM puzzles WHERE id = ?').get('p-old-expired');
      assert.strictEqual(oldFailed, undefined);
      assert.strictEqual(oldExpired, undefined);

      // Assert recent failed, pending, and solved puzzles are preserved
      const recentFailed = memDb.prepare('SELECT id FROM puzzles WHERE id = ?').get('p-recent-failed');
      const oldPending = memDb.prepare('SELECT id FROM puzzles WHERE id = ?').get('p-old-pending');
      const oldSolved = memDb.prepare('SELECT id FROM puzzles WHERE id = ?').get('p-old-solved');
      const token = memDb.prepare('SELECT id, score FROM play_tokens WHERE id = ?').get('tok-solved');

      assert.ok(recentFailed, 'Recent failed puzzles should be kept');
      assert.ok(oldPending, 'Pending puzzles should be kept');
      assert.ok(oldSolved, 'Solved puzzles must be preserved to protect token foreign keys');
      assert.ok(token, 'Play token and score must remain intact');
      assert.strictEqual(token.score, 42);
    });
  });
});

