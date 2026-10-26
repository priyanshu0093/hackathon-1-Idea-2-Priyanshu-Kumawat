/**
 * Standardized API Response helpers
 */

export function successResponse(res, data, meta = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

export function errorResponse(res, message, statusCode = 500, errors = null, code = 'INTERNAL_ERROR') {
  const payload = {
    success: false,
    error: {
      code,
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  if (errors) {
    payload.error.details = errors;
  }

  return res.status(statusCode).json(payload);
}
