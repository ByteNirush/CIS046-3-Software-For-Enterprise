import { countAvailable, startRun } from '../services/tokenService.js';
import { finishRun, getUserGameProfile, abandonRun } from '../services/scoreService.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/game/status
 * Returns the count of unused tokens available to the logged-in user along with their game stats.
 */
export function getStatus(req, res, next) {
  try {
    const userId = req.session.userId || req.session.user?.id;
    const tokensAvailable = countAvailable(userId);
    const profile = getUserGameProfile(userId);

    return res.status(200).json({
      tokensAvailable,
      ...profile,
    });
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

/**
 * POST /api/game/finish
 * Concludes a game run by validating and saving the score.
 */
export function finish(req, res, next) {
  try {
    const userId = req.session.userId || req.session.user?.id;
    const { runId, score } = req.body || {};

    if (typeof runId !== 'string' || !UUID_REGEX.test(runId)) {
      return res.status(400).json({ error: 'Valid runId UUID is required' });
    }

    if (typeof score !== 'number' || Number.isNaN(score)) {
      return res.status(400).json({ error: 'Score must be a number' });
    }

    const outcome = finishRun(userId, runId, score);

    if (outcome.result === 'saved') {
      return res.status(200).json({ saved: true, score: outcome.score });
    }

    if (outcome.result === 'alreadySaved') {
      return res.status(200).json({ saved: true, score: outcome.score, alreadySaved: true });
    }

    if (outcome.result === 'notFound') {
      return res.status(404).json({ error: 'Run not found' });
    }

    if (outcome.result === 'notActive') {
      return res.status(409).json({ error: 'Run is no longer active' });
    }

    if (outcome.result === 'expired') {
      return res.status(410).json({ error: 'Run expired' });
    }

    if (outcome.result === 'rejected') {
      return res.status(422).json({ error: 'Score rejected' });
    }

    return res.status(500).json({ error: 'Unexpected error finalizing run' });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/game/abandon
 * Forfeits or cancels an active run.
 */
export function abandon(req, res, next) {
  try {
    const userId = req.session.userId || req.session.user?.id;
    const { runId } = req.body || {};

    if (typeof runId !== 'string' || !UUID_REGEX.test(runId)) {
      return res.status(400).json({ error: 'Valid runId UUID is required' });
    }

    const success = abandonRun(userId, runId);
    return res.status(200).json({ abandoned: success });
  } catch (err) {
    return next(err);
  }
}

export default {
  getStatus,
  start,
  finish,
  abandon,
};
