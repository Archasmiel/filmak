/**
 * JWT helper utilities.
 * - Sign and verify access and refresh tokens.
 * - Secrets and expirations are read from environment variables.
 *
 * Production notes:
 * - Keep secrets in secure storage (not committed). Use strong secrets.
 * - Access tokens should be short-lived; refresh tokens longer and rotated server-side.
 */
import jwt from 'jsonwebtoken';

export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, 
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, 
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}