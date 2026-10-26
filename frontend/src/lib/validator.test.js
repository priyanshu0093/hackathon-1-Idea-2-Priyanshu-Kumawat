import { describe, it, expect } from 'vitest';
import { validateQuickFlight, validateFullTrip, isDateInPast } from './validator';

describe('validateQuickFlight', () => {
  const getFutureDate = (daysAhead = 14) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  it('validates a correct round-trip flight search', () => {
    const validData = {
      origin: 'MAD',
      destination: 'JFK',
      tripType: 'round_trip',
      departureDate: getFutureDate(10),
      returnDate: getFutureDate(20),
      travelers: 1,
      cabin: 'economy',
      skipPoints: false,
      pointsBalance: '30000',
    };

    const result = validateQuickFlight(validData);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('rejects identical origin and destination airports', () => {
    const data = {
      origin: 'MAD',
      destination: 'mad',
      tripType: 'one_way',
      departureDate: getFutureDate(5),
      travelers: 1,
    };

    const result = validateQuickFlight(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.destination).toContain('different');
  });

  it('rejects return dates that precede departure dates', () => {
    const data = {
      origin: 'BCN',
      destination: 'MIA',
      tripType: 'round_trip',
      departureDate: getFutureDate(15),
      returnDate: getFutureDate(10), // before departure
      travelers: 1,
    };

    const result = validateQuickFlight(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.returnDate).toContain('earlier than departure');
  });

  it('rejects past departure dates', () => {
    const data = {
      origin: 'MAD',
      destination: 'JFK',
      tripType: 'one_way',
      departureDate: '2020-01-01',
      travelers: 1,
    };

    const result = validateQuickFlight(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.departureDate).toContain('past');
  });

  it('rejects negative points balance', () => {
    const data = {
      origin: 'MAD',
      destination: 'JFK',
      tripType: 'one_way',
      departureDate: getFutureDate(5),
      travelers: 1,
      skipPoints: false,
      pointsBalance: '-5000',
    };

    const result = validateQuickFlight(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.pointsBalance).toContain('cannot be negative');
  });

  it('rejects invalid traveler counts', () => {
    const dataZero = {
      origin: 'MAD',
      destination: 'JFK',
      tripType: 'one_way',
      departureDate: getFutureDate(5),
      travelers: 0,
    };
    expect(validateQuickFlight(dataZero).isValid).toBe(false);

    const dataExcess = {
      origin: 'MAD',
      destination: 'JFK',
      tripType: 'one_way',
      departureDate: getFutureDate(5),
      travelers: 12,
    };
    expect(validateQuickFlight(dataExcess).isValid).toBe(false);
  });
});

describe('validateFullTrip', () => {
  const getFutureDate = (daysAhead = 14) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  it('validates a valid multi-stop itinerary', () => {
    const data = {
      legs: [
        { origin: 'MAD', destination: 'LIS', date: getFutureDate(10) },
        { origin: 'LIS', destination: 'JFK', date: getFutureDate(14) },
      ],
      travelers: 2,
      skipPoints: false,
      pointsBalance: '45000',
    };

    const result = validateFullTrip(data);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('requires at least 2 legs for multi-stop', () => {
    const data = {
      legs: [{ origin: 'MAD', destination: 'JFK', date: getFutureDate(10) }],
      travelers: 1,
    };

    const result = validateFullTrip(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.general).toContain('at least 2 legs');
  });

  it('detects chronological sequence errors between legs', () => {
    const data = {
      legs: [
        { origin: 'MAD', destination: 'BCN', date: getFutureDate(20) },
        { origin: 'BCN', destination: 'JFK', date: getFutureDate(15) }, // before leg 1!
      ],
      travelers: 1,
    };

    const result = validateFullTrip(data);
    expect(result.isValid).toBe(false);
    expect(result.legErrors[1].date).toBeDefined();
  });
});
