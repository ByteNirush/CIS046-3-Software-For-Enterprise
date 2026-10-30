import express from 'express';
import { getStatus, start } from '../controllers/gameController.js';
import { requireLogin } from '../middleware/requireLogin.js';
import { gameLimiter } from '../middleware/rateLimiters.js';
import { requireJson } from '../middleware/requireJson.js';

const router = express.Router();

// ALL game routes are protected by requireLogin
router.use(requireLogin);

// GET /api/game/status - returns { tokensAvailable: <number> }
router.get('/status', getStatus);

// POST /api/game/start - spends 1 token and begins run (requires application/json and rate-limited)
router.post('/start', gameLimiter, requireJson, start);

export default router;

