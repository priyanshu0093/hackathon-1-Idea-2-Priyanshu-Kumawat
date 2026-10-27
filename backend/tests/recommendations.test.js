import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { fareSnapshotsRepository } from '../src/modules/recommendations/recommendations.repository.js';

describe('Smart Travel Recommendations Integration Tests', () => {
  let userAToken;
  let userBToken;
  let userAId;
  let userBId;

  beforeAll(async () => {
    fareSnapshotsRepository.clearMemoryStore();
    await connectDatabase();

    // Create User A
    const resA = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: `recom_user_a_${Date.now()}@example.es`,
        password: 'Password123!',
        name: 'Traveler A',
      });
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id;

    // Create User B
    const resB = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: `recom_user_b_${Date.now()}@example.es`,
        password: 'Password123!',
        name: 'Traveler B',
      });
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id;

    // Add a card to User A's wallet (Iberia Icon)
    await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        cardProductId: 'es_iberia_icon',
        nickname: 'My Iberia Icon',
        estimatedMonthlySpend: 1500,
      });

    // Add Amex Gold to User A's wallet
    await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        cardProductId: 'es_amex_gold',
        nickname: 'Amex Gold',
        estimatedMonthlySpend: 2000,
      });

    // Sync User A's cards to loyalty wallet
    await request(app)
      .post('/api/v1/cards/sync-wallet')
      .set('Authorization', `Bearer ${userAToken}`);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // =========================================================
  // 1. BEST TIME TO BOOK & FARE SNAPSHOTS
  // =========================================================
  describe('1. Best Time to Book', () => {
    it('records a genuine fare snapshot with target price', async () => {
      const res = await request(app)
        .post('/api/v1/recommendations/fare-snapshots')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          origin: 'MAD',
          destination: 'MIA',
          departureDate: '2026-11-20',
          cabin: 'economy',
          carrier: 'Iberia',
          price: 420.5,
          currency: 'EUR',
          targetPrice: 380,
          dataSource: 'duffel_live',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.origin).toBe('MAD');
      expect(res.body.data.destination).toBe('MIA');
      expect(Number(res.body.data.price)).toBe(420.5);
    });

    it('recommends "Book now" when current price meets or beats the target price', async () => {
      const res = await request(app)
        .post('/api/v1/recommendations/best-time-to-book')
        .send({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-12-10',
          currentPrice: 350,
          currency: 'EUR',
          targetPrice: 400, // Current price 350 <= target 400
          cabin: 'economy',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('BOOK_NOW');
      expect(res.body.data.recommendation).toBe('Book now');
      expect(res.body.data.targetPriceMet).toBe(true);
      expect(res.body.data.rationale).toContain('meets or beats your target price');
      expect(res.body.data.dataTransparency).toBeDefined();
    });

    it('recommends "Monitor price" when current price is above the target price', async () => {
      const res = await request(app)
        .post('/api/v1/recommendations/best-time-to-book')
        .send({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-12-10',
          currentPrice: 480,
          currency: 'EUR',
          targetPrice: 350, // Current price 480 > target 350
          cabin: 'economy',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('MONITOR_PRICE');
      expect(res.body.data.recommendation).toBe('Monitor price');
      expect(res.body.data.targetPriceMet).toBe(false);
      expect(res.body.data.targetPriceDifference).toBe(130);
      expect(res.body.data.rationale).toContain('above your target price');
    });

    it('evaluates historical snapshots honestly and does not fabricate future prediction ML', async () => {
      // Record 2 additional historical snapshots for MAD-JFK
      await request(app)
        .post('/api/v1/recommendations/fare-snapshots')
        .send({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-12-10',
          price: 520,
          currency: 'EUR',
        });
      await request(app)
        .post('/api/v1/recommendations/fare-snapshots')
        .send({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-12-10',
          price: 540,
          currency: 'EUR',
        });

      // Now query without target price, at 360 (which is near the lowest historical snapshot)
      const res = await request(app)
        .post('/api/v1/recommendations/best-time-to-book')
        .send({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-12-10',
          currentPrice: 360,
          currency: 'EUR',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.historicalSnapshots.hasHistory).toBe(true);
      expect(res.body.data.historicalSnapshots.totalTracked).toBeGreaterThanOrEqual(2);
      expect(res.body.data.disclosure).toContain('does not claim to predict future airfares');
    });
  });

  // =========================================================
  // 2. BEST CARD & REWARDS RECOMMENDATION
  // =========================================================
  describe('2. Best Card & Rewards Recommendation', () => {
    it('requires authentication and rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/recommendations/best-card-rewards')
        .send({
          cashFare: 650,
          origin: 'MAD',
          destination: 'MIA',
          cabin: 'business',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('reads only authenticated user’s own saved cards and balances (User Data Isolation)', async () => {
      // User A query
      const resA = await request(app)
        .post('/api/v1/recommendations/best-card-rewards')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          cashFare: 2200,
          origin: 'MAD',
          destination: 'MIA',
          cabin: 'business',
          awardProgram: 'Iberia Plus',
          pointsRequired: 42500,
          awardTaxesAndFees: 110,
        });

      expect(resA.status).toBe(200);
      expect(resA.body.success).toBe(true);
      expect(resA.body.data.targetProgram).toBe('Iberia Plus');
      expect(resA.body.data.userCurrentBalance).toBeGreaterThan(0);
      expect(resA.body.data.pointsShortfall).toBe(42500 - resA.body.data.userCurrentBalance);

      // User B query (has 0 cards)
      const resB = await request(app)
        .post('/api/v1/recommendations/best-card-rewards')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          cashFare: 2200,
          origin: 'MAD',
          destination: 'MIA',
          cabin: 'business',
          awardProgram: 'Iberia Plus',
          pointsRequired: 42500,
          awardTaxesAndFees: 110,
        });

      expect(resB.status).toBe(200);
      expect(resB.body.data.userCurrentBalance).toBe(0); // Isolated from User A
      expect(resB.body.data.pointsShortfall).toBe(42500);
    });

    it('reuses Phase 14 smart savings calculation and provides card recommendation for shortfall', async () => {
      const res = await request(app)
        .post('/api/v1/recommendations/best-card-rewards')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          cashFare: 2200,
          origin: 'MAD',
          destination: 'MIA',
          cabin: 'business',
          awardProgram: 'Iberia Plus',
          pointsRequired: 42500,
          awardTaxesAndFees: 110,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.savingsAnalysis).toBeDefined();
      expect(res.body.data.savingsAnalysis.canCalculate).toBe(true);
      expect(res.body.data.savingsAnalysis.estimatedCashSavings).toBeGreaterThan(1000);

      // Card recommendation for bridging the points shortfall
      const cardRec = res.body.data.cardRecommendation;
      expect(cardRec.recommendedCard).toBeDefined();
      expect(cardRec.recommendedCard.rewardsProgram).toBe('Iberia Plus');
      expect(cardRec.spendToBridgeShortfall).toBe(res.body.data.pointsShortfall);
      expect(cardRec.label).toBe('ILLUSTRATIVE DEMO BENCHMARK');

      // Clear simulation disclaimers
      expect(res.body.data.disclaimers[0]).toContain('Demo-generated points are simulated');
      expect(res.body.data.disclaimers[1]).toContain('Different rewards currencies remain strictly isolated');
    });
  });

  // =========================================================
  // 3. SMART TRIP SAVINGS PLAN
  // =========================================================
  describe('3. Smart Trip Savings Plan', () => {
    it('evaluates trip plan with genuine flight search, budget comparison, and accumulation timeline', async () => {
      const res = await request(app)
        .post('/api/v1/recommendations/trip-savings-plan')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          origin: 'MAD',
          destination: 'MIA',
          departureDate: '2026-11-20',
          travelers: 1,
          budget: 500,
          currency: 'EUR',
          cabin: 'economy',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.destination).toBe('MIA');
      expect(res.body.data.flightSummary).toBeDefined();
      expect(res.body.data.flightSummary.totalCashFare).toBeGreaterThan(0);
      expect(res.body.data.awardOption).toBeDefined();
      expect(res.body.data.nextAction).toBeDefined();
      expect(['BOOK_CASH', 'BOOK_AWARD', 'MONITOR_PRICE', 'ACCUMULATE_POINTS']).toContain(
        res.body.data.nextAction.action
      );
      expect(res.body.data.alternatives).toBeDefined();
      expect(res.body.data.assumptionsAndMissingData.length).toBeGreaterThan(0);
    });

    it('returns BOOK_CASH when lowest available cash fare is within budget', async () => {
      const res = await request(app)
        .post('/api/v1/recommendations/trip-savings-plan')
        .send({
          origin: 'MAD',
          destination: 'BCN',
          departureDate: '2026-11-20',
          travelers: 1,
          budget: 5000, // Very generous budget, guaranteed to cover cash fare
          currency: 'EUR',
          cabin: 'economy',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.nextAction.action).toBe('BOOK_CASH');
      expect(res.body.data.flightSummary.isWithinBudget).toBe(true);
    });

    it('returns MONITOR_PRICE or ACCUMULATE_POINTS when cash fare exceeds budget', async () => {
      const res = await request(app)
        .post('/api/v1/recommendations/trip-savings-plan')
        .send({
          origin: 'MAD',
          destination: 'MIA',
          departureDate: '2026-11-20',
          travelers: 1,
          budget: 50, // Unrealistically tiny budget (€50)
          currency: 'EUR',
          cabin: 'business',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.flightSummary.isWithinBudget).toBe(false);
      expect(['MONITOR_PRICE', 'ACCUMULATE_POINTS']).toContain(res.body.data.nextAction.action);
    });
  });
});
