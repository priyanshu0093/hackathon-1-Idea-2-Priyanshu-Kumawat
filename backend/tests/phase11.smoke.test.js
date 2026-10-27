import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase, isDbConnected } from '../src/config/database.js';

describe('Phase 11: End-to-End Product Verification Smoke Test', () => {
  let token = '';
  let userId = '';
  const email = `smoke_${Date.now()}@example.com`;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('1. Signup / Login and Protected Data Smoke Test', () => {
    it('creates new user account and receives valid JWT token', async () => {
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email,
          password: 'Password888!',
          name: 'Smoke Test Traveler',
        });

      expect(signupRes.status).toBe(201);
      expect(signupRes.body.success).toBe(true);
      expect(signupRes.body.data.token).toBeDefined();

      token = signupRes.body.data.token;
      userId = signupRes.body.data.user.id;

      // Verify immediate login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'Password888!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();

      // Access protected profile
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.id).toBe(userId);
    });
  });

  describe('2. Complete Wallet-to-Forecast-to-Trip Journey with PostgreSQL', () => {
    let balanceId = '';
    let tripId = '';
    let bookingId = '';

    it('manages loyalty wallet balances', async () => {
      // 1. Add balance
      const addRes = await request(app)
        .post('/api/v1/wallet')
        .set('Authorization', `Bearer ${token}`)
        .send({
          program: 'Iberia Plus',
          programType: 'airline',
          balance: 38000,
          currencyName: 'Avios',
          notes: 'Smoke test balance update',
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.balance).toBe(38000);
      balanceId = addRes.body.data.id;

      // 2. View wallet
      const viewRes = await request(app)
        .get('/api/v1/wallet')
        .set('Authorization', `Bearer ${token}`);

      expect(viewRes.status).toBe(200);
      expect(viewRes.body.data.summary.totalPoints).toBe(38000);
    });

    it('calculates 30/60/90-day points forecast using wallet balance', async () => {
      const forecastRes = await request(app)
        .post('/api/v1/forecast/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          monthlySpend: 2500,
          rewardProgram: 'Iberia Plus',
          earningRate: 2.0,
          targetDestination: 'MIA',
          targetPoints: 42500,
          currentPoints: 38000,
        });

      expect(forecastRes.status).toBe(200);
      const { forecasts, targetFeasibility } = forecastRes.body.data;
      expect(forecasts.expected.days30).toBe(5000);
      expect(targetFeasibility.shortfall).toBe(4500); // 42,500 - 38,000
      expect(targetFeasibility.reachableIn30Days).toBe(true); // 38,000 + 5,000 >= 42,500
    });

    it('saves user trip and records external booking in PostgreSQL', async () => {
      // 1. Save trip
      const tripRes = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${token}`)
        .send({
          origin: 'MAD',
          destination: 'MIA',
          cabin: 'business',
          departureDate: '2026-11-20',
          carrier: 'Iberia',
          cashPrice: 2200,
          pointsCost: 42500,
          taxes: 145.5,
          program: 'Iberia Plus',
          estimatedSavings: 1800,
        });

      expect(tripRes.status).toBe(201);
      tripId = tripRes.body.data.id;

      // 2. Record external booking
      const bkgRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookingReference: 'SMK999',
          airline: 'Iberia',
          origin: 'MAD',
          destination: 'MIA',
          departureDate: '2026-11-20',
          cabin: 'business',
          pointsRedeemed: 42500,
          taxesPaid: 145.5,
          status: 'confirmed',
        });

      expect(bkgRes.status).toBe(201);
      expect(bkgRes.body.data.isVerifiedConfirmation).toBe(false);
      bookingId = bkgRes.body.data.id;

      // 3. Clean up
      await request(app).delete(`/api/v1/wallet/${balanceId}`).set('Authorization', `Bearer ${token}`);
      await request(app).delete(`/api/v1/trips/${tripId}`).set('Authorization', `Bearer ${token}`);
      await request(app).delete(`/api/v1/bookings/${bookingId}`).set('Authorization', `Bearer ${token}`);
    });
  });

  describe('3. Demo Flight Search Verification', () => {
    it('executes demo mode flight search with honest benchmark labels', async () => {
      const res = await request(app)
        .post('/api/v1/flights/search')
        .send({
          origin: 'BOM',
          destination: 'DEL',
          departureDate: '2026-11-01',
          travelers: 1,
          cabin: 'economy',
          demo: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.meta.dataSource).toBe('demo');
      expect(res.body.data.offers.length).toBeGreaterThan(0);
      expect(res.body.data.offers[0].airline.name).toBeDefined();
    });
  });
});
