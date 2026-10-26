import { advisorInputSchema } from './advisor.validation.js';
import { advisorService } from './advisor.service.js';

export async function analyzeTripController(req, res, next) {
  try {
    const parseResult = advisorInputSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid advisor analysis request parameters',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const advice = await advisorService.analyzeTrip(parseResult.data);

    return res.status(200).json({
      status: 'success',
      data: advice,
    });
  } catch (error) {
    next(error);
  }
}
