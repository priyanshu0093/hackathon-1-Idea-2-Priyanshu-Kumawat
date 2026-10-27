import { Router } from 'express';
import { searchFlightsController, getAwardAvailabilityController } from './flight.controller.js';
import { flightSearchSchema, awardSearchSchema } from './flight.validation.js';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = Router();

// POST /api/v1/flights/search - Search cash flight offers from real provider
router.post('/search', validateRequest(flightSearchSchema, 'body'), searchFlightsController);

// GET /api/v1/flights/award-search - Award availability check (query params)
router.get('/award-search', validateRequest(awardSearchSchema, 'query'), getAwardAvailabilityController);

// POST /api/v1/flights/award-search - Award availability check (body payload)
router.post('/award-search', validateRequest(awardSearchSchema, 'body'), getAwardAvailabilityController);

export default router;
