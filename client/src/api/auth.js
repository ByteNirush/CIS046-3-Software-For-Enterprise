import { apiFetch } from './client.js';

/**
 * Registers a new player account.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ user: { id: number, username: string } }>}
 */
export function signup(username, password) {
  return apiFetch('/api/auth/signup', {
    method: 'POST',
    body: { username, password },
  });
}

/**
 * Authenticates an existing player.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ user: { id: number, username: string } }>}
 */
export function login(username, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}

/**
 * Ends the authenticated session and clears the session cookie.
 * @returns {Promise<{ ok: boolean }>}
 */
export function logout() {
  return apiFetch('/api/auth/logout', {
    method: 'POST',
  });
}

/**
 * Fetches the currently authenticated session user, if any.
 * @returns {Promise<{ user: { id: number, username: string } | null }>}
 */
export function getMe() {
  return apiFetch('/api/auth/me', {
    method: 'GET',
  });
}

export default {
  signup,
  login,
  logout,
  getMe,
};
