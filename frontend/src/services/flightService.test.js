import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchFlights } from './flightService';
import { searchAirports, clearAirportCache } from './airportService';
import { searchFlightsDemo } from './demoAdapter';

describe('Flight & Airport Services (Frontend Phase 8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete global.fetch;
    clearAirportCache();
  });

  describe('searchFlights error states', () => {
    it('propagates 503 PROVIDER_UNCONFIGURED with clear error message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          success: false,
          error: {
            code: 'PROVIDER_UNCONFIGURED',
            message: 'Live flight search is unavailable because Amadeus API credentials are not configured.',
          },
        }),
      });

      await expect(
        searchFlights({
          origin: 'BOM',
          destination: 'DEL',
          departureDate: '2026-11-20',
          tripType: 'one_way',
        })
      ).rejects.toThrow('Live flight search is unavailable because Amadeus API credentials are not configured.');
    });

    it('propagates 504 PROVIDER_TIMEOUT', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 504,
        json: async () => ({
          success: false,
          error: {
            code: 'PROVIDER_TIMEOUT',
            message: 'Flight search request to upstream provider timed out.',
          },
        }),
      });

      await expect(
        searchFlights({
          origin: 'BOM',
          destination: 'DEL',
          departureDate: '2026-11-20',
        })
      ).rejects.toThrow('Flight search request to upstream provider timed out.');
    });

    it('handles empty results cleanly with isEmpty: true', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            offers: [],
            total: 0,
            message: 'No flight offers found for the specified route and dates.',
          },
        }),
      });

      const result = await searchFlights({
        origin: 'BOM',
        destination: 'DEL',
        departureDate: '2026-11-20',
      });

      expect(result.isEmpty).toBe(true);
      expect(result.offers).toBeNull();
      expect(result.message).toContain('No available flight routes found');
    });
  });

  describe('Demo Mode flight search', () => {
    it('returns curated sweet spot for BOM -> DEL in demo mode', async () => {
      const demoResult = await searchFlightsDemo({
        origin: 'BOM',
        destination: 'DEL',
        tripType: 'round_trip',
        travelers: 1,
        cabin: 'economy',
      });

      expect(demoResult.isDemo).toBe(true);
      expect(demoResult.origin).toBe('BOM');
      expect(demoResult.destination).toBe('DEL');
      expect(demoResult.airline).toBe('Air India');
      expect(demoResult.offers.pointsRequired).toBe(5000);
      expect(demoResult.badgeText).toContain('Illustrative Demo Data');
    });

    it('returns curated sweet spot for DEL -> LHR in demo mode', async () => {
      const demoResult = await searchFlightsDemo({
        origin: 'DEL',
        destination: 'LHR',
        tripType: 'one_way',
        travelers: 1,
        cabin: 'economy',
      });

      expect(demoResult.isDemo).toBe(true);
      expect(demoResult.origin).toBe('DEL');
      expect(demoResult.destination).toBe('LHR');
      expect(demoResult.airline).toBe('Virgin Atlantic');
      expect(demoResult.offers.pointsRequired).toBe(12500);
    });
  });

  describe('Airport search for Indian gateways', () => {
    it('locates Mumbai (BOM) and Delhi (DEL) in airport search', async () => {
      const bomResults = await searchAirports('BOM');
      expect(bomResults.some((a) => a.code === 'BOM' && a.city === 'Mumbai')).toBe(true);

      const delResults = await searchAirports('Delhi');
      expect(delResults.some((a) => a.code === 'DEL' && a.city === 'Delhi')).toBe(true);
    });
  });
});
