import { Router } from 'express';
import { getAirportsController } from './airport.controller.js';

const router = Router();

// GET /api/v1/airports?q=mad
router.get('/', getAirportsController);

export default router;
