import { verifyToken } from './auth.utils.js';
import { errorResponse } from '../../utils/apiResponse.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication required. Please provide a valid Bearer token.', 401, null, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.userId) {
    return errorResponse(res, 'Invalid or expired authentication token.', 401, null, 'INVALID_TOKEN');
  }

  req.user = {
    id: decoded.userId,
    email: decoded.email,
    name: decoded.name,
  };

  next();
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded && decoded.userId) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
      };
    }
  }
  next();
}
