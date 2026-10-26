import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchAirports } from './airportService';

describe('Airport Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('searches airports successfully via API endpoint', async () => {
    const mockData = [
      { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', country: 'India' },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    const results = await searchAirports('Mumbai');
    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('BOM');
    expect(results[0].city).toBe('Mumbai');
  });

  it('falls back to local curated dataset if API fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const results = await searchAirports('Delhi');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].code).toBe('DEL');
    expect(results[0].city).toBe('Delhi');
  });

  it('searches by IATA code in fallback mode', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const results = await searchAirports('BOM');
    expect(results.some((a) => a.code === 'BOM')).toBe(true);
  });
});
