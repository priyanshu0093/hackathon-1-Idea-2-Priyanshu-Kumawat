import { describe, it, expect } from 'vitest';
import { calculateSavings, calculateSmartSavings, DEFAULT_POINT_VALUATION_CENTS } from './calculator';

describe('calculateSavings', () => {
  it('correctly calculates net monetary savings and accounts for award taxes and fees', () => {
    // Madrid to New York cash €1,000 vs 30,000 pts + €100 taxes
    // Points valued at 1.3 cents = €390.
    // Total hacked cost = €390 + €100 = €490.
    // Net savings = €1,000 - €490 = €510.
    // Savings percentage = round((510 / 1000) * 100) = 51%
    const result = calculateSavings({
      cashPrice: 1000,
      pointsRequired: 30000,
      taxesAndFees: 100,
      userPointsBalance: 30000,
      travelers: 1,
      isRoundTrip: false,
    });

    expect(result.canCalculate).toBe(true);
    expect(result.totalCashPrice).toBe(1000);
    expect(result.totalPoints).toBe(30000);
    expect(result.totalTaxes).toBe(100);
    expect(result.estimatedPointsCost).toBe(390);
    expect(result.totalHackedCost).toBe(490);
    expect(result.savingsEuro).toBe(510);
    expect(result.savingsPercentage).toBe(51);
    expect(result.isAwardCheaper).toBe(true);
    expect(result.hasShortfall).toBe(false);
    expect(result.pointsShortfall).toBe(0);
  });

  it('never treats the full cash price as pure savings without subtracting point valuation and taxes', () => {
    const result = calculateSavings({
      cashPrice: 800,
      pointsRequired: 20000,
      taxesAndFees: 80,
      pointValuationCents: 1.3,
    });

    // If flawed logic were used: savings would be €800.
    // With correct logic: Points cost = 20000 * 0.013 = €260. Taxes = €80. Total cost = €340.
    // Net savings = 800 - 340 = €460.
    expect(result.savingsEuro).not.toBe(800);
    expect(result.savingsEuro).toBe(460);
  });

  it('correctly identifies and computes points shortfall when user lacks sufficient points', () => {
    const result = calculateSavings({
      cashPrice: 900,
      pointsRequired: 50000,
      taxesAndFees: 75,
      userPointsBalance: 20000,
      travelers: 1,
    });

    expect(result.hasShortfall).toBe(true);
    expect(result.pointsShortfall).toBe(30000);
    // Estimated shortfall cost at typical 2.0 cents/pt = 30000 * 0.02 = €600
    expect(result.estimatedShortfallCostEuro).toBe(600);
  });

  it('scales correctly for multiple travelers and round trips', () => {
    const single = calculateSavings({
      cashPrice: 500,
      pointsRequired: 20000,
      taxesAndFees: 50,
      travelers: 1,
      isRoundTrip: false,
    });

    const twoTravelers = calculateSavings({
      cashPrice: 500,
      pointsRequired: 20000,
      taxesAndFees: 50,
      travelers: 2,
      isRoundTrip: false,
    });

    expect(twoTravelers.totalCashPrice).toBe(single.totalCashPrice * 2);
    expect(twoTravelers.totalPoints).toBe(single.totalPoints * 2);
    expect(twoTravelers.totalTaxes).toBe(single.totalTaxes * 2);
    expect(twoTravelers.savingsEuro).toBe(single.savingsEuro * 2);
  });

  it('rejects invalid inputs when cash price or points required are missing or non-positive', () => {
    const missingCash = calculateSavings({
      cashPrice: 0,
      pointsRequired: 25000,
    });
    expect(missingCash.canCalculate).toBe(false);
    expect(missingCash.reason).toBeDefined();

    const negativeCash = calculateSavings({
      cashPrice: -150,
      pointsRequired: 25000,
    });
    expect(negativeCash.canCalculate).toBe(false);

    const missingPoints = calculateSavings({
      cashPrice: 600,
      pointsRequired: 0,
    });
    expect(missingPoints.canCalculate).toBe(false);

    const negativeTaxes = calculateSavings({
      cashPrice: 600,
      pointsRequired: 25000,
      taxesAndFees: -20,
    });
    expect(negativeTaxes.canCalculate).toBe(false);
  });

  it('marks demo data explicitly', () => {
    const demoResult = calculateSavings({
      cashPrice: 800,
      pointsRequired: 20000,
      isDemo: true,
    });
    expect(demoResult.isDemo).toBe(true);
    expect(demoResult.isVerifiedPrice).toBe(false);

    const verifiedResult = calculateSavings({
      cashPrice: 800,
      pointsRequired: 20000,
      isDemo: false,
    });
    expect(verifiedResult.isDemo).toBe(false);
    expect(verifiedResult.isVerifiedPrice).toBe(true);
  });
});

describe('calculateSmartSavings (Phase 14 Specification)', () => {
  it('implements mandated cash_savings, value_of_points, percentage and value_per_point formulas', () => {
    // cash_fare = 415, points = 17000, taxes = 65, valuation = 0.013
    // value_of_points = 17000 * 0.013 = 221
    // cash_savings = 415 - 65 - 221 = 129
    // savings_percentage = (129 / 415) * 100 = 31.1%
    // value_per_point = (415 - 65) / 17000 = 350 / 17000 = 0.020588 -> 2.06 cents
    const res = calculateSmartSavings({
      cashFare: 415,
      pointsRequired: 17000,
      awardTaxesAndFees: 65,
      userConfiguredValuePerPoint: 0.013,
      loyaltyProgram: 'British Airways Executive Club',
    });

    expect(res.canCalculate).toBe(true);
    expect(res.cashSavings).toBe(129);
    expect(res.valueOfPointsUsed).toBe(221);
    expect(res.savingsPercentage).toBe(31.1);
    expect(res.valuePerPointCents).toBe(2.06);
    expect(res.isAwardCheaper).toBe(true);
  });

  it('rejects zero points and invalid inputs', () => {
    expect(calculateSmartSavings({ cashFare: 500, pointsRequired: 0 }).canCalculate).toBe(false);
    expect(calculateSmartSavings({ cashFare: -500, pointsRequired: 10000 }).canCalculate).toBe(false);
    expect(calculateSmartSavings({ cashFare: 500, pointsRequired: 10000, awardTaxesAndFees: -10 }).canCalculate).toBe(false);
  });

  it('rejects currency mismatch', () => {
    expect(calculateSmartSavings({
      cashFare: 500,
      cashCurrency: 'EUR',
      pointsRequired: 10000,
      awardCurrency: 'USD',
    }).canCalculate).toBe(false);
  });
});

