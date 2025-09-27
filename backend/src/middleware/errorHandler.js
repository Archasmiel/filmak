/**
 * Central error handler (last middleware).
 * Converts any thrown / forwarded error into a uniform JSON response.
 * Avoids leaking stack traces to clients (kept in logs).
 */
import logger from '../logger/logger.js';

export default function errorHandler(err, req, res, next) {
  // Log full stack for diagnostics
  logger.error(`UNCAUGHT_ERROR path=${req.originalUrl} message=${err.message}`, {
    stack: err.stack
  });

  // Basic response (customize if needed)
  res.status(err.status || 500).json({
    error: 'Internal Server Error'
  });
}
