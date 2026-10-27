import { calculateSavingsIntegrity, calculateSmartSavings, smartSavingsInputSchema } from './savings.calculator.js';
import { savingsService } from './savings.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export function calculateSavingsController(req, res, next) {
  try {
    const result = calculateSavingsIntegrity(req.body);
    return successResponse(res, result, {}, 200);
  } catch (err) {
    next(err);
  }
}

export function calculateSmartSavingsController(req, res, next) {
  try {
    const result = savingsService.calculate(req.validatedBody || req.body);
    return successResponse(res, result, {}, 200);
  } catch (err) {
    next(err);
  }
}

export async function saveRedemptionPlanController(req, res, next) {
  try {
    const saved = await savingsService.saveRedemptionPlan(req.user.id, req.validatedBody || req.body);
    return res.status(201).json({
      success: true,
      data: saved,
      message: 'Smart redemption comparison saved successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getRedemptionPlansController(req, res, next) {
  try {
    const plans = await savingsService.getRedemptionPlans(req.user.id);
    return res.status(200).json({
      success: true,
      data: plans,
      meta: {
        count: plans.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteRedemptionPlanController(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await savingsService.deleteRedemptionPlan(req.user.id, id);
    return res.status(200).json({
      success: true,
      data: deleted,
      message: 'Redemption plan removed successfully',
    });
  } catch (err) {
    next(err);
  }
}
