// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

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

export const port = Number(process.env.PORT) || 3000;
export const environment = process.env.NODE_ENV || 'development';
export const env = environment;
export const sessionSecret = process.env.SESSION_SECRET;
export const bananaApiUrl = process.env.BANANA_API_URL || 'https://marcconrad.com/uob/banana/api.php?out=json';
export const databasePath = process.env.DATABASE_PATH || './data/banana.db';
export const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const config = {
  port,
  environment,
  env,
  sessionSecret,
  bananaApiUrl,
  databasePath,
  clientOrigin,
};

export default config;
