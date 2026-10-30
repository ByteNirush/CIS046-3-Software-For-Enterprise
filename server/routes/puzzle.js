import express from 'express';
import { createNewPuzzle, submitGuess } from '../controllers/puzzleController.js';
import { requireLogin } from '../middleware/requireLogin.js';
import { puzzleLimiter } from '../middleware/rateLimiters.js';
import { requireJson } from '../middleware/requireJson.js';

const router = express.Router();

// ALL puzzle routes are protected by requireLogin
router.use(requireLogin);

// POST /api/puzzle/new - creates a new puzzle (rate-limited by user session)
router.post('/new', puzzleLimiter, createNewPuzzle);

// POST /api/puzzle/:id/answer - submits a guess (requires application/json body)
router.post('/:id/answer', requireJson, submitGuess);

export default router;

