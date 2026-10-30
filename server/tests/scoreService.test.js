import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import { maxPlausibleScore } from '../config/gameRules.js';
import { finishRun, getLeaderboard } from '../services/scoreService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Score Service & Leaderboard (scoreService)', () => {
  let memDb;

  beforeEach(() => {
    // Fresh in-memory SQLite database
    memDb = new Database(':memory:');
    memDb.pragma('foreign_keys = ON');

    // Apply schema
    const schemaPath = path.resolve(__dirname, '../db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    memDb.exec(schemaSql);

    // Seed test users
    memDb.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(1, 'alice', 'hash1');
    memDb.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(2, 'bob', 'hash2');
    memDb.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(3, 'charlie', 'hash3');
    memDb.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(4, 'dave', 'hash4');
  });

  describe('maxPlausibleScore boundaries', () => {
    it('calculates plausible score upper bounds correctly across time intervals', () => {
      assert.strictEqual(maxPlausibleScore(0), 1, 'At t=0ms, up to 1 initial item can spawn');
      assert.strictEqual(maxPlausibleScore(499), 1, 'At t=499ms, still at most 1 item');
      assert.strictEqual(maxPlausibleScore(500), 2, 'At t=500ms, second item can spawn');
      assert.strictEqual(maxPlausibleScore(999), 2, 'At t=999ms, still 2 items');
      assert.strictEqual(maxPlausibleScore(1000), 3, 'At t=1000ms, third item can spawn');
      assert.strictEqual(maxPlausibleScore(5000), 11, 'At t=5000ms, up to 11 items');

      // Edge cases
      assert.strictEqual(maxPlausibleScore(-100), 0);
      assert.strictEqual(maxPlausibleScore(NaN), 0);
      assert.strictEqual(maxPlausibleScore('invalid'), 0);
    });
  });

  describe('finishRun validation and persistence', () => {
    it('finishRun saves a plausible score', () => {
      const baseTime = 1000000;
      const startedAt = new Date(baseTime).toISOString();
      const expiresAt = new Date(baseTime + 900000).toISOString();

      // Seed dummy puzzle and started token
      memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '7', 'img', 'solved', ?)").run(expiresAt);
      memDb.prepare(
        `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at, started_at)
         VALUES ('run-1', 1, 'p1', 'started', ?, ?, ?)`
      ).run(startedAt, expiresAt, startedAt);

      // Finish 5000ms later (max plausible is 11) with a score of 8
      const outcome = finishRun(1, 'run-1', 8, {
        db: memDb,
        now: () => baseTime + 5000,
      });

      assert.deepStrictEqual(outcome, { result: 'saved', score: 8 });

      const row = memDb.prepare('SELECT status, score, finished_at FROM play_tokens WHERE id = ?').get('run-1');
      assert.strictEqual(row.status, 'finished');
      assert.strictEqual(row.score, 8);
      assert.strictEqual(row.finished_at, new Date(baseTime + 5000).toISOString());
    });

    it('rejects a score above the bound and voids the run', () => {
      const baseTime = 1000000;
      const startedAt = new Date(baseTime).toISOString();
      const expiresAt = new Date(baseTime + 900000).toISOString();

      memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '7', 'img', 'solved', ?)").run(expiresAt);
      memDb.prepare(
        `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at, started_at)
         VALUES ('run-cheat', 1, 'p1', 'started', ?, ?, ?)`
      ).run(startedAt, expiresAt, startedAt);

      // At 1000ms elapsed, max plausible score is 3. Client claims 50.
      const outcome = finishRun(1, 'run-cheat', 50, {
        db: memDb,
        now: () => baseTime + 1000,
      });

      assert.deepStrictEqual(outcome, { result: 'rejected' });

      // Run must be voided (marked expired)
      const row = memDb.prepare('SELECT status, score FROM play_tokens WHERE id = ?').get('run-cheat');
      assert.strictEqual(row.status, 'expired');
      assert.strictEqual(row.score, null);
    });

    it('rejects negative, fractional and non-numeric scores', () => {
      const baseTime = 1000000;
      const startedAt = new Date(baseTime).toISOString();
      const expiresAt = new Date(baseTime + 900000).toISOString();

      const seedRun = (id) => {
        memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES (?, 1, '7', 'img', 'solved', ?)").run(`pz-${id}`, expiresAt);
        memDb.prepare(
          `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at, started_at)
           VALUES (?, 1, ?, 'started', ?, ?, ?)`
        ).run(id, `pz-${id}`, startedAt, expiresAt, startedAt);
      };

      // 1. Negative score
      seedRun('run-neg');
      const resNeg = finishRun(1, 'run-neg', -1, { db: memDb, now: () => baseTime + 5000 });
      assert.deepStrictEqual(resNeg, { result: 'rejected' });
      assert.strictEqual(memDb.prepare('SELECT status FROM play_tokens WHERE id = ?').get('run-neg').status, 'expired');

      // 2. Fractional score
      seedRun('run-frac');
      const resFrac = finishRun(1, 'run-frac', 3.5, { db: memDb, now: () => baseTime + 5000 });
      assert.deepStrictEqual(resFrac, { result: 'rejected' });
      assert.strictEqual(memDb.prepare('SELECT status FROM play_tokens WHERE id = ?').get('run-frac').status, 'expired');

      // 3. Non-numeric score
      seedRun('run-nan');
      const resNaN = finishRun(1, 'run-nan', '10', { db: memDb, now: () => baseTime + 5000 });
      assert.deepStrictEqual(resNaN, { result: 'rejected' });
      assert.strictEqual(memDb.prepare('SELECT status FROM play_tokens WHERE id = ?').get('run-nan').status, 'expired');
    });

    it('returns alreadySaved when finishing twice (and the stored score is unchanged by a second, different score)', () => {
      const baseTime = 1000000;
      const startedAt = new Date(baseTime).toISOString();
      const expiresAt = new Date(baseTime + 900000).toISOString();

      memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '7', 'img', 'solved', ?)").run(expiresAt);
      memDb.prepare(
        `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at, started_at)
         VALUES ('run-idempotent', 1, 'p1', 'started', ?, ?, ?)`
      ).run(startedAt, expiresAt, startedAt);

      // First finish
      const first = finishRun(1, 'run-idempotent', 4, { db: memDb, now: () => baseTime + 3000 });
      assert.deepStrictEqual(first, { result: 'saved', score: 4 });

      // Second finish with a different score
      const second = finishRun(1, 'run-idempotent', 6, { db: memDb, now: () => baseTime + 4000 });
      assert.deepStrictEqual(second, { result: 'alreadySaved', score: 4 });

      // Ensure database maintains original score and finished state
      const row = memDb.prepare('SELECT status, score FROM play_tokens WHERE id = ?').get('run-idempotent');
      assert.strictEqual(row.status, 'finished');
      assert.strictEqual(row.score, 4);
    });

    it("returns notFound for another user's run", () => {
      const baseTime = 1000000;
      const startedAt = new Date(baseTime).toISOString();
      const expiresAt = new Date(baseTime + 900000).toISOString();

      memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '7', 'img', 'solved', ?)").run(expiresAt);
      memDb.prepare(
        `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at, started_at)
         VALUES ('run-alice', 1, 'p1', 'started', ?, ?, ?)`
      ).run(startedAt, expiresAt, startedAt);

      // Bob (user 2) tries to finish Alice's run
      const outcome = finishRun(2, 'run-alice', 3, { db: memDb, now: () => baseTime + 2000 });
      assert.deepStrictEqual(outcome, { result: 'notFound' });
    });

    it("returns notActive for an 'unused' token", () => {
      const expiresAt = new Date(Date.now() + 900000).toISOString();
      memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '7', 'img', 'solved', ?)").run(expiresAt);
      memDb.prepare(
        `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at)
         VALUES ('run-unused', 1, 'p1', 'unused', datetime('now'), ?)`
      ).run(expiresAt);

      const outcome = finishRun(1, 'run-unused', 3, { db: memDb });
      assert.deepStrictEqual(outcome, { result: 'notActive' });
    });

    it('returns expired for a run older than RUN_MAX_SECONDS', () => {
      const baseTime = 1000000;
      const startedAt = new Date(baseTime).toISOString();
      const expiresAt = new Date(baseTime + 900000).toISOString();

      memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '7', 'img', 'solved', ?)").run(expiresAt);
      memDb.prepare(
        `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at, started_at)
         VALUES ('run-timeout', 1, 'p1', 'started', ?, ?, ?)`
      ).run(startedAt, expiresAt, startedAt);

      // Finish at baseTime + (RUN_MAX_SECONDS + 5) seconds
      const expiredTime = baseTime + (config.runMaxSeconds + 5) * 1000;
      const outcome = finishRun(1, 'run-timeout', 5, {
        db: memDb,
        now: () => expiredTime,
      });

      assert.deepStrictEqual(outcome, { result: 'expired' });

      const row = memDb.prepare('SELECT status FROM play_tokens WHERE id = ?').get('run-timeout');
      assert.strictEqual(row.status, 'expired');
    });
  });

  describe('getLeaderboard querying and ranking', () => {
    it('uses best score per user, orders correctly, breaks ties by earlier achievement, never includes user ids, and returns the right rank for me', () => {
      const expiresAt = new Date(Date.now() + 900000).toISOString();

      // Helper to insert dummy finished runs
      const addFinished = (id, userId, score, finishedAt) => {
        memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES (?, ?, '1', 'img', 'solved', ?)").run(`p-${id}`, userId, expiresAt);
        memDb.prepare(
          `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at, started_at, finished_at, score)
           VALUES (?, ?, ?, 'finished', ?, ?, ?, ?, ?)`
        ).run(id, userId, `p-${id}`, finishedAt, expiresAt, finishedAt, finishedAt, score);
      };

      // Alice (user 1): run 1 = 10 at t=100, run 2 = 20 at t=200
      addFinished('t-a1', 1, 10, '2026-10-30T01:00:00Z');
      addFinished('t-a2', 1, 20, '2026-10-30T02:00:00Z');

      // Bob (user 2): run 1 = 20 at t=150 (achieved 20 earlier than Alice!)
      addFinished('t-b1', 2, 20, '2026-10-30T01:30:00Z');

      // Charlie (user 3): run 1 = 15 at t=110
      addFinished('t-c1', 3, 15, '2026-10-30T01:10:00Z');

      // Dave (user 4): run 1 = 5 at t=120
      addFinished('t-d1', 4, 5, '2026-10-30T01:20:00Z');

      // Request leaderboard with userId = 3 (Charlie)
      const result = getLeaderboard(10, 3, { db: memDb });

      // Verify array contents
      assert.strictEqual(result.length, 4);

      // Rank 1: Bob (20 at 01:30:00)
      assert.deepStrictEqual(result[0], {
        rank: 1,
        username: 'bob',
        bestScore: 20,
        achievedAt: '2026-10-30T01:30:00Z',
      });

      // Rank 2: Alice (20 at 02:00:00, tied with Bob but achieved later)
      assert.deepStrictEqual(result[1], {
        rank: 2,
        username: 'alice',
        bestScore: 20,
        achievedAt: '2026-10-30T02:00:00Z',
      });

      // Rank 3: Charlie (15)
      assert.deepStrictEqual(result[2], {
        rank: 3,
        username: 'charlie',
        bestScore: 15,
        achievedAt: '2026-10-30T01:10:00Z',
      });

      // Rank 4: Dave (5)
      assert.deepStrictEqual(result[3], {
        rank: 4,
        username: 'dave',
        bestScore: 5,
        achievedAt: '2026-10-30T01:20:00Z',
      });

      // Alice only appears once (score of 10 was superseded by 20)
      const aliceEntries = result.filter((r) => r.username === 'alice');
      assert.strictEqual(aliceEntries.length, 1);

      // Verify NO sensitive or user ID fields are present in any entry
      for (const entry of result) {
        assert.strictEqual(entry.user_id, undefined);
        assert.strictEqual(entry.id, undefined);
        assert.strictEqual(entry.password_hash, undefined);
      }

      // Verify 'me' for Charlie (user 3)
      assert.deepStrictEqual(result.me, {
        rank: 3,
        bestScore: 15,
      });

      // Verify 'me' for a user with no finished runs
      const unrankedResult = getLeaderboard(10, 999, { db: memDb });
      assert.strictEqual(unrankedResult.me, null);
    });
  });
});

