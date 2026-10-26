import { logger } from '../utils/logger.js';
import { errorResponse } from '../utils/apiResponse.js';

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error('Unhandled request error', {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.isOperational || process.env.NODE_ENV === 'development'
    ? err.message
    : 'An unexpected internal server error occurred.';

  return errorResponse(res, message, statusCode, null, code);
}

export function notFoundHandler(req, res) {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, null, 'NOT_FOUND');
}
