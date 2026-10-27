import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { amadeusClient } from '../src/providers/amadeus/amadeus.client.js';
import { flightCache } from '../src/utils/cache.js';
import { generateAdvisorAdvice } from '../src/modules/advisor/advisor.engine.js';
import { advisorService } from '../src/modules/advisor/advisor.service.js';
import { ProviderTimeoutError, ProviderRateLimitError, ProviderError } from '../src/utils/errors.js';
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('Phase 8: Production Readiness & End-to-End Verification Tests', () => {
  beforeEach(() => {
    flightCache.clear();
    vi.restoreAllMocks();
  });

  describe('1. Flight Search Provider Error, Timeout & Rate-Limit Handling', () => {
    it('returns 504 PROVIDER_TIMEOUT when Amadeus upstream times out', async () => {
      vi.spyOn(amadeusClient, 'isConfigured').mockReturnValue(true);
      vi.spyOn(amadeusClient, 'searchFlightOffers').mockRejectedValue(
        new ProviderTimeoutError('Flight search request to Amadeus timed out or was cancelled')
      );

      const res = await request(app)
        .post('/api/v1/flights/search')
        .send({
          origin: 'BOM',
          destination: 'DEL',
          departureDate: '2026-11-20',
          provider: 'amadeus',
        });

      expect(res.status).toBe(504);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROVIDER_TIMEOUT');
      expect(res.body.error.message).toContain('timed out');
    });

    it('returns 429 PROVIDER_RATE_LIMIT when Amadeus returns HTTP 429', async () => {
      vi.spyOn(amadeusClient, 'isConfigured').mockReturnValue(true);
      vi.spyOn(amadeusClient, 'searchFlightOffers').mockRejectedValue(
        new ProviderRateLimitError('Amadeus API rate limit exceeded')
      );

      const res = await request(app)
        .post('/api/v1/flights/search')
        .send({
          origin: 'DEL',
          destination: 'BOM',
          departureDate: '2026-11-20',
          provider: 'amadeus',
        });

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROVIDER_RATE_LIMIT');
      expect(res.body.error.message).toContain('rate limit exceeded');
    });

    it('returns 502 PROVIDER_ERROR when Amadeus returns upstream error', async () => {
      vi.spyOn(amadeusClient, 'isConfigured').mockReturnValue(true);
      vi.spyOn(amadeusClient, 'searchFlightOffers').mockRejectedValue(
        new ProviderError('Amadeus Search Error (500): Internal Gateway Error')
      );

      const res = await request(app)
        .post('/api/v1/flights/search')
        .send({
          origin: 'BOM',
          destination: 'DEL',
          departureDate: '2026-11-20',
          provider: 'amadeus',
        });

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROVIDER_ERROR');
      expect(res.body.error.message).toContain('Amadeus Search Error');
    });

    it('handles empty results cleanly with 200 OK and informative message', async () => {
      vi.spyOn(amadeusClient, 'isConfigured').mockReturnValue(true);
      vi.spyOn(amadeusClient, 'searchFlightOffers').mockResolvedValue({
        data: [],
        meta: { count: 0 },
      });

      const res = await request(app)
        .post('/api/v1/flights/search')
        .send({
          origin: 'BOM',
          destination: 'DEL',
          departureDate: '2026-11-20',
          provider: 'amadeus',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.offers).toEqual([]);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.message).toContain('No flight offers found');
    });
  });

  describe('2. Airport Autocomplete for Mumbai & Delhi', () => {
    it('ranks Mumbai (BOM) as #1 on exact code search and city search', async () => {
      const resCode = await request(app).get('/api/v1/airports?q=bom');
      expect(resCode.status).toBe(200);
      expect(resCode.body.data[0].code).toBe('BOM');
      expect(resCode.body.data[0].city).toBe('Mumbai');

      const resCity = await request(app).get('/api/v1/airports?q=mumbai');
      expect(resCity.status).toBe(200);
      expect(resCity.body.data[0].code).toBe('BOM');
    });

    it('ranks Delhi (DEL) as #1 on exact code search and city search', async () => {
      const resCode = await request(app).get('/api/v1/airports?q=del');
      expect(resCode.status).toBe(200);
      expect(resCode.body.data[0].code).toBe('DEL');
      expect(resCode.body.data[0].city).toBe('Delhi');

      const resCity = await request(app).get('/api/v1/airports?q=delhi');
      expect(resCity.status).toBe(200);
      expect(resCity.body.data[0].code).toBe('DEL');
    });

    it('gracefully handles extremely long search queries without crashing', async () => {
      const longQuery = 'A'.repeat(500);
      const res = await request(app).get(`/api/v1/airports?q=${longQuery}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('3. Travel Advisor & Route Rules for Mumbai/Delhi and Data Source Honesty', () => {
    it('provides tailored Virgin Atlantic / BA Avios benchmarks for DEL -> LHR', () => {
      const advice = generateAdvisorAdvice({
        origin: 'DEL',
        destination: 'LHR',
        departureDate: '2026-11-20',
        travelers: 1,
        cabin: 'economy',
        cashPrice: 780,
      });

      expect(advice.recommendation.program).toContain('Virgin Atlantic');
      expect(advice.recommendation.estimatedPointsRequired).toBe(12500);
      expect(advice.tripContext.origin).toBe('DEL');
      expect(advice.tripContext.destination).toBe('LHR');
    });

    it('provides tailored Emirates / Avios benchmarks for BOM -> DXB', () => {
      const advice = generateAdvisorAdvice({
        origin: 'BOM',
        destination: 'DXB',
        departureDate: '2026-11-20',
        travelers: 1,
        cabin: 'economy',
        cashPrice: 320,
      });

      expect(advice.recommendation.program).toContain('Emirates Skywards');
      expect(advice.recommendation.estimatedPointsRequired).toBe(13500);
    });

    it('identifies BLR and BOM as alternative gateways for DEL', () => {
      const advice = generateAdvisorAdvice({
        origin: 'DEL',
        destination: 'LHR',
        departureDate: '2026-11-20',
        travelers: 1,
        cabin: 'economy',
      });

      const altCodes = advice.alternateAirports.map((a) => a.code);
      expect(altCodes).toContain('BLR');
      expect(altCodes).toContain('BOM');
    });

    it('truthfully labels demo vs fixture vs live data sources in verified facts', () => {
      const liveAdvice = generateAdvisorAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
        dataSource: 'live',
      });
      expect(liveAdvice.facts.some((f) => f.includes('Live GDS Airline API (Amadeus)'))).toBe(true);

      const fixtureAdvice = generateAdvisorAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
        dataSource: 'fixture',
      });
      expect(fixtureAdvice.facts.some((f) => f.includes('Sample GDS Fixture'))).toBe(true);

      const demoAdvice = generateAdvisorAdvice({
        origin: 'MAD',
        destination: 'JFK',
        departureDate: '2026-11-20',
        dataSource: 'demo',
      });
      expect(demoAdvice.facts.some((f) => f.includes('Illustrative Travel-Hacking Demo Benchmark'))).toBe(true);
    });

    it('caches advisor advice with 10-minute TTL instead of expiring in milliseconds', async () => {
      const setSpy = vi.spyOn(flightCache, 'set');

      await advisorService.analyzeTrip({
        origin: 'BOM',
        destination: 'DEL',
        departureDate: '2026-11-20',
        travelers: 1,
        cabin: 'economy',
      });

      expect(setSpy).toHaveBeenCalled();
      const lastCall = setSpy.mock.calls[setSpy.mock.calls.length - 1];
      // Arg 2 is TTL in milliseconds: must be 600,000ms (10 minutes), NOT 600ms
      expect(lastCall[2]).toBe(600000);
    });
  });

  describe('4. Security & Error Response Handling', () => {
    it('CORS enforces allowed origins in production mode', async () => {
      const testApp = express();
      const allowed = ['http://localhost:5173'];
      testApp.use(
        cors({
          origin: (origin, callback) => {
            if (!origin || allowed.includes(origin)) return callback(null, true);
            return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
          },
          credentials: true,
        })
      );
      testApp.get('/test', (req, res) => res.json({ ok: true }));
      testApp.use(errorHandler);

      // Allowed origin
      const allowedRes = await request(testApp)
        .get('/test')
        .set('Origin', 'http://localhost:5173');
      expect(allowedRes.status).toBe(200);

      // Disallowed origin
      const forbiddenRes = await request(testApp)
        .get('/test')
        .set('Origin', 'http://malicious-attacker.com');
      expect(forbiddenRes.status).toBe(403);
      expect(forbiddenRes.body.error.code).toBe('CORS_ERROR');
    });

    it('redacts sensitive headers, tokens, and secrets from logs', async () => {
      // Direct validation of logger redaction
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { logger } = await import('../src/utils/logger.js');
      logger.error('Failed request with Bearer secret-token-xyz123', {
        client_secret: 'super-secret-12345',
        api_key: 'top-secret-api-key',
        nested: {
          token: 'jwt.token.here',
        },
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logged = consoleErrorSpy.mock.calls[0][0];
      expect(logged).not.toContain('super-secret-12345');
      expect(logged).not.toContain('top-secret-api-key');
      expect(logged).not.toContain('secret-token-xyz123');
      expect(logged).toContain('[REDACTED]');

      consoleErrorSpy.mockRestore();
    });
  });
});
