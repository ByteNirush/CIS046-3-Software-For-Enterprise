import { getLeaderboard } from '../services/scoreService.js';

/**
 * GET /api/leaderboard
 * Public handler that returns top 10 players and optional personal rank for logged-in user.
 */
export function getLeaderboardHandler(req, res, next) {
  try {
    const userId = req.session?.userId || req.session?.user?.id || null;
    const result = getLeaderboard(10, userId);

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      leaderboard: Array.from(result),
      me: result.me || null,
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  getLeaderboardHandler,
};

