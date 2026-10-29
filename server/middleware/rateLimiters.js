// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

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

export default authRateLimiter;

