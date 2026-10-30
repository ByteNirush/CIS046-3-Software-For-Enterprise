import { countAvailable, startRun } from '../services/tokenService.js';

/**
 * GET /api/game/status
 * Returns the count of unused tokens available to the logged-in user.
 */
export function getStatus(req, res, next) {
  try {
    const userId = req.session.userId || req.session.user?.id;
    const tokensAvailable = countAvailable(userId);
    return res.status(200).json({ tokensAvailable });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/game/start
 * Consumes one unused token and starts a game session.
 */
export function start(req, res, next) {
  try {
    const userId = req.session.userId || req.session.user?.id;
    const run = startRun(userId);

    if (!run) {
      return res.status(403).json({ error: 'Solve a puzzle to unlock the game' });
    }

    return res.status(201).json(run);
  } catch (err) {
    return next(err);
  }
}

export default {
  getStatus,
  start,
};

