/**
 * Pure, independently testable savings calculation engine for A Una Milla
 * 
 * Rules:
 * 1. Never subtract full cash ticket price from points amount and call it savings.
 * 2. Deduct award taxes and carrier fees from net cash savings.
 * 3. Calculate points shortfall if user has fewer points than required.
 * 4. Refuse calculation if cash price or required points are missing or non-positive.
 * 5. Clearly distinguish verified prices from estimates and illustrative demo data.
 */

// Default standard point valuation: 1.3 euro cents per point (0.013 EUR)
export const DEFAULT_POINT_VALUATION_CENTS = 1.3;

// Typical promotional cost to purchase airline miles if bridging a shortfall: 1.8 - 2.2 cents/pt
export const TYPICAL_BUY_POINTS_CENTS = 2.0;

/**
 * Calculates travel hacking financial metrics with strict validation
 * 
 * @param {Object} params
 * @param {number} params.cashPrice - Public retail cash fare in EUR
 * @param {number} params.pointsRequired - Number of loyalty points/miles required
 * @param {number} params.taxesAndFees - Out-of-pocket cash taxes and fees in EUR
 * @param {number} [params.userPointsBalance=0] - Points already owned by user
 * @param {number} [params.pointValuationCents=1.3] - Conservative valuation in cents per point
 * @param {number} [params.travelers=1] - Number of passengers
 * @param {boolean} [params.isRoundTrip=false] - Round trip flag
 * @param {boolean} [params.isDemo=true] - Whether this calculation is based on demo data
 * 
 * @returns {Object} Calculation result with financial breakdown and validity status
 */
export function calculateSavings({
  cashPrice,
  pointsRequired,
  taxesAndFees = 0,
  userPointsBalance = 0,
  pointValuationCents = DEFAULT_POINT_VALUATION_CENTS,
  travelers = 1,
  isRoundTrip = false,
  isDemo = true,
}) {
  // Guardrail 1: Check required numeric fields
  if (
    typeof cashPrice !== 'number' || 
    isNaN(cashPrice) || 
    cashPrice <= 0
  ) {
    return {
      canCalculate: false,
      reason: 'Valid retail cash fare is required for comparison.',
    };
  }

  if (
    typeof pointsRequired !== 'number' || 
    isNaN(pointsRequired) || 
    pointsRequired <= 0
  ) {
    return {
      canCalculate: false,
      reason: 'Valid award points requirement is required for comparison.',
    };
  }

  if (typeof taxesAndFees !== 'number' || isNaN(taxesAndFees) || taxesAndFees < 0) {
    return {
      canCalculate: false,
      reason: 'Taxes and fees must be a non-negative number.',
    };
  }

  const validTravelers = Math.max(1, Math.min(9, Number(travelers) || 1));
  const validUserBalance = Math.max(0, Number(userPointsBalance) || 0);
  const tripCashMultiplier = isRoundTrip ? 1.85 : 1.0;
  const tripPointsMultiplier = isRoundTrip ? 2.0 : 1.0;
  const tripTaxesMultiplier = isRoundTrip ? 1.7 : 1.0;

  // Total scaled amounts for itinerary and travelers
  const totalCashPrice = Math.round(cashPrice * tripCashMultiplier * validTravelers);
  const totalPoints = Math.round(pointsRequired * tripPointsMultiplier * validTravelers);
  const totalTaxes = Math.round(taxesAndFees * tripTaxesMultiplier * validTravelers);

  // Economic valuation of points (e.g. 30,000 points @ 1.3c = 390 EUR)
  const pointValueRate = Math.max(0.1, pointValuationCents) / 100;
  const estimatedPointsCost = Math.round(totalPoints * pointValueRate);

  // Total equivalent out-of-pocket & opportunity cost
  const totalHackedCost = estimatedPointsCost + totalTaxes;

  // Real Net Monetary Savings = Cash Fare - (Points Valuation + Taxes & Fees)
  const savingsEuro = totalCashPrice - totalHackedCost;

  // Check if award option is actually cheaper than cash
  const isAwardCheaper = savingsEuro > 0;
  const savingsPercentage = isAwardCheaper
    ? Math.min(95, Math.max(0, Math.round((savingsEuro / totalCashPrice) * 100)))
    : 0;

  // Points Shortfall calculation
  const pointsShortfall = Math.max(0, totalPoints - validUserBalance);
  const hasShortfall = pointsShortfall > 0;
  
  // Cost to bridge shortfall if buying miles during standard promotion
  const estimatedShortfallCostEuro = hasShortfall
    ? Math.round(pointsShortfall * (TYPICAL_BUY_POINTS_CENTS / 100))
    : 0;

  return {
    canCalculate: true,
    totalCashPrice,
    totalPoints,
    totalTaxes,
    estimatedPointsCost,
    totalHackedCost,
    savingsEuro: Math.max(0, savingsEuro),
    savingsPercentage,
    isAwardCheaper,
    pointValuationCents,
    // Shortfall metrics
    userPointsBalance: validUserBalance,
    pointsShortfall,
    hasShortfall,
    estimatedShortfallCostEuro,
    // Integrity metadata
    travelers: validTravelers,
    isRoundTrip,
    isDemo,
    isVerifiedPrice: !isDemo,
    calculatedAt: new Date().toISOString(),
  };
}
