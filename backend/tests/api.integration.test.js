import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('A Una Milla API Endpoints Integration', () => {
  it('GET /api/v1/health returns ok status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.providers.cashFlightProvider).toBeDefined();
    expect(res.body.providers.awardInventoryProvider).toBeDefined();
  });

  it('GET /api/v1/airports returns full airport list', async () => {
    const res = await request(app).get('/api/v1/airports');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(10);
  });

  it('GET /api/v1/airports?q=mad filters airports correctly', async () => {
    const res = await request(app).get('/api/v1/airports?q=mad');
    expect(res.status).toBe(200);
    expect(res.body.data[0].code).toBe('MAD');
  });

  it('POST /api/v1/flights/search rejects invalid payload with 400', async () => {
    const res = await request(app)
      .post('/api/v1/flights/search')
      .send({
        origin: 'INVALID',
        destination: 'MAD',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/flights/search executes search with normalized results', async () => {
    const res = await request(app)
      .post('/api/v1/flights/search')
      .send({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-15',
        returnDate: '2026-11-25',
        tripType: 'round_trip',
        travelers: 1,
        cabin: 'economy',
        currency: 'EUR',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.offers).toBeDefined();
    expect(Array.isArray(res.body.data.offers)).toBe(true);
    expect(res.body.data.offers.length).toBeGreaterThan(0);

    const firstOffer = res.body.data.offers[0];
    expect(firstOffer.provider).toBe('amadeus');
    expect(firstOffer.price.currency).toBe('EUR');
    expect(firstOffer.price.total).toBeGreaterThan(0);
    expect(firstOffer.bookingUrl).toBeNull(); // Verifying no invented URL
    expect(res.body.data.awardInventory.status).toBe('unsupported');
  });

  it('GET /api/v1/flights/award-search returns unsupported state cleanly', async () => {
    const res = await request(app).get('/api/v1/flights/award-search');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('unsupported');
    expect(res.body.data.available).toBe(false);
  });

  it('POST /api/v1/savings/calculate calculates metrics with integrity', async () => {
    const res = await request(app)
      .post('/api/v1/savings/calculate')
      .send({
        cashPrice: 850,
        currency: 'EUR',
        travelers: 1,
        isRoundTrip: false,
        awardData: {
          available: true,
          program: 'Avios',
          pointsRequired: 30000,
          taxesAndFees: 90,
          userPointsBalance: 20000,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canCalculate).toBe(true);
    expect(res.body.data.savingsAmount).toBeGreaterThan(0);
    expect(res.body.data.awardOption.pointsShortfall).toBe(10000);
  });
});
