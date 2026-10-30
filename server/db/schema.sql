CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS puzzles (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  solution TEXT NOT NULL,
  image TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'solved', 'failed', 'expired')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_puzzles_user_id ON puzzles (user_id);

CREATE TABLE IF NOT EXISTS play_tokens (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  puzzle_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'started', 'finished', 'expired')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  score INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (puzzle_id) REFERENCES puzzles (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_play_tokens_user_id ON play_tokens (user_id);

