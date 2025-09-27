/**
 * Request logging middleware.
 * Logs at the START of request, then updates with status + overall duration.
 * Avoided body logging to reduce risk of data exposure.
 */
import logger from '../logger/logger.js';

export default function requestLogger(req, res, next) {
  const start = performance.now();
  // Initial line (method + path)
  logger.info(`REQ_START method=${req.method} path=${req.originalUrl}`);

  res.on('finish', () => {
    const durationMs = (performance.now() - start).toFixed(1);
    logger.info(
      `REQ_END method=${req.method} path=${req.originalUrl} status=${res.statusCode} durationMs=${durationMs}`
    );
  });

  next();
}
