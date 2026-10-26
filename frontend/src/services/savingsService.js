import { calculateSavings } from '../lib/calculator';

/**
 * Service to generate savings comparisons from flight search offers
 * Adheres strictly to Section 8: Never invent hacked prices if award data is unavailable
 * 
 * @param {Object} flightData - Output from flightService
 * @param {Object} userPreferences - User's search preferences (travelers, userPointsBalance, tripType)
 * @returns {Object} Comprehensive comparison model
 */
export function buildSavingsComparison(flightData, userPreferences = {}) {
  if (!flightData) {
    return {
      canCalculate: false,
      reason: 'No valid flight data available for savings comparison.',
    };
  }

  if (flightData.isEmpty) {
    return {
      ...flightData,
      canCalculate: false,
      reason: flightData.message || 'No flights found for this route and date.',
    };
  }

  // If live search returned real cash fares but award seat inventory is unavailable
  if (!flightData.isDemo && (!flightData.offers?.pointsRequired || !flightData.awardInventory?.available)) {
    const cashTotal = flightData.offers?.cashPrice || flightData.price?.total || 0;
    const taxes = flightData.offers?.taxesAndFees || flightData.price?.taxesAndFees || 0;

    return {
      ...flightData,
      canCalculate: false,
      isCashOnly: true,
      failureReason: 'Live cash fare verified. Award seat inventory for this route is not currently available from award partners.',
      programName: 'Live Award Inventory Unavailable',
      transferBank: null,
      metrics: {
        canCalculate: false,
        totalCashPrice: cashTotal,
        totalTaxes: taxes,
        savingsEuro: 0,
        savingsPercentage: 0,
        isAwardCheaper: false,
        isVerifiedPrice: true,
        isDemo: false,
        currency: flightData.price?.currency || 'EUR',
        reason: 'Real-time award flight seat availability is unavailable from provider; cash fare displayed without speculative savings.',
      },
    };
  }

  const {
    cashPrice,
    pointsRequired,
    taxesAndFees,
    pointsProgram,
    transferBank,
  } = flightData.offers || {};

  const isRoundTrip = userPreferences.tripType === 'round_trip';
  const travelers = userPreferences.travelers || flightData.travelers || 1;
  const userPointsBalance = userPreferences.userPointsBalance || 0;

  // Run pure calculation engine
  const metrics = calculateSavings({
    cashPrice: cashPrice || flightData.price?.total || 0,
    pointsRequired,
    taxesAndFees: taxesAndFees || flightData.price?.taxesAndFees || 0,
    userPointsBalance,
    travelers,
    isRoundTrip,
    isDemo: flightData.isDemo ?? false,
  });

  return {
    ...flightData,
    metrics,
    programName: pointsProgram || 'Loyalty Program',
    transferBank,
    isCalculated: metrics.canCalculate,
    canCalculate: metrics.canCalculate,
    failureReason: metrics.reason,
  };
}
