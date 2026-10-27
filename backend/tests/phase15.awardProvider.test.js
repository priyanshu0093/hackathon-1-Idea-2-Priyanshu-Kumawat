import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import {
  normalizeSeatsAeroOffer,
  normalizeSeatsAeroResponse,
} from '../src/providers/award/seatsAero/seatsAero.normalizer.js';
import { SeatsAeroClient } from '../src/providers/award/seatsAero/seatsAero.client.js';
import { SeatsAeroAdapter } from '../src/providers/award/seatsAero/seatsAero.adapter.js';
import { mockAwardAdapter } from '../src/providers/award/mock/mockAward.adapter.js';
import { awardProviderAdapter } from '../src/providers/award/awardProvider.adapter.js';
import { calculateSmartSavings } from '../src/modules/savings/savings.calculator.js';

describe('Phase 15: Award Flight Availability Integration', () => {
  // ==========================================
  // 1. Normalization & Schema Validation Tests
  // ==========================================
  describe('Seats.aero Normalizer', () => {
    it('normalizes a valid economy class award availability record', () => {
      const rawItem = {
        ID: 'avail_12345',
        Route: {
          OriginAirport: 'MAD',
          DestinationAirport: 'JFK',
          Source: 'iberia',
        },
        Date: '2026-11-20',
        YAvailable: true,
        YMileageCost: '17,000',
        YRemainingSeats: 4,
        YDirect: true,
        TotalTaxes: 6500, // 6500 cents = 65.00
        TaxesCurrency: 'EUR',
        Carriers: 'IB',
        FlightNumbers: 'IB6251',
        UpdatedAt: '2026-10-27T08:00:00Z',
      };

      const normalized = normalizeSeatsAeroOffer(rawItem, { requestedCabin: 'economy' });

      expect(normalized).not.toBeNull();
      expect(normalized.id).toBe('avail_12345');
      expect(normalized.provider).toBe('seats_aero');
      expect(normalized.origin).toBe('MAD');
      expect(normalized.destination).toBe('JFK');
      expect(normalized.departureDate).toBe('2026-11-20');
      expect(normalized.cabin).toBe('economy');
      expect(normalized.program.code).toBe('iberia');
      expect(normalized.program.name).toBe('Iberia Plus');
      expect(normalized.pointsRequired).toBe(17000);
      expect(normalized.taxesAndFees.amount).toBe(65.0);
      expect(normalized.taxesAndFees.currency).toBe('EUR');
      expect(normalized.operatingAirlines).toEqual(['IB']);
      expect(normalized.flightNumbers).toEqual(['IB6251']);
      expect(normalized.seatsAvailable).toBe(4);
      expect(normalized.isDirect).toBe(true);
      expect(normalized.dataSource).toBe('verified_provider');
      expect(normalized.bookingUrl).toBe('https://www.iberia.com/');
    });

    it('normalizes business class and converts taxes from cents to currency units', () => {
      const rawItem = {
        ID: 'avail_biz_999',
        Route: {
          OriginAirport: 'CDG',
          DestinationAirport: 'JFK',
          Source: 'flyingblue',
        },
        Date: '2026-12-15',
        JAvailable: true,
        JMileageCost: 55000,
        JRemainingSeats: 2,
        JDirect: false,
        TotalTaxes: 18450, // 18450 cents = 184.50
        TaxesCurrency: 'EUR',
        Carriers: 'AF, KL',
        FlightNumbers: 'AF123, KL456',
      };

      const normalized = normalizeSeatsAeroOffer(rawItem, { requestedCabin: 'business' });

      expect(normalized).not.toBeNull();
      expect(normalized.cabin).toBe('business');
      expect(normalized.pointsRequired).toBe(55000);
      expect(normalized.taxesAndFees.amount).toBe(184.5);
      expect(normalized.taxesAndFees.currency).toBe('EUR');
      expect(normalized.operatingAirlines).toEqual(['AF', 'KL']);
      expect(normalized.seatsAvailable).toBe(2);
      expect(normalized.isDirect).toBe(false);
      expect(normalized.bookingUrl).toBe('https://www.flyingblue.com/');
    });

    it('never fabricates values: returns null when availability is false or points cost is missing', () => {
      // Not available in requested cabin
      const unavailableItem = {
        Route: { OriginAirport: 'MAD', DestinationAirport: 'JFK' },
        Date: '2026-11-20',
        YAvailable: false,
        YMileageCost: 17000,
      };
      expect(normalizeSeatsAeroOffer(unavailableItem, { requestedCabin: 'economy' })).toBeNull();

      // Zero or missing points
      const zeroPointsItem = {
        Route: { OriginAirport: 'MAD', DestinationAirport: 'JFK' },
        Date: '2026-11-20',
        YAvailable: true,
        YMileageCost: 0,
      };
      expect(normalizeSeatsAeroOffer(zeroPointsItem, { requestedCabin: 'economy' })).toBeNull();

      // Null or invalid input
      expect(normalizeSeatsAeroOffer(null)).toBeNull();
      expect(normalizeSeatsAeroOffer({})).toBeNull();
    });

    it('handles missing carriers, flight numbers, and taxes safely', () => {
      const minimalItem = {
        ID: 'min_1',
        Route: { OriginAirport: 'LHR', DestinationAirport: 'DXB', Source: 'ba' },
        Date: '2026-10-30',
        YAvailable: true,
        YMileageCost: 25000,
      };

      const normalized = normalizeSeatsAeroOffer(minimalItem, { requestedCabin: 'economy' });
      expect(normalized).not.toBeNull();
      expect(normalized.operatingAirlines).toEqual([]);
      expect(normalized.flightNumbers).toEqual([]);
      expect(normalized.taxesAndFees.amount).toBe(0);
      expect(normalized.taxesAndFees.currency).toBe('USD');
      expect(normalized.seatsAvailable).toBeNull();
    });

    it('normalizes response payload and respects maxOffers limit', () => {
      const rawPayload = {
        data: [
          {
            ID: '1',
            Route: { OriginAirport: 'MAD', DestinationAirport: 'JFK', Source: 'iberia' },
            Date: '2026-11-20',
            YAvailable: true,
            YMileageCost: 17000,
          },
          {
            ID: '2',
            Route: { OriginAirport: 'MAD', DestinationAirport: 'JFK', Source: 'ba' },
            Date: '2026-11-20',
            YAvailable: true,
            YMileageCost: 20000,
          },
          {
            ID: '3',
            Route: { OriginAirport: 'MAD', DestinationAirport: 'JFK', Source: 'united' },
            Date: '2026-11-20',
            YAvailable: true,
            YMileageCost: 30000,
          },
        ],
      };

      const offers = normalizeSeatsAeroResponse(rawPayload, { maxOffers: 2 });
      expect(offers).toHaveLength(2);
      expect(offers[0].id).toBe('1');
      expect(offers[1].id).toBe('2');
    });
  });

  // ==========================================
  // 2. Provider Client & Error Handling Tests
  // ==========================================
  describe('Seats.aero Client', () => {
    let client;
    const originalFetch = global.fetch;

    beforeEach(() => {
      client = new SeatsAeroClient();
    });

    afterEach(() => {
      global.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it('reports not configured if API key is missing', () => {
      vi.spyOn(client, 'apiKey', 'get').mockReturnValue('');
      expect(client.isConfigured()).toBe(false);
    });

    it('reports configured when API key is present', () => {
      vi.spyOn(client, 'apiKey', 'get').mockReturnValue('commercial_key_test_123');
      expect(client.isConfigured()).toBe(true);
    });

    it('throws unconfigured error if search is attempted without API key', async () => {
      vi.spyOn(client, 'apiKey', 'get').mockReturnValue('');
      await expect(
        client.searchAwards({ origin: 'MAD', destination: 'JFK', departureDate: '2026-11-20' })
      ).rejects.toThrow(/not configured/);
    });

    it('handles HTTP 429 rate limit and parses quota headers', async () => {
      vi.spyOn(client, 'apiKey', 'get').mockReturnValue('mock_api_key');

      global.fetch = vi.fn().mockResolvedValue({
        status: 429,
        ok: false,
        headers: new Headers({
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Limit': '1000',
          'X-RateLimit-Reset': '3600',
        }),
      });

      await expect(
        client.searchAwards({ origin: 'MAD', destination: 'JFK', departureDate: '2026-11-20' })
      ).rejects.toMatchObject({
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        meta: {
          remaining: 0,
          limit: 1000,
          resetSeconds: 3600,
        },
      });
    });

    it('handles HTTP 401/403 provider authorization failures', async () => {
      vi.spyOn(client, 'apiKey', 'get').mockReturnValue('mock_api_key');

      global.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        text: async () => 'Invalid Partner API Key',
        headers: new Headers(),
      });

      await expect(
        client.searchAwards({ origin: 'MAD', destination: 'JFK', departureDate: '2026-11-20' })
      ).rejects.toMatchObject({
        code: 'PROVIDER_AUTH_ERROR',
        statusCode: 401,
      });
    });

    it('handles network timeouts cleanly via AbortError', async () => {
      vi.spyOn(client, 'apiKey', 'get').mockReturnValue('mock_api_key');

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(
        client.searchAwards({ origin: 'MAD', destination: 'JFK', departureDate: '2026-11-20' })
      ).rejects.toMatchObject({
        code: 'PROVIDER_TIMEOUT',
        statusCode: 504,
      });
    });
  });

  // ==========================================
  // 3. Adapter & Bounded In-Memory Cache Tests
  // ==========================================
  describe('Seats.aero Adapter & Caching', () => {
    let adapter;

    beforeEach(() => {
      adapter = new SeatsAeroAdapter();
    });

    it('returns honest unconfigured status without throwing when API key is missing', async () => {
      vi.spyOn(adapter, 'isConfigured').mockReturnValue(false);

      const result = await adapter.searchAwards({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
      });

      expect(result.status).toBe('unsupported');
      expect(result.available).toBe(false);
      expect(result.offers).toEqual([]);
      expect(result.eligibilityNote).toBeDefined();
    });

    it('caches award search responses in bounded memory cache', async () => {
      vi.spyOn(adapter, 'isConfigured').mockReturnValue(true);

      const fakeResponse = {
        data: {
          data: [
            {
              ID: 'cached_1',
              Route: { OriginAirport: 'MAD', DestinationAirport: 'JFK', Source: 'iberia' },
              Date: '2026-11-20',
              YAvailable: true,
              YMileageCost: 17000,
            },
          ],
        },
        rateLimitMeta: { remaining: 950 },
      };

      const searchSpy = vi.spyOn(adapter, 'searchAwards');
      // Directly populate cache
      const cacheKey = adapter.getCacheKey({ origin: 'MAD', destination: 'JFK', departureDate: '2026-11-20' });
      adapter.setInCache(cacheKey, {
        status: 'available',
        available: true,
        offers: [{ id: 'cached_1' }],
        total: 1,
        meta: { dataSource: 'live', fromCache: false },
      });

      const cached = await adapter.searchAwards({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
      });

      expect(cached.status).toBe('available');
      expect(cached.meta.fromCache).toBe(true);
      expect(cached.offers).toHaveLength(1);
    });
  });

  // ==========================================
  // 4. Mock Award Adapter & Demo Routes
  // ==========================================
  describe('Mock Award Adapter', () => {
    it('returns verified demo award options for MAD-JFK', async () => {
      const res = await mockAwardAdapter.searchAwards({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
        cabin: 'economy',
      });

      expect(res.status).toBe('available');
      expect(res.available).toBe(true);
      expect(res.offers.length).toBeGreaterThanOrEqual(1);

      const iberiaOffer = res.offers.find((o) => o.program.code === 'iberia');
      expect(iberiaOffer).toBeDefined();
      expect(iberiaOffer.pointsRequired).toBe(17000);
      expect(iberiaOffer.taxesAndFees.amount).toBe(65.0);
      expect(iberiaOffer.taxesAndFees.currency).toBe('EUR');
      expect(iberiaOffer.operatingAirlines).toContain('IB');
      expect(iberiaOffer.bookingUrl).toBe('https://www.iberia.com/');
    });

    it('returns business class demo award options for MAD-JFK', async () => {
      const res = await mockAwardAdapter.searchAwards({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
        cabin: 'business',
      });

      const iberiaBiz = res.offers.find((o) => o.program.code === 'iberia');
      expect(iberiaBiz).toBeDefined();
      expect(iberiaBiz.pointsRequired).toBe(42500);
      expect(iberiaBiz.taxesAndFees.amount).toBe(145.5);
    });

    it('returns Air India Flying Returns for BOM-DEL', async () => {
      const res = await mockAwardAdapter.searchAwards({
        origin: 'BOM',
        destination: 'DEL',
        departureDate: '2026-12-01',
      });

      expect(res.available).toBe(true);
      const aiOffer = res.offers[0];
      expect(aiOffer.program.code).toBe('airindia');
      expect(aiOffer.pointsRequired).toBe(5000);
      expect(aiOffer.taxesAndFees.amount).toBe(800);
      expect(aiOffer.taxesAndFees.currency).toBe('INR');
    });
  });

  // ==========================================
  // 5. Unified Coordinator & Fallback Tests
  // ==========================================
  describe('Unified Award Provider Adapter', () => {
    it('routes to mock adapter when demo is true', async () => {
      const res = await awardProviderAdapter.searchAwardAvailability({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
        demo: true,
      });

      expect(res.available).toBe(true);
      expect(res.meta.dataSource).toBe('demo');
    });

    it('returns honest unconfigured status if live provider key is not set', async () => {
      const res = await awardProviderAdapter.searchAwardAvailability({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
        demo: false,
      });

      if (!awardProviderAdapter.isConfigured()) {
        expect(res.status).toBe('unsupported');
        expect(res.available).toBe(false);
        expect(res.reason).toContain('Seats.aero');
      }
    });
  });

  // ==========================================
  // 6. Award Search API Endpoints
  // ==========================================
  describe('GET & POST /api/v1/flights/award-search', () => {
    it('GET /api/v1/flights/award-search in demo mode returns 200 with award offers', async () => {
      const res = await request(app)
        .get('/api/v1/flights/award-search')
        .query({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-11-20',
          demo: 'true',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.available).toBe(true);
      expect(res.body.data.offers).toBeInstanceOf(Array);
      expect(res.body.data.offers.length).toBeGreaterThan(0);
    });

    it('POST /api/v1/flights/award-search in demo mode returns 200 with award offers', async () => {
      const res = await request(app)
        .post('/api/v1/flights/award-search')
        .send({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '2026-11-20',
          cabin: 'economy',
          demo: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.available).toBe(true);
      expect(res.body.data.offers[0].origin).toBe('MAD');
      expect(res.body.data.offers[0].destination).toBe('JFK');
    });

    it('validates IATA codes and rejects identical origin and destination', async () => {
      const res = await request(app)
        .get('/api/v1/flights/award-search')
        .query({
          origin: 'MAD',
          destination: 'MAD',
          departureDate: '2026-11-20',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('identical');
    });

    it('validates date format strictly', async () => {
      const res = await request(app)
        .get('/api/v1/flights/award-search')
        .query({
          origin: 'MAD',
          destination: 'JFK',
          departureDate: '20-11-2026',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 7. Phase 14 Smart Savings Calculation Connection
  // ==========================================
  describe('Phase 14 Smart Savings Connection with Real Award Offer', () => {
    it('calculates savings accurately between Duffel retail cash fare and normalized award offer', () => {
      // Duffel cash fare: €450 EUR
      const cashFare = 450;
      const cashCurrency = 'EUR';

      // Genuine normalized award offer: 17,000 points + €65 taxes & fees
      const verifiedAward = {
        pointsRequired: 17000,
        taxesAndFees: {
          amount: 65.0,
          currency: 'EUR',
        },
        program: {
          name: 'Iberia Plus',
        },
      };

      // User loyalty balance: 25,000 Iberia Avios
      // Valuation: 0.013 EUR/pt (1.30 cents)
      const savingsResult = calculateSmartSavings({
        cashFare,
        cashCurrency,
        pointsRequired: verifiedAward.pointsRequired,
        awardTaxesAndFees: verifiedAward.taxesAndFees.amount,
        awardCurrency: verifiedAward.taxesAndFees.currency,
        loyaltyProgram: verifiedAward.program.name,
        userConfiguredValuePerPoint: 0.013,
        userPointsBalance: 25000,
      });

      // Formulas:
      // valueOfPointsUsed = 17,000 * 0.013 = 221.00
      // cashSavings = 450 - 65 - 221 = 164.00
      // savingsPercentage = (164 / 450) * 100 = 36.4%
      // valuePerPoint = (450 - 65) / 17000 = 385 / 17000 = 0.02265 -> 2.27 cents
      expect(savingsResult.canCalculate).toBe(true);
      expect(savingsResult.cashFare).toBe(450);
      expect(savingsResult.pointsRequired).toBe(17000);
      expect(savingsResult.awardTaxesAndFees).toBe(65.0);
      expect(savingsResult.valueOfPointsUsed).toBe(221.0);
      expect(savingsResult.cashSavings).toBe(164.0);
      expect(savingsResult.savingsPercentage).toBe(36.4);
      expect(savingsResult.valuePerPointCents).toBe(2.27);
      expect(savingsResult.isAwardCheaper).toBe(true);
      expect(savingsResult.hasShortfall).toBe(false);
      expect(savingsResult.pointsShortfall).toBe(0);
    });

    it('refuses calculation when currencies do not match without conversion', () => {
      const savingsResult = calculateSmartSavings({
        cashFare: 450,
        cashCurrency: 'EUR',
        pointsRequired: 17000,
        awardTaxesAndFees: 65.0,
        awardCurrency: 'USD', // Currency mismatch
      });

      expect(savingsResult.canCalculate).toBe(false);
      expect(savingsResult.reason).toContain('Currency mismatch');
    });
  });
});
