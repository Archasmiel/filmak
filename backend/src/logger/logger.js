/**
 * Winston logger configuration.
 * - Console: colorized output for developers.
 * - Files: error.log (errors only) and combined.log (all levels).
 * - logDir is resolved via util/path-utils; logs directory lives outside src.
 *
 * Production notes:
 * - Use LOG_LEVEL env var (info by default). For debugging use 'debug'.
 * - Consider log rotation (winston-daily-rotate-file) for high volume.
 */
import { createLogger, format, transports } from 'winston';
import path from 'path';
import { logDir } from '../util/path-utils.js';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
      return `${timestamp} ${level.toUpperCase()} ${message}${metaString}`;
    })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
          return `${timestamp} ${level} ${message}${metaString}`;
        })
      )
    }),
    // Persistent logs (stored in backend/logs by default)
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logDir, 'combined.log') })
  ]
});

export default logger;
