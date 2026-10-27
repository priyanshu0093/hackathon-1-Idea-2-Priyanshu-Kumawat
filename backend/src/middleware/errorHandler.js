import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { errorResponse } from '../utils/apiResponse.js';

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error('Unhandled request error', {
    message: err.message,
    name: err.name,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  let statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  let code = err.code || 'INTERNAL_SERVER_ERROR';

  if (err.message && err.message.includes('CORS')) {
    statusCode = 403;
    code = 'CORS_ERROR';
  }

  const message = err.isOperational || env.NODE_ENV === 'development'
    ? err.message
    : 'An unexpected internal server error occurred.';

  return errorResponse(res, message, statusCode, null, code);
}

export function notFoundHandler(req, res) {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, null, 'NOT_FOUND');
}
