import { env } from '../../config/env.js';
import { duffelAdapter } from '../../providers/duffel/duffel.adapter.js';
import { amadeusAdapter } from '../../providers/amadeus/amadeus.adapter.js';
import { mockFlightAdapter } from '../../providers/mock/mock.adapter.js';
import { awardProviderAdapter } from '../../providers/award/awardProvider.adapter.js';
import { flightCache } from '../../utils/cache.js';
import { logger } from '../../utils/logger.js';

export class FlightService {
  constructor() {
    this.providerName = env.FLIGHT_PROVIDER;
  }

  getActiveProvider(requestedProvider, isDemo = false) {
    if (isDemo || requestedProvider === 'mock' || requestedProvider === 'demo' || this.providerName === 'mock') {
      return mockFlightAdapter;
    }

    // If caller explicitly requested a specific provider, strictly honor it
    if (requestedProvider === 'duffel') {
      if (duffelAdapter.isConfigured()) {
        return duffelAdapter;
      }
      throw new Error(
        'Live flight search is unavailable because Duffel API credentials are not configured. Configure DUFFEL_ACCESS_TOKEN in backend/.env, or switch to Demo Mode to explore sample flight hacks.'
      );
    }

    if (requestedProvider === 'amadeus') {
      if (amadeusAdapter.isConfigured()) {
        return amadeusAdapter;
      }
      throw new Error(
        'Live flight search is unavailable because Amadeus API credentials are not configured. Configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in backend/.env, or switch to Demo Mode to explore sample flight hacks.'
      );
    }

    // Default provider selection
    if (this.providerName === 'duffel' && duffelAdapter.isConfigured()) {
      return duffelAdapter;
    }
    if (this.providerName === 'amadeus' && amadeusAdapter.isConfigured()) {
      return amadeusAdapter;
    }
    if (duffelAdapter.isConfigured()) {
      return duffelAdapter;
    }
    if (amadeusAdapter.isConfigured()) {
      return amadeusAdapter;
    }

    throw new Error(
      'Live flight search is unavailable because no live flight provider (Duffel or Amadeus) is configured. Please configure DUFFEL_ACCESS_TOKEN in backend/.env, or switch to Demo Mode to explore sample flight hacks.'
    );
  }

  async searchFlights(searchParams, { signal } = {}) {
    const isDemo = searchParams.demo === true || searchParams.provider === 'demo' || searchParams.provider === 'mock';
    const effectiveProvider = isDemo ? 'mock' : (searchParams.provider || this.providerName);

    // 1. Generate cache key
    const cacheKey = flightCache.generateKey('flight-search', {
      origin: searchParams.origin,
      destination: searchParams.destination,
      departureDate: searchParams.departureDate,
      returnDate: searchParams.returnDate,
      travelers: searchParams.travelers,
      cabin: searchParams.cabin,
      currency: searchParams.currency,
      provider: effectiveProvider,
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

    // 3. Select active provider (throws if credentials missing for live)
    const provider = this.getActiveProvider(searchParams.provider, isDemo);

    // 4. Query provider
    const searchResult = await provider.search(searchParams, { signal });
    if (isDemo && searchResult?.meta) {
      searchResult.meta.dataSource = 'demo';
    }

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
