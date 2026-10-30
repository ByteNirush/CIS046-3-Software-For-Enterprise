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
 * Fetches the current game status, including the count of available play tokens.
 * @returns {Promise<{ tokensAvailable: number }>}
 */
export async function getStatus() {
  const response = await fetch('/api/game/status', {
    method: 'GET',
    credentials: 'same-origin',
  });
  return handleResponse(response);
}

/**
 * Starts a new game run by consuming one available token on the server.
 * @returns {Promise<{ runId: string, startedAt: string }>}
 */
export async function startGame() {
  const response = await fetch('/api/game/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    credentials: 'same-origin',
  });
  return handleResponse(response);
}

export default {
  getStatus,
  startGame,
};

