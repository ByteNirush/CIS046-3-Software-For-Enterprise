// Purpose: Express server entry point.
// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity) - standard Express setup boilerplate

import express from 'express';
import config from './config/index.js';

const app = express();

// Disable x-powered-by header
app.disable('x-powered-by');

// Limit JSON request bodies to 10kb
app.use(express.json({ limit: '10kb' }));

// API router
const apiRouter = express.Router();

// GET /api/health
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
  });
});

// JSON 404 handler for unmatched API routes
apiRouter.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Mount the API router
app.use('/api', apiRouter);

// Central error-handling middleware
app.use((err, req, res, next) => {
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
export default app;
