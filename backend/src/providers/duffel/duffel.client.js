import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  ProviderUnconfiguredError,
  ProviderTimeoutError,
  ProviderRateLimitError,
  ProviderError,
} from '../../utils/errors.js';

export class DuffelClient {
  constructor(options = {}) {
    this.accessToken = options.accessToken || env.DUFFEL_ACCESS_TOKEN;
    this.baseUrl = options.baseUrl || 'https://api.duffel.com';
    this.apiVersion = options.apiVersion || 'v2';
  }

  isConfigured() {
    const token = this.accessToken || env.DUFFEL_ACCESS_TOKEN;
    return Boolean(token && typeof token === 'string' && token.trim().length > 0);
  }

  getToken() {
    return (this.accessToken || env.DUFFEL_ACCESS_TOKEN || '').trim();
  }

  /**
   * Performs Offer Requests & returns flight offers from Duffel API
   */
  async searchFlightOffers(params, { signal } = {}) {
    if (!this.isConfigured()) {
      throw new ProviderUnconfiguredError(
        'Duffel API access token is not configured. Supply DUFFEL_ACCESS_TOKEN in backend/.env.'
      );
    }

    const token = this.getToken();

    // Slices for Duffel: outbound and optional return
    const slices = [
      {
        origin: params.origin.toUpperCase(),
        destination: params.destination.toUpperCase(),
        departure_date: params.departureDate,
      },
    ];

    if (params.tripType === 'round_trip' && params.returnDate) {
      slices.push({
        origin: params.destination.toUpperCase(),
        destination: params.origin.toUpperCase(),
        departure_date: params.returnDate,
      });
    }

    const travelersCount = Number(params.travelers) || 1;
    const passengers = Array.from({ length: travelersCount }, () => ({ type: 'adult' }));

    const cabinClassMap = {
      economy: 'economy',
      premium_economy: 'premium_economy',
      business: 'business',
      first: 'first',
    };

    const cabinClass = cabinClassMap[params.cabin] || 'economy';

    const requestBody = {
      data: {
        slices,
        passengers,
        cabin_class: cabinClass,
      },
    };

    const url = `${this.baseUrl}/air/offer_requests?return_offers=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      logger.info('Requesting flight offers from Duffel API', {
        route: `${params.origin}-${params.destination}`,
        departureDate: params.departureDate,
        travelers: travelersCount,
        cabin: cabinClass,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Duffel-Version': this.apiVersion,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        const duffelError =
          errorJson.errors?.[0]?.message ||
          errorJson.errors?.[0]?.title ||
          `Status ${res.status}: ${res.statusText}`;

        if (res.status === 429) {
          throw new ProviderRateLimitError(`Duffel API rate limit exceeded: ${duffelError}`);
        }
        if (res.status === 401 || res.status === 403) {
          throw new ProviderError(`Duffel Authentication Error (${res.status}): ${duffelError}`);
        }
        throw new ProviderError(`Duffel Search Error (${res.status}): ${duffelError}`);
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.message?.includes('timed out')) {
        throw new ProviderTimeoutError('Flight search request to Duffel timed out or was cancelled');
      }
      throw err;
    }
  }
}

export const duffelClient = new DuffelClient();
