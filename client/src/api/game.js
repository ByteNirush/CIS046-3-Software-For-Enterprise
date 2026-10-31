import { apiFetch } from './client.js';

/**
 * Fetches the current game status, including the count of available play tokens.
 * @returns {Promise<{ tokensAvailable: number }>}
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

export default {
  getStatus,
  startGame,
  finishGame,
};
