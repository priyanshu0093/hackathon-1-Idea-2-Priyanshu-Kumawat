import { Router } from 'express';
import {
  saveFareSnapshotController,
  getBestTimeToBookController,
  getBestCardRecommendationController,
  getSmartTripSavingsPlanController,
  listUserFareSnapshotsController,
} from './recommendations.controller.js';
import { requireAuth, optionalAuth } from '../auth/auth.middleware.js';

const router = Router();

// 1. Best Time to Book & Fare Tracking
router.post('/fare-snapshots', optionalAuth, saveFareSnapshotController);
router.get('/fare-snapshots', requireAuth, listUserFareSnapshotsController);
router.post('/best-time-to-book', optionalAuth, getBestTimeToBookController);

// 2. Best Card & Rewards Recommendation (Strict user data isolation)
router.post('/best-card-rewards', requireAuth, getBestCardRecommendationController);

// 3. Smart Trip Savings Plan
router.post('/trip-savings-plan', optionalAuth, getSmartTripSavingsPlanController);

export default router;
