import { AwardProviderInterface } from '../awardProvider.interface.js';
import { seatsAeroClient } from './seatsAero.client.js';
import { normalizeSeatsAeroResponse } from './seatsAero.normalizer.js';
import { logger } from '../../../utils/logger.js';

export class SeatsAeroAdapter extends AwardProviderInterface {
  constructor() {
    super();
    // Bounded in-memory cache for award results (TTL: 15 minutes, max 100 entries)
    this.cache = new Map();
    this.cacheTtlMs = 15 * 60 * 1000;
    this.maxCacheEntries = 100;
  }

  get name() {
    return 'seats_aero';
  }

  isConfigured() {
    return seatsAeroClient.isConfigured();
  }

  getCacheKey(params) {
    return `${params.origin}_${params.destination}_${params.departureDate}_${params.cabin || 'economy'}_${params.program || 'all'}`;
  }

  getFromCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  setInCache(key, data) {
    if (this.cache.size >= this.maxCacheEntries) {
      // Evict oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async searchAwards(params, options = {}) {
    if (!this.isConfigured()) {
      return {
        status: 'unsupported',
        available: false,
        provider: this.name,
        offers: [],
        total: 0,
        reason: 'Award flight inventory provider is not configured or authorized. Seats.aero API key is not configured or commercial partner agreement is pending.',
        eligibilityNote:
          'Commercial or production use of Seats.aero requires an explicit commercial agreement (support@seats.aero). Personal Pro API keys are legally restricted to personal non-commercial use.',
        meta: {
          dataSource: 'unconfigured',
          retrievalTimestamp: new Date().toISOString(),
          fromCache: false,
        },
      };
    }

    const cacheKey = this.getCacheKey(params);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logger.info('Returning cached award availability from Seats.aero bounded cache', { cacheKey });
      return {
        ...cached,
        meta: {
          ...cached.meta,
          fromCache: true,
        },
      };
    }

    try {
      const response = await seatsAeroClient.searchAwards(params, options);
      const normalizedOffers = normalizeSeatsAeroResponse(response.data, {
        requestedCabin: params.cabin || 'economy',
        requestedTravelers: params.travelers || 1,
        maxOffers: params.maxOffers || 10,
      });

      const result = {
        status: normalizedOffers.length > 0 ? 'available' : 'empty',
        available: normalizedOffers.length > 0,
        provider: this.name,
        offers: normalizedOffers,
        total: normalizedOffers.length,
        meta: {
          dataSource: 'live',
          retrievalTimestamp: new Date().toISOString(),
          fromCache: false,
          rateLimitRemaining: response.rateLimitMeta?.remaining,
          rateLimitResetSeconds: response.rateLimitMeta?.resetSeconds,
        },
      };

      this.setInCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error('Seats.aero award search failed', { message: err.message, code: err.code });

      if (err.code === 'RATE_LIMIT_EXCEEDED') {
        return {
          status: 'quota_exceeded',
          available: false,
          provider: this.name,
          offers: [],
          total: 0,
          reason: 'Seats.aero daily rate limit (1,000 calls/day) exceeded. Resets at midnight UTC.',
          meta: {
            dataSource: 'rate_limited',
            retrievalTimestamp: new Date().toISOString(),
            fromCache: false,
            rateLimitResetSeconds: err.meta?.resetSeconds,
          },
        };
      }

      return {
        status: 'error',
        available: false,
        provider: this.name,
        offers: [],
        total: 0,
        reason: err.message || 'Failed to retrieve award flight availability.',
        meta: {
          dataSource: 'error',
          retrievalTimestamp: new Date().toISOString(),
          fromCache: false,
        },
      };
    }
  }
}

export const seatsAeroAdapter = new SeatsAeroAdapter();
