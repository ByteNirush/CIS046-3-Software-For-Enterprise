// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

import bcrypt from 'bcrypt';
import db from '../db/index.js';

// Fixed dummy hash for nonexistent users to mitigate username-enumeration timing differences
const DUMMY_HASH = '$2b$12$pvasGTeRsuVx7SY6Vjm6R.zHSvgLOkVW2w5zsMBggfXAaMlOL5I2G';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function signup(req, res, next) {
  const { username, password } = req.body || {};

  if (!username || typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
    return res.status(400).json({
      error: 'Username must be 3–20 characters long and contain only letters, numbers, and underscores.',
    });
  }

  if (
    !password ||
    typeof password !== 'string' ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      error: 'Password must be between 8 and 72 characters.',
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    const info = stmt.run(username, passwordHash);
    const userId = Number(info.lastInsertRowid);

    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      req.session.user = { id: userId, username };
      req.session.save((saveErr) => {
        if (saveErr) {
          return next(saveErr);
        }
        return res.status(201).json({ user: { id: userId, username } });
      });
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || (error.message && error.message.includes('UNIQUE constraint failed'))) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    return next(error);
  }
}

export async function login(req, res, next) {
  const { username, password } = req.body || {};

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  try {
    const stmt = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE');
    const user = stmt.get(username);

    const hashToCompare = user ? user.password_hash : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      req.session.user = { id: user.id, username: user.username };
      req.session.save((saveErr) => {
        if (saveErr) {
          return next(saveErr);
        }
        return res.status(200).json({ user: { id: user.id, username: user.username } });
      });
    });
  } catch (error) {
    return next(error);
  }
}

export function logout(req, res, next) {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('banana.sid');
      return res.status(200).json({ ok: true });
    });
  } else {
    res.clearCookie('banana.sid');
    return res.status(200).json({ ok: true });
  }
}

export function getMe(req, res) {
  return res.status(200).json({ user: req.session.user });
}

