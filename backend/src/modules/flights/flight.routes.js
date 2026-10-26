import { Router } from 'express';
import { searchFlightsController, getAwardAvailabilityController } from './flight.controller.js';
import { flightSearchSchema } from './flight.validation.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();

// POST /api/v1/flights/search - Search cash flight offers from real provider
router.post('/search', validateRequest(flightSearchSchema, 'body'), searchFlightsController);

// GET /api/v1/flights/award-search - Award availability check (explicitly separated per Section 6)
router.get('/award-search', getAwardAvailabilityController);

export default router;
