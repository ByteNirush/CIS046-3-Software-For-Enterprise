import express from 'express';
import { getLeaderboardHandler } from '../controllers/leaderboardController.js';

const router = express.Router();

// GET /api/leaderboard - Public route returning top 10 players and session user rank
router.get('/', getLeaderboardHandler);

export default router;

