import { recommendationsService } from './recommendations.service.js';
import { fareSnapshotsRepository } from './recommendations.repository.js';
import {
  fareSnapshotInputSchema,
  bestTimeToBookInputSchema,
  bestCardRecommendationInputSchema,
  smartTripSavingsPlanInputSchema,
} from './recommendations.schema.js';

export async function saveFareSnapshotController(req, res) {
  const validated = fareSnapshotInputSchema.parse(req.body);
  const userId = req.user?.id || null;
  const snapshot = await recommendationsService.saveFareSnapshot(userId, validated);

  res.status(201).json({
    success: true,
    data: snapshot,
    message: 'Fare snapshot recorded successfully.',
  });
}

export async function getBestTimeToBookController(req, res) {
  const validated = bestTimeToBookInputSchema.parse(req.body);
  const userId = req.user?.id || null;
  const analysis = await recommendationsService.getBestTimeToBook({
    userId,
    ...validated,
  });

  res.status(200).json({
    success: true,
    data: analysis,
  });
}

export async function getBestCardRecommendationController(req, res) {
  const validated = bestCardRecommendationInputSchema.parse(req.body);
  const userId = req.user.id; // Protected by requireAuth
  const recommendation = await recommendationsService.getBestCardAndRewardsRecommendation(
    userId,
    validated
  );

  res.status(200).json({
    success: true,
    data: recommendation,
  });
}

export async function getSmartTripSavingsPlanController(req, res) {
  const validated = smartTripSavingsPlanInputSchema.parse(req.body);
  const userId = req.user?.id || null;
  const plan = await recommendationsService.getSmartTripSavingsPlan(userId, validated);

  res.status(200).json({
    success: true,
    data: plan,
  });
}

export async function listUserFareSnapshotsController(req, res) {
  const userId = req.user.id;
  const snapshots = await fareSnapshotsRepository.findByUserId(userId, 50);

  res.status(200).json({
    success: true,
    data: snapshots,
    total: snapshots.length,
  });
}
