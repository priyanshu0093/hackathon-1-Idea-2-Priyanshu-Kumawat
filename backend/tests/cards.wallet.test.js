import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { SPAIN_CARDS_CATALOG } from '../src/modules/cards/cards.catalog.js';

describe('Spain Rewards Card Wallet Integration Tests', () => {
  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';
  let createdCardId = '';

  beforeAll(async () => {
    await connectDatabase();

    // 1. Create User A
    const resA = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: `spain_cards_user_a_${Date.now()}@example.es`,
        password: 'Password123!',
        name: 'Carlos Madrid',
      });
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id;

    // 2. Create User B (for user-isolation checks)
    const resB = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: `spain_cards_user_b_${Date.now()}@example.es`,
        password: 'Password123!',
        name: 'Elena Barcelona',
      });
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // ==========================================
  // 1. Catalog Access & Metadata
  // ==========================================
  describe('GET /api/v1/cards/catalog', () => {
    it('returns Spain-focused catalog with verified products and demo labels', async () => {
      const res = await request(app).get('/api/v1/cards/catalog');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toBeInstanceOf(Array);
      expect(res.body.data.products.length).toBeGreaterThanOrEqual(5);

      const amexPlat = res.body.data.products.find((p) => p.id === 'es_amex_platinum');
      expect(amexPlat).toBeDefined();
      expect(amexPlat.issuer).toBe('American Express España');
      expect(amexPlat.currency).toBe('MR Points');
      expect(amexPlat.rewardsProgram).toBe('Amex Membership Rewards');
      expect(amexPlat.disclaimer).toContain('DEMO CATALOG ENTRY');

      const iberiaIcon = res.body.data.products.find((p) => p.id === 'es_iberia_icon');
      expect(iberiaIcon).toBeDefined();
      expect(iberiaIcon.rewardsProgram).toBe('Iberia Plus');
      expect(iberiaIcon.currency).toBe('Avios');
    });
  });

  // ==========================================
  // 2. Security & Authentication Checks
  // ==========================================
  describe('Security and Ownership Enforcement', () => {
    it('rejects unauthenticated requests to view cards with 401', async () => {
      const res = await request(app).get('/api/v1/cards');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated card addition with 401', async () => {
      const res = await request(app)
        .post('/api/v1/cards')
        .send({ cardProductId: 'es_amex_platinum' });
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // 3. Adding Cards & Single-Time Demo Points Generation
  // ==========================================
  describe('POST /api/v1/cards — Add Card & Demo Points', () => {
    it('adds a Spain card, generates bounded demo points once, and saves to database', async () => {
      const res = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          cardProductId: 'es_iberia_icon',
          nickname: 'Mi Iberia para Viajes',
          estimatedMonthlySpend: 1500,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const card = res.body.data;
      expect(card.id).toBeDefined();
      createdCardId = card.id;
      expect(card.cardProductId).toBe('es_iberia_icon');
      expect(card.cardName).toBe('Tarjeta Iberia Icon');
      expect(card.rewardsProgram).toBe('Iberia Plus');
      expect(card.currency).toBe('Avios');
      expect(card.nickname).toBe('Mi Iberia para Viajes');
      expect(card.estimatedMonthlySpend).toBe(1500);
      expect(card.demoBalance).toBeGreaterThanOrEqual(18000);
      expect(card.demoBalance).toBeLessThanOrEqual(28000);
      expect(card.demoBalanceLabel).toBe('DEMO BALANCE — Not connected to your bank');
    });

    it('preserves the exact same demo balance on reload/subsequent requests without regenerating', async () => {
      const listRes1 = await request(app)
        .get('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(listRes1.status).toBe(200);
      const card1 = listRes1.body.data.cards.find((c) => c.id === createdCardId);
      const initialBalance = card1.demoBalance;

      // Repeat request (simulating page reload)
      const listRes2 = await request(app)
        .get('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`);

      const card2 = listRes2.body.data.cards.find((c) => c.id === createdCardId);
      expect(card2.demoBalance).toBe(initialBalance);
    });

    it('prevents adding duplicate cards of the same product', async () => {
      const duplicateRes = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          cardProductId: 'es_iberia_icon', // Duplicate product for User A
          nickname: 'Otra Iberia',
          estimatedMonthlySpend: 500,
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.error.message).toContain('already added');
    });

    it('rejects unsupported card product IDs with 400', async () => {
      const res = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          cardProductId: 'us_chase_sapphire_preferred', // Worldwide/unsupported card
          estimatedMonthlySpend: 1000,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not in the supported Spain card catalog');
    });
  });

  // ==========================================
  // 4. Keeping Incompatible Currencies Separate
  // ==========================================
  describe('Distinct Rewards Currencies Isolation', () => {
    it('adds a second card with different currency and groups totals strictly by currency', async () => {
      // Add Amex Platinum (MR Points)
      const res = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          cardProductId: 'es_amex_platinum',
          nickname: 'Amex Platino',
          estimatedMonthlySpend: 2500,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.currency).toBe('MR Points');

      // Fetch user's cards and inspect totals
      const listRes = await request(app)
        .get('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(listRes.status).toBe(200);
      const { cards, currencyTotals } = listRes.body.data;
      expect(cards.length).toBe(2);

      // Verify that Avios and MR Points are in separate groups, NOT blended into one total
      expect(currencyTotals.length).toBe(2);

      const aviosGroup = currencyTotals.find((g) => g.currency === 'Avios');
      expect(aviosGroup).toBeDefined();
      expect(aviosGroup.rewardsProgram).toBe('Iberia Plus');
      expect(aviosGroup.cardCount).toBe(1);

      const mrGroup = currencyTotals.find((g) => g.currency === 'MR Points');
      expect(mrGroup).toBeDefined();
      expect(mrGroup.rewardsProgram).toBe('Amex Membership Rewards');
      expect(mrGroup.cardCount).toBe(1);
    });
  });

  // ==========================================
  // 5. User Isolation & Cross-User Data Protection
  // ==========================================
  describe('Multi-User Card Isolation', () => {
    let userBCardId = '';

    it('ensures User B starts with an empty wallet and cannot see User A’s cards', async () => {
      const resB = await request(app)
        .get('/api/v1/cards')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.cards).toEqual([]);
      expect(resB.body.data.currencyTotals).toEqual([]);
      expect(resB.body.data.summary.totalCards).toBe(0);
    });

    it('allows User B to add their own card independently', async () => {
      const resB = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          cardProductId: 'es_santander_iberia',
          nickname: 'Santander de Elena',
          estimatedMonthlySpend: 1200,
        });

      expect(resB.status).toBe(201);
      expect(resB.body.data.userId).toBe(userBId);
      userBCardId = resB.body.data.id;
    });

    it('ensures User A cannot see User B’s card in list', async () => {
      const resA = await request(app)
        .get('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(resA.status).toBe(200);
      const userACardIds = resA.body.data.cards.map((c) => c.id);
      expect(userACardIds).not.toContain(userBCardId);
    });

    it('ensures User B cannot see User A’s cards in list', async () => {
      const resB = await request(app)
        .get('/api/v1/cards')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(resB.status).toBe(200);
      const userBCardIds = resB.body.data.cards.map((c) => c.id);
      expect(userBCardIds).toContain(userBCardId);
      expect(userBCardIds).not.toContain(createdCardId);
    });

    it('ensures User B cannot fetch User A’s card by ID (GET /api/v1/cards/:id)', async () => {
      const res = await request(app)
        .get(`/api/v1/cards/${createdCardId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('ensures User A cannot fetch User B’s card by ID (GET /api/v1/cards/:id)', async () => {
      const res = await request(app)
        .get(`/api/v1/cards/${userBCardId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('ensures User B cannot edit User A’s card (PUT /api/v1/cards/:id)', async () => {
      const res = await request(app)
        .put(`/api/v1/cards/${createdCardId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          nickname: 'Hacked Nickname',
          estimatedMonthlySpend: 9999,
        });

      expect(res.status).toBe(404);
    });

    it('ensures User A cannot edit User B’s card (PUT /api/v1/cards/:id)', async () => {
      const res = await request(app)
        .put(`/api/v1/cards/${userBCardId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          nickname: 'Carlos Hacked Elena',
          estimatedMonthlySpend: 9999,
        });

      expect(res.status).toBe(404);
    });

    it('ensures User B cannot delete User A’s card (DELETE /api/v1/cards/:id)', async () => {
      const res = await request(app)
        .delete(`/api/v1/cards/${createdCardId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
    });

    it('ensures User A cannot delete User B’s card (DELETE /api/v1/cards/:id)', async () => {
      const res = await request(app)
        .delete(`/api/v1/cards/${userBCardId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
    });

    it('rejects unauthenticated attempts to access /api/v1/cards/:id', async () => {
      const getRes = await request(app).get(`/api/v1/cards/${createdCardId}`);
      expect(getRes.status).toBe(401);

      const putRes = await request(app).put(`/api/v1/cards/${createdCardId}`).send({ nickname: 'test' });
      expect(putRes.status).toBe(401);

      const delRes = await request(app).delete(`/api/v1/cards/${createdCardId}`);
      expect(delRes.status).toBe(401);
    });
  });

  // ==========================================
  // 6. Editing and Deleting Cards
  // ==========================================
  describe('PUT & DELETE /api/v1/cards/:id', () => {
    it('allows User A to edit card nickname and monthly spend estimate', async () => {
      const res = await request(app)
        .put(`/api/v1/cards/${createdCardId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          nickname: 'Iberia Principal 2026',
          estimatedMonthlySpend: 2200,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nickname).toBe('Iberia Principal 2026');
      expect(res.body.data.estimatedMonthlySpend).toBe(2200);
    });

    it('allows User A to delete their card', async () => {
      const res = await request(app)
        .delete(`/api/v1/cards/${createdCardId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion from list
      const listRes = await request(app)
        .get('/api/v1/cards')
        .set('Authorization', `Bearer ${userAToken}`);

      const found = listRes.body.data.cards.find((c) => c.id === createdCardId);
      expect(found).toBeUndefined();
      expect(listRes.body.data.cards.length).toBe(1); // Only Amex Platino remains
    });
  });

  // ==========================================
  // 7. Cards 30/60-Day Points Forecast
  // ==========================================
  describe('GET /api/v1/cards/forecast', () => {
    it('generates 30-day and 60-day illustrative forecast based on cards spend', async () => {
      const res = await request(app)
        .get('/api/v1/cards/forecast')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasCards).toBe(true);
      expect(res.body.data.projections).toBeInstanceOf(Array);
      expect(res.body.data.projections.length).toBeGreaterThan(0);

      const amexProj = res.body.data.projections[0];
      expect(amexProj.currency).toBe('MR Points');
      expect(amexProj.days30Points).toBeGreaterThan(0);
      expect(amexProj.days60Points).toBe(amexProj.days30Points * 2);
      expect(amexProj.projectedTotal60).toBe(amexProj.currentDemoPoints + amexProj.days60Points);
      expect(res.body.data.assumptions).toBeInstanceOf(Array);
      expect(res.body.data.disclaimer).toContain('ILLUSTRATIVE PROJECTIONS');
    });
  });

  // ==========================================
  // 8. Flight Wallet Points Sync
  // ==========================================
  describe('POST /api/v1/cards/sync-wallet', () => {
    it('manually syncs and saves all card points into loyalty balances for flight bookings', async () => {
      const res = await request(app)
        .post('/api/v1/cards/sync-wallet')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.syncedPrograms).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalPointsSynced).toBeGreaterThan(0);
      expect(res.body.data.message).toContain('Successfully saved');
    });

    it('prevents User B from overwriting User A’s synced wallet balance by specifying User A’s balance id', async () => {
      // User A syncs wallet, getting a balance id
      const syncRes = await request(app)
        .post('/api/v1/cards/sync-wallet')
        .set('Authorization', `Bearer ${userAToken}`);
      const userABalanceId = syncRes.body.data.balances[0].id;

      // User B tries to update User A's balance
      const exploitRes = await request(app)
        .post('/api/v1/wallet')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          id: userABalanceId,
          program: 'Iberia Plus',
          balance: 999999,
        });

      expect(exploitRes.status).toBe(404);
      expect(exploitRes.body.success).toBe(false);

      // Verify User A's balance is intact
      const walletResA = await request(app)
        .get('/api/v1/wallet')
        .set('Authorization', `Bearer ${userAToken}`);
      const balance = walletResA.body.data.balances.find((b) => b.id === userABalanceId);
      expect(balance.balance).not.toBe(999999);
    });
  });
});
