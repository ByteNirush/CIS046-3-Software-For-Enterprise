import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env relative to this file
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const PLACEHOLDER_SECRETS = [
  'replace-with-a-random-session-secret',
  'placeholder_session_secret_replace_in_production',
];

const secret = process.env.SESSION_SECRET;

if (!secret || !secret.trim() || PLACEHOLDER_SECRETS.includes(secret.trim())) {
  throw new Error(
    'Fatal: SESSION_SECRET is missing or still uses the default .env.example placeholder. Please provide a valid secret.'
  );
}

// Validation helper for positive integers
function parsePositiveInteger(value, name, defaultValue) {
  const val = value !== undefined && value !== '' ? value : defaultValue;
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`Fatal: ${name} must be a positive integer, got "${value}"`);
  }
  return num;
}

// Banana API URL validation
const rawBananaUrl = process.env.BANANA_API_URL || 'http://marcconrad.com/uob/banana/api.php';
try {
  const parsed = new URL(rawBananaUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Protocol must be http or https');
  }
} catch (err) {
  throw new Error(`Fatal: BANANA_API_URL is invalid ("${rawBananaUrl}"): ${err.message}`);
}

export const port = Number(process.env.PORT) || 3000;
export const environment = process.env.NODE_ENV || 'development';
export const env = environment;
export const sessionSecret = process.env.SESSION_SECRET;
export const bananaApiUrl = rawBananaUrl;
export const puzzleTtlSeconds = parsePositiveInteger(process.env.PUZZLE_TTL_SECONDS, 'PUZZLE_TTL_SECONDS', 120);
export const puzzleMaxAttempts = parsePositiveInteger(process.env.PUZZLE_MAX_ATTEMPTS, 'PUZZLE_MAX_ATTEMPTS', 3);
export const bananaTimeoutMs = parsePositiveInteger(process.env.BANANA_TIMEOUT_MS, 'BANANA_TIMEOUT_MS', 5000);
export const databasePath = process.env.DATABASE_PATH || './data/banana.db';
export const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const playTokenTtlSeconds = parsePositiveInteger(process.env.PLAY_TOKEN_TTL_SECONDS, 'PLAY_TOKEN_TTL_SECONDS', 900);
export const runMaxSeconds = parsePositiveInteger(process.env.RUN_MAX_SECONDS, 'RUN_MAX_SECONDS', 600);

const config = {
  port,
  environment,
  env,
  sessionSecret,
  bananaApiUrl,
  puzzleTtlSeconds,
  puzzleMaxAttempts,
  bananaTimeoutMs,
  databasePath,
  clientOrigin,
  playTokenTtlSeconds,
  runMaxSeconds,
};

export default config;
