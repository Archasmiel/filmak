/**
 * Semantic logging helpers.
 * Use these in controllers to keep log messages consistent and searchable.
 *
 * Examples:
 *  logApiRequest('GET', '/api/films', 200, 12);
 *  logAuth('login', userId);
 *  logLikeDislike('like', userId, filmId);
 *  logComment(userId, filmId, commentId);
 *
 * Production notes:
 * - Avoid logging sensitive values (passwords, tokens).
 * - Prefer IDs and short contextual info.
 */
import logger from './logger.js';

export function logApiRequest(method, path, status, durationMs, meta = {}) {
  logger.info(`API_REQUEST method=${method} path=${path} status=${status} duration=${durationMs}`, meta);
}

export function logAuth(action, userId, meta = {}) {
  logger.info(`AUTH action=${action} userId=${userId}`, meta);
}

export function logLikeDislike(action, userId, filmId, meta = {}) {
  logger.info(`REACTION action=${action} userId=${userId} filmId=${filmId}`, meta);
}

export function logComment(userId, filmId, commentId, meta = {}) {
  logger.info(`COMMENT_ADD userId=${userId} filmId=${filmId} commentId=${commentId}`, meta);
}

export function logError(err, context = {}) {
  // Log full stack and structured context for diagnostics
  logger.error(`ERROR name=${err.name} message=${err.message}`, {
    stack: err.stack,
    ...context
  });
}
