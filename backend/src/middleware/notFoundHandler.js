/**
 * 404 handler.
 * Must be registered AFTER all routes.
 * Sends JSON consistently; logs once.
 */
import logger from '../logger/logger.js';

export default function notFoundHandler(req, res, next) {
  logger.info(`API_404 method=${req.method} path=${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found' });
}
