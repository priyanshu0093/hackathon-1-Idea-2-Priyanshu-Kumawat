import { describe, it, expect } from 'vitest';
import { flightSearchSchema } from '../src/modules/flights/flight.validation.js';

describe('Flight Search Validation Schema', () => {
  it('accepts valid one-way search parameters', () => {
    const input = {
      origin: 'mad',
      destination: 'jfk',
      departureDate: '2026-11-15',
      tripType: 'one_way',
      travelers: 2,
      cabin: 'business',
      currency: 'EUR',
    };

    const parsed = flightSearchSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    expect(parsed.data.origin).toBe('MAD'); // Uppercased
    expect(parsed.data.destination).toBe('JFK');
    expect(parsed.data.travelers).toBe(2);
  });

  it('accepts valid round-trip search parameters', () => {
    const input = {
      origin: 'MAD',
      destination: 'MIA',
      departureDate: '2026-11-15',
      returnDate: '2026-11-22',
      tripType: 'round_trip',
      travelers: 1,
    };

    const parsed = flightSearchSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('rejects identical origin and destination', () => {
    const input = {
      origin: 'MAD',
      destination: 'MAD',
      departureDate: '2026-11-15',
    };

    const parsed = flightSearchSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues[0].message).toContain('identical');
  });

  it('rejects return date earlier than departure date', () => {
    const input = {
      origin: 'MAD',
      destination: 'JFK',
      departureDate: '2026-11-20',
      returnDate: '2026-11-15',
      tripType: 'round_trip',
    };

    const parsed = flightSearchSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues[0].message).toContain('earlier than departure');
  });

  it('rejects invalid traveler count', () => {
    const tooMany = {
      origin: 'MAD',
      destination: 'JFK',
      departureDate: '2026-11-15',
      travelers: 10,
    };
    expect(flightSearchSchema.safeParse(tooMany).success).toBe(false);

    const zero = {
      origin: 'MAD',
      destination: 'JFK',
      departureDate: '2026-11-15',
      travelers: 0,
    };
    expect(flightSearchSchema.safeParse(zero).success).toBe(false);
  });
});
