// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve database path: if relative, resolve from server root (parent of db directory)
const resolvedDbPath = path.isAbsolute(config.databasePath)
  ? config.databasePath
  : path.resolve(__dirname, '..', config.databasePath);

// Ensure the directory exists
const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to SQLite database
const db = new Database(resolvedDbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Execute schema at startup
const schemaPath = path.resolve(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

export { db };
export default db;

