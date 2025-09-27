/**
 * Logging helpers.
 * Used in controllers, log lines stay consistent & searchable.
 */
import logger from './logger.js';

// Generic API request log
export function logApiRequest(method, path, status, ms, meta = {}) {
  logger.info(`API_REQUEST method=${method} path=${path} status=${status} durationMs=${ms}`, meta);
}

// Authentication events (register / login)
export function logAuth(action, userId, meta = {}) {
  logger.info(`AUTH action=${action} userId=${userId}`, meta);
}

// Likes / dislikes for rating
export function logLikeDislike(action, userId, filmId, meta = {}) {
  logger.info(`REACTION action=${action} userId=${userId} filmId=${filmId}`, meta);
}

// Comment added on film
export function logComment(userId, filmId, commentId, meta = {}) {
  logger.info(`COMMENT_ADD userId=${userId} filmId=${filmId} commentId=${commentId}`, meta);
}

// Explicit error logging when manually catching
export function logError(err, context = {}) {
  logger.error(`ERROR name=${err.name} message=${err.message}`, {
    stack: err.stack,
    ...context
  });
}
