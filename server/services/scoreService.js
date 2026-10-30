import defaultDb from '../db/index.js';
import config from '../config/index.js';
import { maxPlausibleScore } from '../config/gameRules.js';

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
 * Concludes a game run, executing plausibility checks and recording score inside a transaction.
 *
 * TRANSACTION EXPLANATION:
 * Validating the token state, checking expiry, verifying score plausibility, and updating
 * the row must be executed atomically. Running inside a single transaction prevents race conditions
 * where duplicate submission requests might attempt to finalize the same run concurrently.
 *
 * @param {number} userId - The user completing the run
 * @param {string} runId - The ID of the play token
 * @param {number} score - The score submitted by the client
 * @param {object} [options] - Optional overrides for database and clock injection in tests
 * @returns {{ result: string, score?: number }}
 */
export function finishRun(userId, runId, score, options = {}) {
  const dbToUse = getDb(options.db);
  const getNow = typeof options.now === 'function'
    ? options.now
    : () => (options.now instanceof Date ? options.now.getTime() : (typeof options.now === 'number' ? options.now : Date.now()));

  const tx = dbToUse.transaction(() => {
    // 1. Load play token by id AND user_id (prevents leaking existence of other users' runs)
    const token = dbToUse
      .prepare('SELECT id, user_id, status, started_at, score FROM play_tokens WHERE id = ? AND user_id = ?')
      .get(runId, userId);

    if (!token) {
      return { result: 'notFound' };
    }

    // 2. If already finished, return idempotently without mutating
    if (token.status === 'finished') {
      return { result: 'alreadySaved', score: token.score };
    }

    // 3. Ensure token was actually in 'started' state
    if (token.status !== 'started') {
      return { result: 'notActive' };
    }

    // 4. Server-side elapsed time computation
    const currentMs = getNow();
    const startedMs = new Date(token.started_at).getTime();
    const elapsedMs = currentMs - startedMs;

    // Check if run exceeded maximum allowed duration
    if (elapsedMs > config.runMaxSeconds * 1000) {
      dbToUse.prepare("UPDATE play_tokens SET status = 'expired' WHERE id = ?").run(runId);
      return { result: 'expired' };
    }

    // 5. Plausibility check
    const maxScore = maxPlausibleScore(elapsedMs);
    const isValidScore =
      typeof score === 'number' &&
      Number.isInteger(score) &&
      score >= 0 &&
      score <= maxScore;

    if (!isValidScore) {
      // Void run by setting status to expired
      dbToUse.prepare("UPDATE play_tokens SET status = 'expired' WHERE id = ?").run(runId);

      // Log only user id, category, and elapsed time (NEVER log the untrusted score)
      console.warn(`[Audit] Category: implausible score, User ID: ${userId}, Elapsed Time: ${elapsedMs}ms`);

      return { result: 'rejected' };
    }

    // 6. Record successful finish
    const finishedAt = new Date(currentMs).toISOString();
    dbToUse
      .prepare("UPDATE play_tokens SET status = 'finished', score = ?, finished_at = ? WHERE id = ?")
      .run(score, finishedAt, runId);

    return { result: 'saved', score };
  });

  return tx();
}

/**
 * Retrieves the global leaderboard of top players by their personal BEST finished score.
 *
 * SQL LOGIC AND TIE-BREAKING EXPLANATION:
 * 1. CTE `user_best`:
 *    Groups each user's finished runs (`status = 'finished' AND score IS NOT NULL`).
 *    Uses ROW_NUMBER() partitioned by `user_id` ordered by `score DESC` and `datetime(finished_at) ASC`
 *    to pick each player's highest score. Ties for the same player pick their earliest achievement.
 * 2. CTE `ranked_leaderboard`:
 *    Assigns a rank to each player ordered by `bestScore DESC`, breaking ties by whoever reached
 *    their score earlier (`datetime(achievedAt) ASC`), and finally `user_id ASC` for determinism.
 * 3. Security:
 *    Only `rank`, `username`, `bestScore`, and `achievedAt` are returned. User IDs, password hashes,
 *    and other private credentials are NEVER queried or returned.
 *
 * @param {number} [limit=10] - Number of top entries to return
 * @param {number} [userId] - Optional logged-in user ID to compute user's personal rank
 * @param {object} [options] - Optional custom database instance
 * @returns {Array<{ rank: number, username: string, bestScore: number, achievedAt: string }> & { me: { rank: number, bestScore: number } | null }}
 */
export function getLeaderboard(limit = 10, userId = null, options = {}) {
  const dbToUse = getDb(options.db);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));

  // Query top players
  const topRows = dbToUse
    .prepare(
      `WITH user_best AS (
        SELECT
          p.user_id,
          u.username,
          p.score AS bestScore,
          p.finished_at AS achievedAt,
          ROW_NUMBER() OVER (
            PARTITION BY p.user_id
            ORDER BY p.score DESC, datetime(p.finished_at) ASC, p.id ASC
          ) as rn
        FROM play_tokens p
        JOIN users u ON u.id = p.user_id
        WHERE p.status = 'finished' AND p.score IS NOT NULL
      ),
      ranked_leaderboard AS (
        SELECT
          user_id,
          username,
          bestScore,
          achievedAt,
          ROW_NUMBER() OVER (
            ORDER BY bestScore DESC, datetime(achievedAt) ASC, user_id ASC
          ) as rank
        FROM user_best
        WHERE rn = 1
      )
      SELECT rank, username, bestScore, achievedAt
      FROM ranked_leaderboard
      ORDER BY rank ASC
      LIMIT ?`
    )
    .all(safeLimit);

  // Compute 'me' if userId is provided
  let me = null;
  if (userId) {
    const meRow = dbToUse
      .prepare(
        `WITH user_best AS (
          SELECT
            p.user_id,
            p.score AS bestScore,
            p.finished_at AS achievedAt,
            ROW_NUMBER() OVER (
              PARTITION BY p.user_id
              ORDER BY p.score DESC, datetime(p.finished_at) ASC, p.id ASC
            ) as rn
          FROM play_tokens p
          WHERE p.status = 'finished' AND p.score IS NOT NULL
        ),
        ranked_leaderboard AS (
          SELECT
            user_id,
            bestScore,
            ROW_NUMBER() OVER (
              ORDER BY bestScore DESC, datetime(achievedAt) ASC, user_id ASC
            ) as rank
          FROM user_best
          WHERE rn = 1
        )
        SELECT rank, bestScore
        FROM ranked_leaderboard
        WHERE user_id = ?`
      )
      .get(userId);

    if (meRow) {
      me = {
        rank: meRow.rank,
        bestScore: meRow.bestScore,
      };
    }
  }

  const result = topRows.map((row) => ({
    rank: row.rank,
    username: row.username,
    bestScore: row.bestScore,
    achievedAt: row.achievedAt,
  }));

  result.leaderboard = result;
  result.entries = result;
  result.me = me;

  return result;
}

export default {
  finishRun,
  getLeaderboard,
  setDatabase,
  resetDatabase,
};

