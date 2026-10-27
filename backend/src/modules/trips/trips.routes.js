import { Router } from 'express';
import { listTrips, getTrip, createTrip, deleteTrip } from './trips.controller.js';
import { tripSchema } from './trips.schema.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { optionalAuth } from '../auth/auth.middleware.js';

const router = Router();

// Apply optionalAuth so logged-in users get scoped operations automatically
router.use(optionalAuth);

// GET /api/v1/trips - List saved trips (scoped to user if authenticated)
router.get('/', listTrips);

// POST /api/v1/trips - Persist trip with parameterized query and schema validation
router.post('/', validateRequest(tripSchema, 'body'), createTrip);

// GET /api/v1/trips/:id - Get specific saved trip
router.get('/:id', getTrip);

// DELETE /api/v1/trips/:id - Delete saved trip with ownership check
router.delete('/:id', deleteTrip);

export default router;
