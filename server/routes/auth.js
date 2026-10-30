// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

import express from 'express';
import { signup, login, logout, getMe } from '../controllers/authController.js';
import { authRateLimiter } from '../middleware/rateLimiters.js';
import { requireLogin } from '../middleware/requireLogin.js';
import { requireJson } from '../middleware/requireJson.js';

const router = express.Router();

router.post('/signup', authRateLimiter, requireJson, signup);
router.post('/login', authRateLimiter, requireJson, login);
router.post('/logout', logout);
router.get('/me', requireLogin, getMe);

export default router;
