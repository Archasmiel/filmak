/**
 * Minimal auth routes (register/login/refresh/logout).
 *
 * Notes for production:
 * - Replace in-memory stores with persistent DB.
 * - Rotate refresh tokens and store per-device/session.
 * - Use secure, HttpOnly cookies for refresh tokens and HTTPS in production.
 * - Never log raw passwords.
 */
import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../auth/tokens.js';
import { logAuth } from '../logger/log-events.js';
import pool from '../db.js';

const router = express.Router();

// We'll persist refresh tokens in the database (refresh_tokens table)

// Register: create a new user record in Postgres
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Check existing
    const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (exists.rowCount) return res.status(400).json({ error: 'Already exists' });

    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO users(id, username, email, password_hash) VALUES($1,$2,$3,$4)',
      [id, username, email || null, hash]
    );
    logAuth('register', id);
    res.status(201).json({ id, username, email });
  } catch (e) {
    console.error('Register error', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login: verify against Postgres
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT id, password_hash FROM users WHERE username = $1', [username]);
    if (!result.rowCount) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const payload = { sub: user.id, username };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

  // Persist refresh token in DB
  await pool.query('INSERT INTO refresh_tokens(token, user_id) VALUES($1, $2)', [refreshToken, user.id]);

    // Send refresh token as HttpOnly cookie (recommended)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logAuth('login', user.id);
    res.json({ accessToken });
  } catch (e) {
    console.error('Login error', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
          const payload = verifyRefreshToken(token);
          // Validate token exists in DB
          const found = await pool.query('SELECT token FROM refresh_tokens WHERE token = $1 AND user_id = $2', [token, payload.sub]);
  if (!found.rowCount) return res.status(401).json({ error: 'Invalid refresh token' });

    const newAccess = signAccessToken({ sub: payload.sub, username: payload.username });
    const newRefresh = signRefreshToken({ sub: payload.sub, username: payload.username });

  // rotate refresh token in DB: delete old and insert new
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  await pool.query('INSERT INTO refresh_tokens(token, user_id) VALUES($1, $2)', [newRefresh, payload.sub]);
    res.cookie('refreshToken', newRefresh, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'none', 
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: newAccess });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      // remove token from DB
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    } catch (e) {
      // ignore
    }
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none'
  });
  res.json({ ok: true });
});

export default router;

