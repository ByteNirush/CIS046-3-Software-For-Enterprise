import { apiFetch } from './client.js';

/**
 * Requests a new mathematical puzzle from the server.
 * @returns {Promise<{ id: string, image: string, expiresAt: string, maxAttempts: number }>}
 */
export function newPuzzle() {
  return apiFetch('/api/puzzle/new', {
    method: 'POST',
  });
}

/**
 * Submits an answer guess for an active puzzle.
 * @param {string} id - The puzzle UUID
 * @param {string} guess - A single digit ("0" through "9")
 * @returns {Promise<{ correct: boolean, unlocked?: boolean, attemptsLeft?: number, failed?: boolean }>}
 */
export function submitAnswer(id, guess) {
  return apiFetch(`/api/puzzle/${id}/answer`, {
    method: 'POST',
    body: { guess },
  });
}

export default {
  newPuzzle,
  submitAnswer,
};
