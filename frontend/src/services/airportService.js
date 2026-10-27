import { API_CONFIG } from './apiConfig';
import { AIRPORTS } from '../data/airports';

// In-memory query cache to avoid redundant API hits for recent queries
export const airportCache = new Map();

export function clearAirportCache() {
  airportCache.clear();
}

/**
 * Searches airports from backend API with fallback to local curated data
 * 
 * @param {string} query - City, airport name, or IATA code
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array>} List of matching airport objects
 */
export async function searchAirports(query = '', { signal } = {}) {
  const normalizedQuery = (query || '').trim().toLowerCase();

  // Check client-side query cache first
  if (airportCache.has(normalizedQuery)) {
    return airportCache.get(normalizedQuery);
  }

  try {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.airportsAutocomplete}${
      normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : ''
    }`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    if (!res.ok) {
      throw new Error(`Airports API returned status ${res.status}`);
    }

    const payload = await res.json();
    const data = Array.isArray(payload.data) ? payload.data : [];

    // Cache results (cap cache size at 50 to prevent unbounded growth)
    if (airportCache.size > 50) {
      const firstKey = airportCache.keys().next().value;
      airportCache.delete(firstKey);
    }
    airportCache.set(normalizedQuery, data);

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }

    console.warn('Backend airport search unavailable, falling back to local dataset:', err.message);

    // Fallback: search local curated dataset
    if (!normalizedQuery) {
      return AIRPORTS;
    }

    const localMatches = AIRPORTS.filter(
      (a) =>
        a.code.toLowerCase().includes(normalizedQuery) ||
        a.city.toLowerCase().includes(normalizedQuery) ||
        a.name.toLowerCase().includes(normalizedQuery) ||
        a.country.toLowerCase().includes(normalizedQuery)
    );

    return localMatches;
  }
}
