import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('A Una Milla API Endpoints Integration', () => {
  it('GET /api/v1/health returns ok status and provider details', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.providers.cashFlightProvider).toBeDefined();
    expect(res.body.providers.awardInventoryProvider).toBeDefined();
  });

  describe('Airport Autocomplete API', () => {
    it('GET /api/v1/airports returns full airport list', async () => {
      const res = await request(app).get('/api/v1/airports');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(15);
    });

    it('GET /api/v1/airports?q=mad filters Madrid correctly', async () => {
      const res = await request(app).get('/api/v1/airports?q=mad');
      expect(res.status).toBe(200);
      expect(res.body.data[0].code).toBe('MAD');
    });

    it('GET /api/v1/airports?q=Mumbai returns Mumbai (BOM)', async () => {
      const res = await request(app).get('/api/v1/airports?q=Mumbai');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].code).toBe('BOM');
      expect(res.body.data[0].city).toBe('Mumbai');
      expect(res.body.data[0].country).toBe('India');
    });

    it('GET /api/v1/airports?q=Delhi returns Delhi (DEL)', async () => {
      const res = await request(app).get('/api/v1/airports?q=Delhi');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].code).toBe('DEL');
      expect(res.body.data[0].city).toBe('Delhi');
      expect(res.body.data[0].country).toBe('India');
    });

    it('GET /api/v1/airports?q=BOM returns Mumbai airport by IATA code', async () => {
      const res = await request(app).get('/api/v1/airports?q=BOM');
      expect(res.status).toBe(200);
      expect(res.body.data[0].code).toBe('BOM');
    });

    it('GET /api/v1/airports?q=DEL prioritizes Delhi (DEL) over substring matches', async () => {
      const res = await request(app).get('/api/v1/airports?q=DEL');
      expect(res.status).toBe(200);
      expect(res.body.data[0].code).toBe('DEL');
    });

    it('GET /api/v1/airports?q=chhatrapati matches airport name', async () => {
      const res = await request(app).get('/api/v1/airports?q=chhatrapati');
      expect(res.status).toBe(200);
      expect(res.body.data[0].code).toBe('BOM');
    });
  });

  describe('Flight Search API', () => {
    it('POST /api/v1/flights/search rejects invalid payload with 400 VALIDATION_ERROR', async () => {
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

    it('POST /api/v1/flights/search rejects identical origin and destination', async () => {
      const res = await request(app)
        .post('/api/v1/flights/search')
        .send({
          origin: 'BOM',
          destination: 'BOM',
          departureDate: '2026-11-20',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/flights/search safely handles missing live credentials with 503 PROVIDER_UNCONFIGURED', async () => {
      // In this test, provider is amadeus and credentials are not in environment
      const res = await request(app)
        .post('/api/v1/flights/search')
        .send({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-11-20',
          provider: 'amadeus',
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROVIDER_UNCONFIGURED');
      expect(res.body.error.message).toContain('credentials are not configured');
    });

    it('POST /api/v1/flights/search executes normalized search with verified IATA codes (BOM -> DEL)', async () => {
      const res = await request(app)
        .post('/api/v1/flights/search')
        .send({
          origin: 'BOM',
          destination: 'DEL',
          departureDate: '2026-11-20',
          returnDate: '2026-11-28',
          tripType: 'round_trip',
          travelers: 1,
          cabin: 'economy',
          currency: 'EUR',
          provider: 'mock',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.offers).toBeDefined();
      expect(Array.isArray(res.body.data.offers)).toBe(true);
      expect(res.body.data.offers.length).toBeGreaterThan(0);

      // Verify normalization fields
      const firstOffer = res.body.data.offers[0];
      expect(firstOffer.provider).toBe('amadeus');
      expect(firstOffer.dataSource).toBe('fixture'); // Honestly labeled as fixture
      expect(firstOffer.airline.name).toBe('Iberia');
      expect(firstOffer.flightNumber).toBe('IB6251');
      expect(firstOffer.price.currency).toBe('EUR');
      expect(firstOffer.price.total).toBe(748.2);
      expect(firstOffer.price.base).toBe(580);
      expect(firstOffer.price.taxesAndFees).toBe(168.2);
      expect(firstOffer.itineraries).toHaveLength(2);
      expect(firstOffer.itineraries[0].durationFormatted).toBe('8h 20m');
      expect(firstOffer.bookingUrl).toBeNull(); // Never invented!
      expect(res.body.data.awardInventory.status).toBe('unsupported');
    });
  });

  describe('Award Flight Search API', () => {
    it('GET /api/v1/flights/award-search returns unsupported state cleanly without claiming savings', async () => {
      const res = await request(app).get('/api/v1/flights/award-search');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('unsupported');
      expect(res.body.data.available).toBe(false);
      expect(res.body.data.reason).toContain('not configured or authorized');
    });
  });

  describe('Savings Calculation API Integrity', () => {
    it('POST /api/v1/savings/calculate refuses to calculate savings if award inventory is unavailable', async () => {
      const res = await request(app)
        .post('/api/v1/savings/calculate')
        .send({
          cashPrice: 750,
          currency: 'EUR',
          travelers: 1,
          isRoundTrip: false,
          awardData: {
            available: false,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.canCalculate).toBe(false);
      expect(res.body.data.status).toBe('award_data_unavailable');
      expect(res.body.data.savingsAmount).toBe(0);
      expect(res.body.data.isVerifiedSavings).toBe(false);
    });

    it('POST /api/v1/savings/calculate calculates metrics with integrity when award data is verified', async () => {
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
      expect(res.body.data.isVerifiedSavings).toBe(true);
    });
  });
});
