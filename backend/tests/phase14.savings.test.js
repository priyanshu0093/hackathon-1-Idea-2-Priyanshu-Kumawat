import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { calculateSmartSavings } from '../src/modules/savings/savings.calculator.js';
import { tripsRepository } from '../src/modules/trips/trips.repository.js';
import { isDbConnected } from '../src/config/database.js';

describe('Phase 14: Smart Savings Engine & Calculator Formulas', () => {
  it('applies exact Phase 14 formulas for positive net savings', () => {
    // Formula check:
    // cash_fare = 450
    // points_required = 15,000
    // award_taxes = 60
    // value_per_point = 0.013 (1.30 cents)
    // value_of_points_used = 15,000 * 0.013 = 195.00
    // cash_savings = 450 - 60 - 195 = 195.00
    // savings_percentage = (195 / 450) * 100 = 43.3%
    // value_per_point = (450 - 60) / 15000 = 390 / 15000 = 0.026 (2.60 cents/pt)
    const result = calculateSmartSavings({
      cashFare: 450,
      cashCurrency: 'EUR',
      pointsRequired: 15000,
      awardTaxesAndFees: 60,
      awardCurrency: 'EUR',
      userConfiguredValuePerPoint: 0.013,
      loyaltyProgram: 'Iberia Plus',
      userPointsBalance: 20000,
    });

    expect(result.canCalculate).toBe(true);
    expect(result.cashFare).toBe(450);
    expect(result.pointsRequired).toBe(15000);
    expect(result.awardTaxesAndFees).toBe(60);
    expect(result.valueOfPointsUsed).toBe(195);
    expect(result.cashSavings).toBe(195);
    expect(result.savingsPercentage).toBe(43.3);
    expect(result.valuePerPoint).toBe(0.026);
    expect(result.valuePerPointCents).toBe(2.6);
    expect(result.isAwardCheaper).toBe(true);
    expect(result.assumptions).toBeInstanceOf(Array);
    expect(result.assumptions.length).toBeGreaterThan(0);
  });

  it('correctly calculates negative savings when retail cash is better than points redemption', () => {
    // cash_fare = 200
    // points = 25,000 @ 0.013 = 325
    // taxes = 50
    // value_of_points_used = 325
    // cash_savings = 200 - 50 - 325 = -175
    // savings_percentage = (-175 / 200) * 100 = -87.5%
    // value_per_point = (200 - 50) / 25000 = 150 / 25000 = 0.006 (0.60 cents/pt)
    const result = calculateSmartSavings({
      cashFare: 200,
      cashCurrency: 'EUR',
      pointsRequired: 25000,
      awardTaxesAndFees: 50,
      awardCurrency: 'EUR',
      userConfiguredValuePerPoint: 0.013,
      loyaltyProgram: 'Expensive Points Co',
    });

    expect(result.canCalculate).toBe(true);
    expect(result.cashSavings).toBe(-175);
    expect(result.savingsPercentage).toBe(-87.5);
    expect(result.valuePerPointCents).toBe(0.6);
    expect(result.isAwardCheaper).toBe(false);
    expect(result.recommendation).toContain('Paying cash');
  });

  it('rejects zero points and invalid inputs defensively', () => {
    const zeroPoints = calculateSmartSavings({
      cashFare: 500,
      pointsRequired: 0,
      awardTaxesAndFees: 50,
    });
    expect(zeroPoints.canCalculate).toBe(false);
    expect(zeroPoints.reason).toContain('Award points required must be an integer greater than 0');

    const negativePoints = calculateSmartSavings({
      cashFare: 500,
      pointsRequired: -5000,
      awardTaxesAndFees: 50,
    });
    expect(negativePoints.canCalculate).toBe(false);

    const negativeFare = calculateSmartSavings({
      cashFare: -100,
      pointsRequired: 15000,
      awardTaxesAndFees: 50,
    });
    expect(negativeFare.canCalculate).toBe(false);

    const negativeTaxes = calculateSmartSavings({
      cashFare: 500,
      pointsRequired: 15000,
      awardTaxesAndFees: -10,
    });
    expect(negativeTaxes.canCalculate).toBe(false);
  });

  it('rejects currency mismatches without conversion rates', () => {
    const mismatch = calculateSmartSavings({
      cashFare: 500,
      cashCurrency: 'EUR',
      pointsRequired: 15000,
      awardTaxesAndFees: 60,
      awardCurrency: 'USD',
    });
    expect(mismatch.canCalculate).toBe(false);
    expect(mismatch.reason).toContain('Currency mismatch');
  });

  it('handles user points shortfall transparently', () => {
    const withShortfall = calculateSmartSavings({
      cashFare: 600,
      cashCurrency: 'EUR',
      pointsRequired: 40000,
      awardTaxesAndFees: 80,
      userPointsBalance: 15000,
    });

    expect(withShortfall.hasShortfall).toBe(true);
    expect(withShortfall.pointsShortfall).toBe(25000);
    // 25,000 * 0.013 = 325.00
    expect(withShortfall.shortfallOpportunityCost).toBe(325);
  });
});

