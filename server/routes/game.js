import express from 'express';
import { getStatus, start, finish, abandon } from '../controllers/gameController.js';
import { requireLogin } from '../middleware/requireLogin.js';
import { gameLimiter } from '../middleware/rateLimiters.js';
import { requireJson } from '../middleware/requireJson.js';

const router = express.Router();

// ALL game routes are protected by requireLogin
router.use(requireLogin);

// Prevent client caching for dynamic game state and token balances
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// GET /api/game/status - returns { tokensAvailable, personalBest, totalGames, rank, recentRuns, activeRun }
router.get('/status', getStatus);

// POST /api/game/start - spends 1 token and begins run (requires application/json and rate-limited)
router.post('/start', gameLimiter, requireJson, start);

// POST /api/game/finish - records final score with server-side plausibility validation
router.post('/finish', gameLimiter, requireJson, finish);

// POST /api/game/abandon - forfeits active run
router.post('/abandon', gameLimiter, requireJson, abandon);

export default router;
