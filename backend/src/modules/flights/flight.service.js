import { env } from '../../config/env.js';
import { amadeusAdapter } from '../../providers/amadeus/amadeus.adapter.js';
import { mockFlightAdapter } from '../../providers/mock/mock.adapter.js';
import { awardProviderAdapter } from '../../providers/award/awardProvider.adapter.js';
import { flightCache } from '../../utils/cache.js';
import { logger } from '../../utils/logger.js';

export class FlightService {
  constructor() {
    this.providerName = env.FLIGHT_PROVIDER;
  }

  getActiveProvider() {
    if (this.providerName === 'mock') {
      return mockFlightAdapter;
    }

    if (amadeusAdapter.isConfigured()) {
      return amadeusAdapter;
    }

    // In development or test, fall back to mock adapter with explicit metadata indicator
    if (env.NODE_ENV !== 'production') {
      logger.warn('Amadeus credentials not configured. Using mock fixture provider for development.');
      return mockFlightAdapter;
    }

    throw new Error('No live flight provider credentials configured. Please configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET.');
  }

  async searchFlights(searchParams, { signal } = {}) {
    // 1. Generate cache key
    const cacheKey = flightCache.generateKey('flight-search', {
      origin: searchParams.origin,
      destination: searchParams.destination,
      departureDate: searchParams.departureDate,
      returnDate: searchParams.returnDate,
      travelers: searchParams.travelers,
      cabin: searchParams.cabin,
      currency: searchParams.currency,
    });

    // 2. Check cache
    const cachedResult = flightCache.get(cacheKey);
    if (cachedResult) {
      logger.info('Returning cached flight search results', { key: cacheKey });
      return {
        ...cachedResult,
        meta: {
          ...cachedResult.meta,
          fromCache: true,
        },
      };
    }

    // 3. Select active provider
    const provider = this.getActiveProvider();

    // 4. Query provider
    const searchResult = await provider.search(searchParams, { signal });

    // 5. Query award inventory status (Section 6)
    const awardStatus = await awardProviderAdapter.searchAwardAvailability(searchParams);

    // 6. Assemble response
    const responsePayload = {
      ...searchResult,
      awardInventory: awardStatus,
      searchParams: {
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureDate: searchParams.departureDate,
        returnDate: searchParams.returnDate || null,
        tripType: searchParams.tripType,
        travelers: searchParams.travelers,
        cabin: searchParams.cabin,
        currency: searchParams.currency,
      },
    };

    // 7. Store in cache
    flightCache.set(cacheKey, responsePayload);

    return responsePayload;
  }
}

export const flightService = new FlightService();
