import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

import { errorResponse } from '../utils/apiResponse.js';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  handler: (req, res) => {
    return errorResponse(
      res,
      'Too many requests. Please slow down and try again shortly.',
      429,
      null,
      'RATE_LIMIT_EXCEEDED'
    );
  },
});
