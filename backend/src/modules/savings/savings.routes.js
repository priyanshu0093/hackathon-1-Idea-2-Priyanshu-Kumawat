import { Router } from 'express';
import {
  calculateSavingsController,
  calculateSmartSavingsController,
  saveRedemptionPlanController,
  getRedemptionPlansController,
  deleteRedemptionPlanController,
} from './savings.controller.js';
import {
  savingsInputSchema,
  smartSavingsInputSchema,
  saveRedemptionPlanSchema,
} from './savings.calculator.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

// Legacy calculate endpoint
router.post('/calculate', validateRequest(savingsInputSchema, 'body'), calculateSavingsController);

// Smart Savings calculation endpoint (open to unauthenticated & authenticated preview)
router.post('/smart-calculate', validateRequest(smartSavingsInputSchema, 'body'), calculateSmartSavingsController);

// Redemption Planner authenticated persistence endpoints
router.post('/redemptions', requireAuth, validateRequest(saveRedemptionPlanSchema, 'body'), saveRedemptionPlanController);
router.get('/redemptions', requireAuth, getRedemptionPlansController);
router.delete('/redemptions/:id', requireAuth, deleteRedemptionPlanController);

export default router;
