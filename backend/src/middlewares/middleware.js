/**
 * Infrastructure middleware:
 *  - requestLogger: logs method/path/status/duration on response finish
 *  - notFoundHandler: returns consistent 404 JSON (no duplicate logging)
 *  - errorHandler: central error capture and logging (last middleware)
 *
 * Production notes:
 * - Keep requestLogger registered before routes.
 * - Do NOT log again inside notFoundHandler to avoid duplicates.
 */
import { performance } from 'perf_hooks';
import { logApiRequest, logError } from '../logger/log-events.js';
import { verifyAccessToken } from '../auth/tokens.js';

export function requestLogger(req, res, next) {
  const start = performance.now();

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - start);
    logApiRequest(req.method, req.originalUrl, res.statusCode, durationMs);
  });

  next();
}

export function notFoundHandler(req, res, next) {
  // Request logger will record the 404 with duration — return a clean response
  res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(err, req, res, next) {
  // Log error with path and method context, do not leak stack to clients
  logError(err, { path: req.originalUrl, method: req.method });
  res.status(err.status || 500).json({ error: 'Internal Server Error' });
}

/**
 * Simple bearer-token guard for future protected REST endpoints.
 * Attaches decoded payload to req.user on success.
 */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}