import { apiFetch } from './client.js';

/**
 * Fetches the current game status, available play tokens, player stats, and active run.
 * @returns {Promise<{ tokensAvailable: number, personalBest?: number, totalGames?: number, rank?: number|null, recentRuns?: Array, activeRun?: object|null }>}
 */
export function getStatus() {
  return apiFetch('/api/game/status', {
    method: 'GET',
  });
}

/**
 * Starts a new game run by consuming one available token on the server.
 * @returns {Promise<{ runId: string, startedAt: string }>}
 */
export function startGame() {
  return apiFetch('/api/game/start', {
    method: 'POST',
    body: {},
  });
}

/**
 * Concludes a game run, submitting ONLY runId and score.
 * Never sends duration, level, or client-measured statistics.
 * @param {string} runId
 * @param {number} score
 * @returns {Promise<{ saved: boolean, score: number, alreadySaved?: boolean }>}
 */
export function finishGame(runId, score) {
  return apiFetch('/api/game/finish', {
    method: 'POST',
    body: { runId, score },
  });
}

/**
 * Forfeits or cancels an active run session.
 * @param {string} runId
 * @returns {Promise<{ abandoned: boolean }>}
 */
export function abandonGame(runId) {
  return apiFetch('/api/game/abandon', {
    method: 'POST',
    body: { runId },
  });
}

export default {
  getStatus,
  startGame,
  finishGame,
  abandonGame,
};
