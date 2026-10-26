import { logger } from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logMethod = statusCode >= 500 ? logger.error : statusCode >= 400 ? logger.warn : logger.info;

    logMethod(`${method} ${originalUrl} ${statusCode} - ${duration}ms`, {
      ip,
      statusCode,
      durationMs: duration,
    });
  });

  next();
}
