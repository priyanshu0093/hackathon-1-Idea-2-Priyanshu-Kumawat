import { Router } from 'express';
import { calculateSavingsController } from './savings.controller.js';
import { savingsInputSchema } from './savings.calculator.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();

// POST /api/v1/savings/calculate
router.post('/calculate', validateRequest(savingsInputSchema, 'body'), calculateSavingsController);

export default router;
