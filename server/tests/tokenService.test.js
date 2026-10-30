import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import { createPuzzle, checkAnswer } from '../services/puzzleService.js';
import {
  createTokenForPuzzle,
  expireStaleTokens,
  countAvailable,
  startRun,
} from '../services/tokenService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Play Tokens and Game Runs (tokenService)', () => {
  let memDb;

  beforeEach(() => {
    // Fresh in-memory SQLite database for each test
    memDb = new Database(':memory:');
    memDb.pragma('foreign_keys = ON');

    // Apply schema
    const schemaPath = path.resolve(__dirname, '../db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    memDb.exec(schemaSql);

    // Seed test users
    memDb.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(1, 'alice', 'hash1');
    memDb.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(2, 'bob', 'hash2');
  });

  it('a correct answer creates exactly one token', async () => {
    const mockBanana = async () => ({
      image: 'mock-img-data',
      solution: '5',
    });

    const puzzle = await createPuzzle(1, memDb, mockBanana);
    const result = checkAnswer(1, puzzle.id, '5', memDb);

    assert.deepStrictEqual(result, { correct: true, unlocked: true });

    // Verify token exists in database
    const tokens = memDb.prepare('SELECT * FROM play_tokens WHERE user_id = ?').all(1);
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].user_id, 1);
    assert.strictEqual(tokens[0].puzzle_id, puzzle.id);
    assert.strictEqual(tokens[0].status, 'unused');
    assert.ok(tokens[0].id);
    assert.ok(tokens[0].expires_at);

    // Verify available count is 1
    assert.strictEqual(countAvailable(1, memDb), 1);
  });

  it('a wrong answer creates none', async () => {
    const mockBanana = async () => ({
      image: 'mock-img-data',
      solution: '5',
    });

    const puzzle = await createPuzzle(1, memDb, mockBanana);
    const result = checkAnswer(1, puzzle.id, '3', memDb);

    assert.strictEqual(result.correct, false);

    // Verify no tokens exist in database
    const tokens = memDb.prepare('SELECT * FROM play_tokens WHERE user_id = ?').all(1);
    assert.strictEqual(tokens.length, 0);
    assert.strictEqual(countAvailable(1, memDb), 0);
  });

  it('startRun spends the oldest unused token', () => {
    const olderTime = new Date(Date.now() - 60 * 1000).toISOString();
    const newerTime = new Date().toISOString();
    const expiry = new Date(Date.now() + 600 * 1000).toISOString();

    // Create fake puzzle records first to satisfy foreign keys
    memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '5', 'img', 'solved', ?)").run(expiry);
    memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p2', 1, '8', 'img', 'solved', ?)").run(expiry);

    // Insert two tokens for user 1: one older, one newer
    memDb.prepare(
      `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at)
       VALUES ('old-token', 1, 'p1', 'unused', ?, ?)`
    ).run(olderTime, expiry);

    memDb.prepare(
      `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at)
       VALUES ('new-token', 1, 'p2', 'unused', ?, ?)`
    ).run(newerTime, expiry);

    assert.strictEqual(countAvailable(1, memDb), 2);

    // Start run
    const run = startRun(1, memDb);
    assert.ok(run);
    assert.strictEqual(run.runId, 'old-token', 'Must spend the oldest unused token');
    assert.ok(run.startedAt);

    // Verify token states in database
    const oldRow = memDb.prepare('SELECT status, started_at FROM play_tokens WHERE id = ?').get('old-token');
    assert.strictEqual(oldRow.status, 'started');
    assert.strictEqual(oldRow.started_at, run.startedAt);

    const newRow = memDb.prepare('SELECT status FROM play_tokens WHERE id = ?').get('new-token');
    assert.strictEqual(newRow.status, 'unused');

    // 1 token left
    assert.strictEqual(countAvailable(1, memDb), 1);
  });

  it('a second startRun with no tokens returns null', () => {
    const expiry = new Date(Date.now() + 600 * 1000).toISOString();
    memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '5', 'img', 'solved', ?)").run(expiry);
    createTokenForPuzzle(memDb, 1, 'p1');

    // First start spends the only token
    const firstRun = startRun(1, memDb);
    assert.ok(firstRun);
    assert.ok(firstRun.runId);

    // Second start has no unused tokens remaining
    const secondRun = startRun(1, memDb);
    assert.strictEqual(secondRun, null);
  });

  it('an expired token cannot be started', () => {
    const pastExpiry = new Date(Date.now() - 10 * 1000).toISOString();
    const createdAt = new Date(Date.now() - 1000 * 1000).toISOString();

    memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '5', 'img', 'solved', ?)").run(pastExpiry);
    memDb.prepare(
      `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at)
       VALUES ('expired-tok', 1, 'p1', 'unused', ?, ?)`
    ).run(createdAt, pastExpiry);

    // startRun should find no valid token and mark it expired
    const run = startRun(1, memDb);
    assert.strictEqual(run, null);

    const row = memDb.prepare('SELECT status FROM play_tokens WHERE id = ?').get('expired-tok');
    assert.strictEqual(row.status, 'expired');
    assert.strictEqual(countAvailable(1, memDb), 0);
  });

  it('a token of another user cannot be used', () => {
    const expiry = new Date(Date.now() + 600 * 1000).toISOString();
    memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '5', 'img', 'solved', ?)").run(expiry);
    createTokenForPuzzle(memDb, 1, 'p1');

    // Bob (user 2) tries to start a run
    const bobRun = startRun(2, memDb);
    assert.strictEqual(bobRun, null);

    // Alice's token remains unused
    assert.strictEqual(countAvailable(1, memDb), 1);
    assert.strictEqual(countAvailable(2, memDb), 0);
  });

  it('two quick startRun calls with one token only succeed once', () => {
    const expiry = new Date(Date.now() + 600 * 1000).toISOString();
    memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '5', 'img', 'solved', ?)").run(expiry);
    createTokenForPuzzle(memDb, 1, 'p1');

    // Call startRun twice in succession
    const run1 = startRun(1, memDb);
    const run2 = startRun(1, memDb);

    assert.ok(run1);
    assert.strictEqual(run2, null);
    assert.strictEqual(countAvailable(1, memDb), 0);
  });

  it('a started token older than RUN_MAX_SECONDS counts as expired', () => {
    const pastStartedAt = new Date(Date.now() - (config.runMaxSeconds + 30) * 1000).toISOString();
    const expiry = new Date(Date.now() + 600 * 1000).toISOString();

    memDb.prepare("INSERT INTO puzzles (id, user_id, solution, image, status, expires_at) VALUES ('p1', 1, '5', 'img', 'solved', ?)").run(expiry);
    memDb.prepare(
      `INSERT INTO play_tokens (id, user_id, puzzle_id, status, created_at, expires_at, started_at)
       VALUES ('stale-run', 1, 'p1', 'started', ?, ?, ?)`
    ).run(pastStartedAt, expiry, pastStartedAt);

    // expireStaleTokens should mark it expired
    expireStaleTokens(1, memDb);

    const row = memDb.prepare('SELECT status FROM play_tokens WHERE id = ?').get('stale-run');
    assert.strictEqual(row.status, 'expired');
  });
});

