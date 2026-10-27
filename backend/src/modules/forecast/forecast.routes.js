import { Router } from 'express';
import {
  calculateForecastController,
  saveForecastController,
  getSavedForecastController,
} from './forecast.controller.js';
import { calculateForecastSchema } from './forecast.schema.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { optionalAuth, requireAuth } from '../auth/auth.middleware.js';

const router = Router();

// Public / optional auth calculation
router.post(
  '/calculate',
  optionalAuth,
  validateRequest(calculateForecastSchema, 'body'),
  calculateForecastController
);

// Authenticated user forecast storage
router.post(
  '/save',
  requireAuth,
  validateRequest(calculateForecastSchema, 'body'),
  saveForecastController
);

router.get('/saved', requireAuth, getSavedForecastController);

export default router;
