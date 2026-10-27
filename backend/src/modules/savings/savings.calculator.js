import { z } from 'zod';

/**
 * Legacy schema preserved for backward compatibility
 */
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
 * Phase 14: Smart Savings Engine Input Schema
 * Strict validation enforcing non-negative values, integer points, and currencies
 */
export const smartSavingsInputSchema = z.object({
  cashFare: z.coerce
    .number({ invalid_type_error: 'Cash fare must be a valid number' })
    .positive('Cash fare must be greater than 0'),
  cashCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Currency must be a 3-letter ISO code')
    .default('EUR'),
  pointsRequired: z.coerce
    .number({ invalid_type_error: 'Points required must be a valid number' })
    .int('Points required must be an integer')
    .positive('Points required must be greater than 0'),
  awardTaxesAndFees: z.coerce
    .number({ invalid_type_error: 'Award taxes and fees must be a number' })
    .nonnegative('Award taxes and fees cannot be negative')
    .default(0),
  awardCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Award currency must be a 3-letter ISO code')
    .default('EUR'),
  userConfiguredValuePerPoint: z.coerce
    .number({ invalid_type_error: 'Valuation must be a number' })
    .positive('Point valuation must be greater than 0')
    .default(0.013), // Default 0.013 (1.3 cents / point)
  loyaltyProgram: z.string().trim().max(128).optional().nullable(),
  userPointsBalance: z.coerce.number().int().nonnegative().optional().default(0),
  sourceType: z
    .enum(['user_entered', 'verified_provider', 'illustrative_demo'])
    .default('user_entered'),
});

/**
 * Phase 14: Pure Smart Savings Engine
 * 
 * Formulas applied:
 *   cash_savings = cash_fare - award_taxes_and_fees - value_of_points_used
 *   value_of_points_used = points_required * user_configured_value_per_point
 *   savings_percentage = (cash_savings / cash_fare) * 100
 *   value_per_point = (cash_fare - award_taxes_and_fees) / points_required
 */
