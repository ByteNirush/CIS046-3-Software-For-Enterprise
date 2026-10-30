import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import config from './config/index.js';
import authRouter from './routes/auth.js';
import puzzleRouter from './routes/puzzle.js';
import gameRouter from './routes/game.js';
import leaderboardRouter from './routes/leaderboard.js';
import originCheck from './middleware/originCheck.js';
import { BananaServiceError } from './services/bananaService.js';

const app = express();

// Disable x-powered-by header
app.disable('x-powered-by');

// Helmet adds secure HTTP response headers (e.g., Strict-Transport-Security, X-Content-Type-Options,
// X-Frame-Options, Origin-Agent-Cluster, etc.) using safe default configurations.
// Because the backend exclusively serves a JSON API and does not serve HTML documents,
// no custom Content Security Policy (CSP) directive is configured.
app.use(helmet());

// Limit JSON request bodies to 10kb
app.use(express.json({ limit: '10kb' }));

// Reverse proxy configuration note:
// When deployed in production behind a reverse proxy (e.g., Nginx, Traefik, AWS ALB, Cloudflare),
// Express must have "trust proxy" configured (e.g., app.set('trust proxy', 1)) for secure cookies
// to work correctly over HTTPS. Do not enable it now in development.

// Session middleware
// NOTE: MemoryStore is used for development. It is not suitable for production
// because it leaks memory, cannot scale across multiple processes, and loses all sessions on restart.
app.use(
  session({
    name: 'banana.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new session.MemoryStore(),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.environment === 'production',
      maxAge: 2 * 60 * 60 * 1000, // 2-hour session expiry
    },
  })
);

// API router
const apiRouter = express.Router();

// Apply origin checking middleware on state-changing API requests (defense in depth)
apiRouter.use(originCheck);

// GET /api/health
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
  });
});

// Mount authentication routes at /api/auth
apiRouter.use('/auth', authRouter);

// Mount puzzle gate routes at /api/puzzle
apiRouter.use('/puzzle', puzzleRouter);

// Mount game routes at /api/game
apiRouter.use('/game', gameRouter);

// Mount leaderboard routes at /api/leaderboard
apiRouter.use('/leaderboard', leaderboardRouter);

// JSON 404 handler for unmatched API routes
apiRouter.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Mount the API router
app.use('/api', apiRouter);

// Central error-handling middleware
app.use((err, req, res, next) => {
  // Map BananaServiceError to 502 Bad Gateway with generic friendly message
  if (err instanceof BananaServiceError || err.name === 'BananaServiceError') {
    return res.status(502).json({
      error: 'Puzzle service is unavailable, please try again shortly',
    });
  }

  const status = err.status || err.statusCode || 500;
  const body = {
    error: err.message || 'Internal Server Error',
  };

  if (config.environment !== 'production' && err.stack) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
});

// Start the server
const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.environment} mode`);
});

export { app, server };
