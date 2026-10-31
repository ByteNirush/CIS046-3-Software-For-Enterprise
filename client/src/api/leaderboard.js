import { apiFetch } from './client.js';

/**
 * Fetches the top 10 global leaderboard and optional current user rank.
 * @returns {Promise<{
 *   leaderboard: Array<{ rank: number, username: string, bestScore: number, achievedAt: string }>,
 *   me: { rank: number, bestScore: number } | null
 * }>}
 */
export function getLeaderboard() {
  return apiFetch('/api/leaderboard', {
    method: 'GET',
  });
}

export default {
  getLeaderboard,
};
