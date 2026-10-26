import { describe, it, expect } from 'vitest';
import {
  parseIsoDuration,
  normalizeCabinClass,
  normalizeAmadeusOffer,
  normalizeAmadeusFlightOffers,
} from '../src/providers/amadeus/amadeus.normalizer.js';
import fixtureData from '../src/providers/mock/fixtures/amadeusSampleOffers.json' with { type: 'json' };

describe('Amadeus Normalizer', () => {
  describe('parseIsoDuration', () => {
    it('parses hours and minutes correctly', () => {
      expect(parseIsoDuration('PT8H20M')).toEqual({ minutes: 500, formatted: '8h 20m' });
    });

    it('parses hours only', () => {
      expect(parseIsoDuration('PT3H')).toEqual({ minutes: 180, formatted: '3h' });
    });

    it('parses minutes only', () => {
      expect(parseIsoDuration('PT45M')).toEqual({ minutes: 45, formatted: '45m' });
    });

    it('handles empty or invalid inputs gracefully', () => {
      expect(parseIsoDuration(null)).toEqual({ minutes: 0, formatted: 'N/A' });
      expect(parseIsoDuration('invalid')).toEqual({ minutes: 0, formatted: 'invalid' });
    });
  });

  describe('normalizeCabinClass', () => {
    it('normalizes various cabin formats', () => {
      expect(normalizeCabinClass('ECONOMY')).toBe('economy');
      expect(normalizeCabinClass('BUSINESS')).toBe('business');
      expect(normalizeCabinClass('PREMIUM_ECONOMY')).toBe('premium_economy');
      expect(normalizeCabinClass('FIRST')).toBe('first');
      expect(normalizeCabinClass(undefined)).toBe('economy');
    });
  });

  describe('normalizeAmadeusOffer', () => {
    it('normalizes raw Amadeus fixture into unified structure', () => {
      const rawOffer = fixtureData.data[0];
      const dictionaries = fixtureData.dictionaries;

      const normalized = normalizeAmadeusOffer(rawOffer, dictionaries, {
        origin: 'MAD',
        destination: 'JFK',
        travelers: 1,
        dataSource: 'fixture',
      });

      expect(normalized.id).toBe('1');
      expect(normalized.provider).toBe('amadeus');
      expect(normalized.dataSource).toBe('fixture');
      expect(normalized.airline.code).toBe('IB');
      expect(normalized.airline.name).toBe('Iberia');
      expect(normalized.origin).toBe('MAD');
      expect(normalized.destination).toBe('JFK');
      expect(normalized.isRoundTrip).toBe(true);

      // Price checks
      expect(normalized.price.currency).toBe('EUR');
      expect(normalized.price.total).toBe(748.2);
      expect(normalized.price.base).toBe(580.0);
      expect(normalized.price.taxesAndFees).toBe(168.2);
      expect(normalized.price.perTraveler).toBe(748.2);
      expect(normalized.price.isTotalForBooking).toBe(true);

      // Security & integrity checks
      expect(normalized.bookingUrl).toBeNull(); // Never invented!
      expect(normalized.itineraries).toHaveLength(2);
      expect(normalized.itineraries[0].segments[0].flightNumber).toBe('IB6251');
      expect(normalized.itineraries[0].segments[0].aircraft).toBe('Airbus A350-900');
    });
  });

  describe('normalizeAmadeusFlightOffers', () => {
    it('normalizes full collection of offers', () => {
      const result = normalizeAmadeusFlightOffers(fixtureData, {
        origin: 'MAD',
        destination: 'JFK',
      });

      expect(result.total).toBe(2);
      expect(result.offers).toHaveLength(2);
      expect(result.meta.provider).toBe('amadeus');
      expect(result.offers[1].airline.name).toBe('American Airlines');
    });
  });
});