describe('Phase 14: Smart Savings API Endpoints & Multi-User Security', () => {
  let userAId;
  let userBId;
  let userAToken;
  let userBToken;
  let savedPlanId;

  beforeAll(async () => {
    if (!isDbConnected()) return;

    // Create User A
    const userAEmail = `test.savings.a.${Date.now()}@example.com`;
    const resA = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: userAEmail, password: 'Password123!', fullName: 'User A Savings' });
    userAId = resA.body.data.user.id;
    userAToken = resA.body.data.token;

    // Create User B
    const userBEmail = `test.savings.b.${Date.now()}@example.com`;
    const resB = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: userBEmail, password: 'Password123!', fullName: 'User B Savings' });
    userBId = resB.body.data.user.id;
    userBToken = resB.body.data.token;
  });

  it('POST /api/v1/savings/smart-calculate returns calculated metrics without saving', async () => {
    const res = await request(app)
      .post('/api/v1/savings/smart-calculate')
      .send({
        cashFare: 600,
        cashCurrency: 'EUR',
        pointsRequired: 25000,
        awardTaxesAndFees: 80,
        awardCurrency: 'EUR',
        userConfiguredValuePerPoint: 0.013,
        loyaltyProgram: 'Flying Blue',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // value_of_points = 25000 * 0.013 = 325
    // cash_savings = 600 - 80 - 325 = 195
    expect(res.body.data.cashSavings).toBe(195);
    expect(res.body.data.isAwardCheaper).toBe(true);
  });

  it('POST /api/v1/savings/smart-calculate rejects zero points with 400', async () => {
    const res = await request(app)
      .post('/api/v1/savings/smart-calculate')
      .send({
        cashFare: 600,
        pointsRequired: 0,
        awardTaxesAndFees: 80,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/savings/redemptions requires authentication', async () => {
    const res = await request(app)
      .post('/api/v1/savings/redemptions')
      .send({
        origin: 'MAD',
        destination: 'JFK',
        cashFare: 500,
        pointsRequired: 20000,
        awardTaxesAndFees: 60,
      });

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/savings/redemptions persists plan with user_redemption_estimate data source', async () => {
    if (!userAToken) return;

    const res = await request(app)
      .post('/api/v1/savings/redemptions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        origin: 'MAD',
        destination: 'MIA',
        cabin: 'economy',
        carrier: 'Iberia',
        cashFare: 550,
        cashCurrency: 'EUR',
        pointsRequired: 21250,
        awardTaxesAndFees: 95.5,
        awardCurrency: 'EUR',
        userConfiguredValuePerPoint: 0.013,
        loyaltyProgram: 'Iberia Plus',
        notes: 'Off-peak redemption test',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dataSource).toBe('user_redemption_estimate');
    expect(res.body.data.metadata.isRedemptionPlan).toBe(true);
    expect(res.body.data.metadata.userEntered).toBe(true);
    expect(res.body.data.metadata.verifiedAwardAvailability).toBe(false);

    savedPlanId = res.body.data.id;
  });

  it('GET /api/v1/savings/redemptions provides isolated data per user', async () => {
    if (!userAToken || !userBToken) return;

    // User A should see their plan
    const resA = await request(app)
      .get('/api/v1/savings/redemptions')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.length).toBeGreaterThanOrEqual(1);
    expect(resA.body.data.some((p) => p.id === savedPlanId)).toBe(true);

    // User B should NOT see User A's plan
    const resB = await request(app)
      .get('/api/v1/savings/redemptions')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.some((p) => p.id === savedPlanId)).toBe(false);
  });

  it('DELETE /api/v1/savings/redemptions/:id enforces strict ownership', async () => {
    if (!userAToken || !userBToken || !savedPlanId) return;

    // User B tries to delete User A's plan -> 403 Forbidden
    const unauthDelete = await request(app)
      .delete(`/api/v1/savings/redemptions/${savedPlanId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(unauthDelete.status).toBe(403);

    // User A successfully deletes their own plan -> 200 OK
    const authDelete = await request(app)
      .delete(`/api/v1/savings/redemptions/${savedPlanId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(authDelete.status).toBe(200);
  });
});

describe('Phase 14: Provider & Flight Search Integrity Verification', () => {
  it('POST /api/v1/flights/search succeeds and honors honest data labels', async () => {
    const res = await request(app)
      .post('/api/v1/flights/search')
      .send({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
        travelers: 1,
        cabin: 'economy',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.offers)).toBe(true);
    expect(res.body.data.offers.length).toBeGreaterThan(0);
    const offer = res.body.data.offers[0];
    expect(offer.origin).toBe('MAD');
    expect(offer.destination).toBe('JFK');
    expect(offer.dataSource).toBeDefined();

    // If award inventory is not supported, it should be honestly flagged
    if (res.body.data.awardInventory) {
      expect(['available', 'unsupported', 'demo']).toContain(res.body.data.awardInventory.status);
    }
  });

  it('preserves demo mode and returns transparent demo sweet spots', async () => {
    const res = await request(app)
      .post('/api/v1/flights/search')
      .send({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
        travelers: 1,
        cabin: 'economy',
        demo: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.offers)).toBe(true);
    expect(res.body.data.offers.length).toBeGreaterThan(0);
    const demoOffer = res.body.data.offers[0];
    expect(['fixture', 'demo']).toContain(demoOffer.dataSource);
  });
});
