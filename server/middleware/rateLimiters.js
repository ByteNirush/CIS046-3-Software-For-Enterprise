import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

export const puzzleLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 requests per 10 minutes per logged-in user
  standardHeaders: true,
  legacyHeaders: false,
  // Keyed by req.session.userId as required
  keyGenerator: (req) => String(req.session?.userId || req.session?.user?.id || 'guest'),
  validate: { keyGeneratorIpFallback: false },
  message: { error: 'Too many puzzles requested, slow down' },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

export const gameLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per logged-in user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.session?.userId || req.session?.user?.id || 'guest'),
  validate: { keyGeneratorIpFallback: false },
  message: { error: 'Too many requests, slow down' },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

export default {
  authRateLimiter,
  puzzleLimiter,
  gameLimiter,
};
