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

const router = express.Router();

// In-memory stores for simplicity (NOT for production)
const users = new Map(); // email -> { id, email, passwordHash }
const refreshStore = new Map(); // userId -> refreshToken

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (users.has(email)) return res.status(400).json({ error: 'Already exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: crypto.randomUUID(), email, passwordHash: hash };
  users.set(email, user);
  logAuth('register', user.id);
  res.status(201).json({ id: user.id, email: user.email });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const payload = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Persist refresh token (simple store for demo)
  refreshStore.set(user.id, refreshToken);

  // Send refresh token as HttpOnly cookie (recommended)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  logAuth('login', user.id);
  res.json({ accessToken });
});

router.post('/refresh', (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = verifyRefreshToken(token);
    const stored = refreshStore.get(payload.sub);
    if (stored !== token) return res.status(401).json({ error: 'Invalid refresh token' });

    const newAccess = signAccessToken({ sub: payload.sub, email: payload.email });
    const newRefresh = signRefreshToken({ sub: payload.sub, email: payload.email });

    // rotate refresh token in store
    refreshStore.set(payload.sub, newRefresh);
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

router.post('/logout', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      refreshStore.delete(payload.sub);
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

