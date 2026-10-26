import { calculateSavings } from '../lib/calculator';

/**
 * Service to generate savings comparisons from flight search offers
 * 
 * @param {Object} flightData - Output from flightService
 * @param {Object} userPreferences - User's search preferences (travelers, userPointsBalance, tripType)
 * @returns {Object} Comprehensive comparison model
 */
export function buildSavingsComparison(flightData, userPreferences = {}) {
  if (!flightData || !flightData.offers) {
    return {
      canCalculate: false,
      reason: 'No valid flight offers available for savings calculation.',
    };
  }

  const {
    cashPrice,
    pointsRequired,
    taxesAndFees,
    pointsProgram,
    transferBank,
  } = flightData.offers;

  const isRoundTrip = userPreferences.tripType === 'round_trip';
  const travelers = userPreferences.travelers || flightData.travelers || 1;
  const userPointsBalance = userPreferences.userPointsBalance || 0;

  // Run pure calculation engine
  const metrics = calculateSavings({
    cashPrice,
    pointsRequired,
    taxesAndFees,
    userPointsBalance,
    travelers,
    isRoundTrip,
    isDemo: flightData.isDemo ?? true,
  });

  return {
    ...flightData,
    metrics,
    programName: pointsProgram,
    transferBank,
    isCalculated: metrics.canCalculate,
    canCalculate: metrics.canCalculate,
    failureReason: metrics.reason,
  };
}
