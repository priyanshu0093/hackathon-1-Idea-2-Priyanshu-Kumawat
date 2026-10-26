import { errorResponse } from '../utils/apiResponse.js';

export function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const formatted = result.error.format();
      const firstIssue = result.error.issues[0]?.message || 'Validation failed';
      return errorResponse(res, firstIssue, 400, formatted, 'VALIDATION_ERROR');
    }

    req[source] = result.data;
    next();
  };
}
