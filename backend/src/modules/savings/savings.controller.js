import { calculateSavingsIntegrity, savingsInputSchema } from './savings.calculator.js';
import { successResponse } from '../../utils/apiResponse.js';

export function calculateSavingsController(req, res, next) {
  try {
    const result = calculateSavingsIntegrity(req.body);
    return successResponse(res, result, {}, 200);
  } catch (err) {
    next(err);
  }
}
