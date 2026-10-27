import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase, isDbConnected } from '../src/config/database.js';

describe('Phase 10: Core Travel-Hacking Product Integration Tests', () => {
  let userAToken = '';
  let userAId = '';
  const userAEmail = `tester_${Date.now()}@example.com`;

  let userBToken = '';
  let userBId = '';
  const userBEmail = `tester_b_${Date.now()}@example.com`;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('1. Authentication & Session Handling', () => {
    it('signs up User A with secure password hashing and returns token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: userAEmail,
          password: 'Password123!',
          name: 'Travel Hacker A',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(userAEmail);
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Never exposed

      userAToken = res.body.data.token;
      userAId = res.body.data.user.id;
    });

    it('rejects duplicate email registration with 409', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: userAEmail,
          password: 'Password123!',
          name: 'Duplicate Hacker',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('rejects passwords shorter than 8 characters with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'shortpass@example.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('authenticates User A via login and returns token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userAEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.id).toBe(userAId);
    });

    it('rejects invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userAEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('retrieves authenticated profile with Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(userAId);
      expect(res.body.data.user.email).toBe(userAEmail);
    });

    it('rejects unauthorized access without token with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('signs up User B for multi-user isolation tests', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: userBEmail,
          password: 'Password456!',
          name: 'Travel Hacker B',
        });

      expect(res.status).toBe(201);
      userBToken = res.body.data.token;
      userBId = res.body.data.user.id;
    });
  });

  describe('2. Trip Ownership & Cross-User Security', () => {
    let tripAId = '';

    it('saves a trip associated with User A', async () => {
      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          origin: 'MAD',
          destination: 'MIA',
          cabin: 'business',
          departureDate: '2026-11-20',
          carrier: 'Iberia',
          cashPrice: 2200,
          pointsCost: 42500,
          taxes: 145,
          program: 'Iberia Plus',
          estimatedSavings: 1800,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.userId).toBe(userAId);
      tripAId = res.body.data.id;
    });

    it('prevents User B from deleting User A’s trip (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/v1/trips/${tripAId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('prevents User B from viewing User A’s private trip (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripAId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('3. Points Wallet & Manual Loyalty Balances', () => {
    let balanceId = '';

    it('adds manual loyalty balance for User A', async () => {
      const res = await request(app)
        .post('/api/v1/wallet')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          program: 'Iberia Plus',
          programType: 'airline',
          balance: 35000,
          currencyName: 'Avios',
          notes: 'Accumulated from Amex transfer and flight credits',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.program).toBe('Iberia Plus');
      expect(res.body.data.balance).toBe(35000);
      expect(res.body.data.source).toBe('manual_entry');
      balanceId = res.body.data.id;
    });

    it('lists User A’s wallet balances and totals', async () => {
      const res = await request(app)
        .get('/api/v1/wallet')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.balances.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.summary.totalPoints).toBeGreaterThanOrEqual(35000);
      expect(res.body.data.summary.sourceLabel).toContain('Manually entered');
    });

    it('ensures User B’s wallet is isolated from User A', async () => {
      const res = await request(app)
        .get('/api/v1/wallet')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.balances.length).toBe(0);
      expect(res.body.data.summary.totalPoints).toBe(0);
    });
  });

  describe('4. Points Earning & 30/60/90-Day Forecast Engine', () => {
    it('calculates conservative, expected, and optimistic forecasts with explicit assumptions', async () => {
      const res = await request(app)
        .post('/api/v1/forecast/calculate')
        .send({
          monthlySpend: 2000,
          rewardProgram: 'Iberia Plus',
          earningRate: 1.5,
          targetDestination: 'MIA',
          targetPoints: 42500,
          currentPoints: 35000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { forecasts, targetFeasibility, disclaimers } = res.body.data;

      // Conservative (1.0x)
      expect(forecasts.conservative.days30).toBe(2000);
      expect(forecasts.conservative.days60).toBe(4000);
      expect(forecasts.conservative.days90).toBe(6000);

      // Expected (1.5x)
      expect(forecasts.expected.days30).toBe(3000);
      expect(forecasts.expected.days60).toBe(6000);
      expect(forecasts.expected.days90).toBe(9000);

      // Optimistic (Expected * 1.25)
      expect(forecasts.optimistic.days30).toBe(3750);
      expect(forecasts.optimistic.days60).toBe(7500);
      expect(forecasts.optimistic.days90).toBe(11250);

      // Feasibility
      expect(targetFeasibility.shortfall).toBe(7500); // 42,500 - 35,000
      expect(targetFeasibility.reachableIn90Days).toBe(true);

      // Disclaimers
      expect(disclaimers.length).toBeGreaterThanOrEqual(3);
      expect(disclaimers.some((d) => d.includes('Never borrow money'))).toBe(true);
      expect(disclaimers.some((d) => d.includes('No Flight Is Free'))).toBe(true);
    });

    it('saves user forecast when authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/forecast/save')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          monthlySpend: 2500,
          rewardProgram: 'British Airways Executive Club',
          earningRate: 2.0,
          targetDestination: 'LHR',
          targetPoints: 50000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.record).toBeDefined();
    });
  });

  describe('5. External Booking & Confirmation Management', () => {
    let bookingId = '';

    it('records an external booking completed by user', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          bookingReference: 'MAD910',
          airline: 'Iberia',
          flightNumber: 'IB6123',
          origin: 'MAD',
          destination: 'MIA',
          departureDate: '2026-11-20',
          cabin: 'business',
          pointsRedeemed: 42500,
          taxesPaid: 145.5,
          cashSavedEstimate: 1850,
          status: 'confirmed',
          notes: 'Booked directly via Iberia Plus website with Avios',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.bookingReference).toBe('MAD910');
      expect(res.body.data.isVerifiedConfirmation).toBe(false); // Explicit distinction
      expect(res.body.data.recordSource).toBe('user_entered_external');
      expect(res.body.data.sourceDisclosure).toContain('User-Reported External Booking');
      bookingId = res.body.data.id;
    });

    it('lists User A’s external bookings', async () => {
      const res = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some((b) => b.id === bookingId)).toBe(true);
    });

    it('ensures User B cannot see User A’s booking records', async () => {
      const res = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('allows User A to delete their external booking record', async () => {
      const res = await request(app)
        .delete(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
    });
  });
});
