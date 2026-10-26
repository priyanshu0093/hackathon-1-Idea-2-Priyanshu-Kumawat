import { z } from 'zod';

export const savingsInputSchema = z.object({
  cashPrice: z.number().positive('Cash price must be greater than 0'),
  currency: z.string().default('EUR'),
  travelers: z.number().int().min(1).max(9).default(1),
  isRoundTrip: z.boolean().default(false),
  awardData: z
    .object({
      available: z.boolean(),
      program: z.string().nullable().optional(),
      pointsRequired: z.number().positive().nullable().optional(),
      taxesAndFees: z.number().nonnegative().nullable().optional(),
      pointValuationCents: z.number().positive().default(1.3),
      userPointsBalance: z.number().nonnegative().default(0),
    })
    .nullable()
    .optional(),
});

export const TYPICAL_BUY_POINTS_CENTS = 2.0;

/**
 * Pure savings calculator strictly adhering to financial integrity rules
 */
export function calculateSavingsIntegrity(input) {
  const { cashPrice, currency, travelers, isRoundTrip, awardData } = input;

  // If award data is missing or unavailable, we CANNOT claim genuine savings (Rule 8)
  if (!awardData || !awardData.available || !awardData.pointsRequired) {
    return {
      canCalculate: false,
      status: 'award_data_unavailable',
      reason: 'Verified award seat availability is not available for this route. Only cash fare is verified.',
      cashPriceTotal: cashPrice,
      currency,
      travelers,
      isRoundTrip,
      awardOption: null,
      savingsAmount: 0,
      savingsPercentage: 0,
      isVerifiedSavings: false,
    };
  }

  const pointsRequired = awardData.pointsRequired;
  const taxesAndFees = awardData.taxesAndFees || 0;
  const pointValuationCents = awardData.pointValuationCents || 1.3;
  const userBalance = awardData.userPointsBalance || 0;

  // Opportunity cost of points
  const pointsValuationEur = (pointsRequired * (pointValuationCents / 100));
  const totalHackedCostEur = pointsValuationEur + taxesAndFees;

  // Real Net Monetary Savings = Cash Fare - (Points Valuation + Taxes & Fees)
  const netSavings = cashPrice - totalHackedCostEur;
  const isAwardCheaper = netSavings > 0;
  const savingsPercentage = isAwardCheaper ? Math.round((netSavings / cashPrice) * 100) : 0;

  // Shortfall metrics
  const pointsShortfall = Math.max(0, pointsRequired - userBalance);
  const estimatedShortfallCost = Math.round(pointsShortfall * (TYPICAL_BUY_POINTS_CENTS / 100));

  return {
    canCalculate: true,
    status: isAwardCheaper ? 'verified_savings' : 'cash_fare_better_value',
    cashPriceTotal: cashPrice,
    currency,
    travelers,
    isRoundTrip,
    awardOption: {
      program: awardData.program || 'Loyalty Program',
      pointsRequired,
      taxesAndFees,
      pointValuationCents,
      totalHackedCostEur: Math.round(totalHackedCostEur),
      userPointsBalance: userBalance,
      pointsShortfall,
      estimatedShortfallCost,
    },
    savingsAmount: Math.max(0, Math.round(netSavings)),
    savingsPercentage,
    isAwardCheaper,
    isVerifiedSavings: true,
    calculatedAt: new Date().toISOString(),
  };
}
