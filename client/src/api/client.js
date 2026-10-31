/**
 * Standard HTTP JSON request helper for client API calls.
 * Enforces same-origin credentials, JSON request bodies, and standardized error parsing.
 *
 * @param {string} endpoint - The relative API URL path (e.g., '/api/auth/login')
 * @param {RequestInit} [options] - Standard fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} The parsed JSON response body
 * @throws {Error & { status?: number, data?: any }} Standardized error with HTTP status
 */
export async function apiFetch(endpoint, options = {}) {
  const { headers = {}, body, ...restOptions } = options;

  const init = {
    credentials: 'same-origin',
    ...restOptions,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  };

  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(endpoint, init);
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

export default apiFetch;