export function calculateSmartSavings(input) {
  if (!input || typeof input !== 'object') {
    return {
      canCalculate: false,
      status: 'invalid_input',
      reason: 'No input parameters provided for savings calculation.',
    };
  }

  const cashFare = Number(input.cashFare);
  const cashCurrency = (input.cashCurrency || 'EUR').toUpperCase();
  const pointsRequired = Number(input.pointsRequired);
  const awardTaxesAndFees = Number(input.awardTaxesAndFees ?? 0);
  const awardCurrency = (input.awardCurrency || cashCurrency || 'EUR').toUpperCase();
  const userConfiguredValuePerPoint = Number(input.userConfiguredValuePerPoint ?? 0.013);
  const loyaltyProgram = input.loyaltyProgram ? String(input.loyaltyProgram).trim() : null;
  const userBalance = Number(input.userPointsBalance ?? 0);
  const sourceType = input.sourceType || 'user_entered';

  // 1. Guard against missing or non-numeric values
  if (isNaN(cashFare) || isNaN(pointsRequired) || isNaN(awardTaxesAndFees) || isNaN(userConfiguredValuePerPoint)) {
    return {
      canCalculate: false,
      status: 'missing_parameters',
      reason: 'Required financial calculation parameters are missing or non-numeric.',
    };
  }

  // 2. Guard against non-positive cash fare
  if (cashFare <= 0) {
    return {
      canCalculate: false,
      status: 'invalid_cash_fare',
      reason: 'Cash fare must be greater than 0 to evaluate savings.',
    };
  }

  // 3. Guard against zero or negative points
  if (pointsRequired <= 0) {
    return {
      canCalculate: false,
      status: 'invalid_points_required',
      reason: 'Award points required must be an integer greater than 0 to avoid division by zero.',
    };
  }

  // 4. Guard against negative taxes or valuation
  if (awardTaxesAndFees < 0 || userConfiguredValuePerPoint <= 0) {
    return {
      canCalculate: false,
      status: 'invalid_rates',
      reason: 'Award taxes cannot be negative and points valuation must be greater than 0.',
    };
  }

  // 5. Guard against currency mismatch
  if (cashCurrency !== awardCurrency) {
    return {
      canCalculate: false,
      status: 'currency_mismatch',
      reason: `Currency mismatch between cash fare (${cashCurrency}) and award taxes (${awardCurrency}). Convert to matching currency to evaluate savings.`,
      cashCurrency,
      awardCurrency,
    };
  }

  // 6. Execute mathematical formulas
  const valueOfPointsUsed = Number((pointsRequired * userConfiguredValuePerPoint).toFixed(2));
  const cashSavings = Number((cashFare - awardTaxesAndFees - valueOfPointsUsed).toFixed(2));
  const savingsPercentage = Number(((cashSavings / cashFare) * 100).toFixed(1));
  const netCashOffset = cashFare - awardTaxesAndFees;
  const valuePerPoint = Number((netCashOffset / pointsRequired).toFixed(5));
  const valuePerPointCents = Number((valuePerPoint * 100).toFixed(2));
  const valuationCents = Number((userConfiguredValuePerPoint * 100).toFixed(2));

  const isAwardCheaper = cashSavings > 0;
  const pointsShortfall = Math.max(0, pointsRequired - userBalance);
  const hasShortfall = pointsShortfall > 0;
  const shortfallOpportunityCost = Number((pointsShortfall * userConfiguredValuePerPoint).toFixed(2));

  let recommendation = '';
  if (netCashOffset <= 0) {
    recommendation = `Avoid using points here: Mandatory taxes and surcharges (${awardTaxesAndFees} ${cashCurrency}) equal or exceed the cash ticket price (${cashFare} ${cashCurrency}). Paying cash directly is strictly better.`;
  } else if (isAwardCheaper) {
    recommendation = `Redeeming points provides strong value: Your effective redemption rate of ${valuePerPointCents}¢/pt exceeds your baseline valuation of ${valuationCents}¢/pt, saving an estimated ${cashSavings} ${cashCurrency} (${savingsPercentage}% net).`;
  } else {
    recommendation = `Preserve your points: At ${valuePerPointCents}¢/pt, this redemption falls below your opportunity-cost baseline of ${valuationCents}¢/pt. Paying cash (${cashFare} ${cashCurrency}) is more cost-effective.`;
  }

  return {
    canCalculate: true,
    status: isAwardCheaper ? 'award_savings_favorable' : 'cash_fare_better_value',
    isAwardCheaper,
    currency: cashCurrency,
    cashFare,
    awardTaxesAndFees,
    pointsRequired,
    userConfiguredValuePerPoint,
    valuationCents,
    valueOfPointsUsed,
    cashSavings,
    savingsPercentage,
    valuePerPoint,
    valuePerPointCents,
    loyaltyProgram: loyaltyProgram || 'Airline Loyalty Program',
    userPointsBalance: userBalance,
    pointsShortfall,
    hasShortfall,
    shortfallOpportunityCost,
    sourceType,
    sourceLabel:
      sourceType === 'verified_provider'
        ? 'Verified Live Award Provider'
        : sourceType === 'illustrative_demo'
        ? 'Illustrative Benchmark'
        : 'User-Provided Estimate',
    recommendation,
    assumptions: [
      `Points opportunity cost is modeled at ${valuationCents} cents per point (${userConfiguredValuePerPoint} ${cashCurrency}/pt).`,
      `Award flights require out-of-pocket cash payment of ${awardTaxesAndFees} ${cashCurrency} for mandatory government/airport fees.`,
      sourceType === 'user_entered'
        ? 'Award points and taxes are self-reported user estimates and do not represent verified live airline inventory.'
        : 'Award seat availability is subject to airline booking inventory.',
    ],
    disclaimers: [
      'Valuation model represents estimated opportunity cost savings, not guaranteed cash disbursements.',
      'Always confirm saver seat availability directly on the airline portal before transferring bank points.',
    ],
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Legacy pure savings calculator (kept for backward compatibility with Phase 8/9 tests)
 */
export function calculateSavingsIntegrity(input) {
  const { cashPrice, currency, travelers, isRoundTrip, awardData } = input;

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

  const smartResult = calculateSmartSavings({
    cashFare: cashPrice,
    cashCurrency: currency || 'EUR',
    pointsRequired: awardData.pointsRequired,
    awardTaxesAndFees: awardData.taxesAndFees || 0,
    awardCurrency: currency || 'EUR',
    userConfiguredValuePerPoint: (awardData.pointValuationCents || 1.3) / 100,
    loyaltyProgram: awardData.program,
    userPointsBalance: awardData.userPointsBalance || 0,
    sourceType: 'illustrative_demo',
  });

  return {
    canCalculate: smartResult.canCalculate,
    status: smartResult.isAwardCheaper ? 'verified_savings' : 'cash_fare_better_value',
    cashPriceTotal: cashPrice,
    currency,
    travelers,
    isRoundTrip,
    awardOption: {
      program: smartResult.loyaltyProgram,
      pointsRequired: smartResult.pointsRequired,
      taxesAndFees: smartResult.awardTaxesAndFees,
      pointValuationCents: smartResult.valuationCents,
      totalHackedCostEur: Math.round(smartResult.valueOfPointsUsed + smartResult.awardTaxesAndFees),
      userPointsBalance: smartResult.userPointsBalance,
      pointsShortfall: smartResult.pointsShortfall,
      estimatedShortfallCost: Math.round(smartResult.pointsShortfall * (TYPICAL_BUY_POINTS_CENTS / 100)),
    },
    savingsAmount: Math.max(0, Math.round(smartResult.cashSavings)),
    savingsPercentage: Math.round(smartResult.savingsPercentage),
    isAwardCheaper: smartResult.isAwardCheaper,
    isVerifiedSavings: true,
    calculatedAt: smartResult.calculatedAt,
  };
}

export const saveRedemptionPlanSchema = z.object({
  id: z.string().max(64).optional(),
  origin: z.string().trim().toUpperCase().length(3, 'Origin must be a 3-letter IATA code'),
  destination: z.string().trim().toUpperCase().length(3, 'Destination must be a 3-letter IATA code'),
  cabin: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  departureDate: z.string().max(32).optional().nullable(),
  returnDate: z.string().max(32).optional().nullable(),
  carrier: z.string().trim().max(128).optional().nullable(),
  cashFare: z.coerce.number().positive('Cash fare must be greater than 0'),
  cashCurrency: z.string().trim().toUpperCase().length(3).default('EUR'),
  pointsRequired: z.coerce.number().int().positive('Points required must be greater than 0'),
  awardTaxesAndFees: z.coerce.number().nonnegative('Award taxes and fees cannot be negative').default(0),
  awardCurrency: z.string().trim().toUpperCase().length(3).default('EUR'),
  userConfiguredValuePerPoint: z.coerce.number().positive().default(0.013),
  loyaltyProgram: z.string().trim().max(128).optional().nullable(),
  userPointsBalance: z.coerce.number().int().nonnegative().optional().default(0),
  notes: z.string().max(1000).optional().nullable(),
});

