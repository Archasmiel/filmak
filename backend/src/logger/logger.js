import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../');

const resolvedLogDir = (() => {
  if (process.env.LOG_DIR) {
    return path.isAbsolute(process.env.LOG_DIR)
      ? process.env.LOG_DIR
      : path.join(projectRoot, process.env.LOG_DIR);
  }
  return path.join(projectRoot, 'logs');
})();

const logger = createLogger({
  level: 'info',
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
    new transports.File({ filename: path.join(resolvedLogDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(resolvedLogDir, 'combined.log') })
  ]
});

export default logger;
