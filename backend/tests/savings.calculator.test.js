import { describe, it, expect } from 'vitest';
import { calculateSavingsIntegrity } from '../src/modules/savings/savings.calculator.js';

describe('Savings Calculator Integrity Rules', () => {
  it('refuses to claim savings when award data is unavailable', () => {
    const input = {
      cashPrice: 750,
      currency: 'EUR',
      travelers: 1,
      isRoundTrip: false,
      awardData: {
        available: false,
      },
    };

    const result = calculateSavingsIntegrity(input);
    expect(result.canCalculate).toBe(false);
    expect(result.status).toBe('award_data_unavailable');
    expect(result.savingsAmount).toBe(0);
    expect(result.savingsPercentage).toBe(0);
    expect(result.isVerifiedSavings).toBe(false);
  });

  it('calculates verified net savings when comparable award data is available', () => {
    const input = {
      cashPrice: 1200,
      currency: 'EUR',
      travelers: 1,
      isRoundTrip: true,
      awardData: {
        available: true,
        program: 'Iberia Plus Avios',
        pointsRequired: 42000,
        taxesAndFees: 180,
        pointValuationCents: 1.3, // 42000 * 0.013 = 546 EUR
        userPointsBalance: 50000,
      },
    };

    const result = calculateSavingsIntegrity(input);
    expect(result.canCalculate).toBe(true);
    expect(result.status).toBe('verified_savings');
    // Total Hacked Cost = 546 EUR (points value) + 180 (taxes) = 726 EUR
    // Net Savings = 1200 - 726 = 474 EUR
    expect(result.savingsAmount).toBe(474);
    expect(result.savingsPercentage).toBe(40);
    expect(result.isAwardCheaper).toBe(true);
    expect(result.isVerifiedSavings).toBe(true);
    expect(result.awardOption.pointsShortfall).toBe(0);
  });

  it('identifies when cash fare is actually better value than points option', () => {
    const input = {
      cashPrice: 300,
      currency: 'EUR',
      travelers: 1,
      isRoundTrip: false,
      awardData: {
        available: true,
        program: 'Expensive Program',
        pointsRequired: 25000, // 25000 * 0.013 = 325 EUR
        taxesAndFees: 80,      // total = 405 EUR
        pointValuationCents: 1.3,
      },
    };

    const result = calculateSavingsIntegrity(input);
    expect(result.canCalculate).toBe(true);
    expect(result.status).toBe('cash_fare_better_value');
    expect(result.isAwardCheaper).toBe(false);
    expect(result.savingsAmount).toBe(0);
  });

  it('computes points shortfall and estimated cost to bridge it', () => {
    const input = {
      cashPrice: 1000,
      currency: 'EUR',
      travelers: 1,
      isRoundTrip: false,
      awardData: {
        available: true,
        program: 'Flying Blue',
        pointsRequired: 30000,
        taxesAndFees: 100,
        userPointsBalance: 10000,
      },
    };

    const result = calculateSavingsIntegrity(input);
    expect(result.awardOption.pointsShortfall).toBe(20000);
    // 20000 points @ 2.0 cents/pt = 400 EUR
    expect(result.awardOption.estimatedShortfallCost).toBe(400);
  });
});
