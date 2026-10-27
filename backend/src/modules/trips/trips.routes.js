import { Router } from 'express';
import { listTrips, getTrip, createTrip, deleteTrip } from './trips.controller.js';
import { tripSchema } from './trips.schema.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();

// GET /api/v1/trips - List all saved trips from Supabase PostgreSQL
router.get('/', listTrips);

// POST /api/v1/trips - Persist trip with parameterized query and schema validation
router.post('/', validateRequest(tripSchema, 'body'), createTrip);

// GET /api/v1/trips/:id - Get specific saved trip
router.get('/:id', getTrip);

// DELETE /api/v1/trips/:id - Delete saved trip
router.delete('/:id', deleteTrip);

export default router;
