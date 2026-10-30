async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

/**
 * Fetches the top 10 global leaderboard and optional current user rank.
 * @returns {Promise<{ leaderboard: Array<{ rank: number, username: string, bestScore: number, achievedAt: string }>, me: { rank: number, bestScore: number } | null }>}
 */
export async function getLeaderboard() {
  const response = await fetch('/api/leaderboard', {
    method: 'GET',
    credentials: 'same-origin',
  });
  return handleResponse(response);
}

export default {
  getLeaderboard,
};

