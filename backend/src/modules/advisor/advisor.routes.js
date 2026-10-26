import { Router } from 'express';
import { analyzeTripController } from './advisor.controller.js';

const router = Router();

// POST /api/v1/advisor/analyze
router.post('/analyze', analyzeTripController);

export default router;
