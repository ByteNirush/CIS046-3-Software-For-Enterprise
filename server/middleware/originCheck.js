import config from '../config/index.js';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Origin validation middleware for state-changing HTTP requests.
 *
 * NOTE:
 * This acts as defense-in-depth against cross-site requests in addition to SameSite=Lax
 * session cookies. If an Origin header is sent by a browser and does not match
 * the configured clientOrigin (e.g. http://localhost:5173 or dev localhost ports),
 * the request is rejected with 403.
 * Requests without an Origin header (e.g., server-to-server or curl requests) are permitted.
 * Note that this is not a full CSRF token system.
 */
export function originCheck(req, res, next) {
  if (STATE_CHANGING_METHODS.has(req.method)) {
    const origin = req.headers.origin;
    if (origin) {
      // In development, allow localhost/127.0.0.1 on any port (e.g. Vite dynamic fallback 5173, 5174)
      const isAllowed =
        origin === config.clientOrigin ||
        (config.environment !== 'production' &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));

      if (!isAllowed) {
        return res.status(403).json({ error: 'Bad origin' });
      }
    }
  }
  next();
}

export default originCheck;
