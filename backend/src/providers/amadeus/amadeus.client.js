import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  ProviderUnconfiguredError,
  ProviderTimeoutError,
  ProviderRateLimitError,
  ProviderError,
} from '../../utils/errors.js';

export class AmadeusClient {
  constructor(options = {}) {
    this.clientId = options.clientId || env.AMADEUS_CLIENT_ID;
    this.clientSecret = options.clientSecret || env.AMADEUS_CLIENT_SECRET;
    this.environment = options.environment || env.AMADEUS_ENV || 'test';
    this.baseUrl = this.environment === 'production'
      ? 'https://api.amadeus.com'
      : 'https://test.api.amadeus.com';

    this.cachedToken = null;
    this.tokenExpiresAt = 0;
    this.tokenPromise = null;
  }

  isConfigured() {
    return Boolean(
      this.clientId &&
      this.clientId.trim().length > 0 &&
      this.clientSecret &&
      this.clientSecret.trim().length > 0
    );
  }

  /**
   * Retrieves OAuth2 Bearer token from Amadeus, reusing cached token if valid
   */
  async getAccessToken() {
    if (!this.isConfigured()) {
      throw new ProviderUnconfiguredError();
    }

    // Return active token if still valid (with 60-second safety buffer)
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.cachedToken;
    }

    // Reuse concurrent token promise if another request is already fetching
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = (async () => {
      const url = `${this.baseUrl}/v1/security/oauth2/token`;
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        logger.info('Authenticating with Amadeus OAuth2 service', { env: this.environment });
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`Amadeus OAuth2 authentication failed (${res.status}): ${errText}`);
        }

        const data = await res.json();
        this.cachedToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in || 1799) * 1000;
        return this.cachedToken;
      } catch (err) {
        clearTimeout(timeoutId);
        logger.error('Failed to obtain Amadeus access token', { message: err.message });
        throw err;
      } finally {
        this.tokenPromise = null;
      }
    })();

    return this.tokenPromise;
  }

  /**
   * Performs Flight Offers Search v2
   */
  async searchFlightOffers(params, { signal } = {}) {
    const token = await this.getAccessToken();

    // Map internal cabin to Amadeus travelClass
    const cabinMap = {
      economy: 'ECONOMY',
      premium_economy: 'PREMIUM_ECONOMY',
      business: 'BUSINESS',
      first: 'FIRST',
    };

    const query = new URLSearchParams({
      originLocationCode: params.origin.toUpperCase(),
      destinationLocationCode: params.destination.toUpperCase(),
      departureDate: params.departureDate,
      adults: String(params.travelers || 1),
      max: String(params.maxOffers || 10),
    });

    if (params.returnDate) {
      query.set('returnDate', params.returnDate);
    }

    if (params.cabin && cabinMap[params.cabin]) {
      query.set('travelClass', cabinMap[params.cabin]);
    }

    if (params.currency) {
      query.set('currencyCode', params.currency.toUpperCase());
    }

    const url = `${this.baseUrl}/v2/shopping/flight-offers?${query.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      logger.info('Requesting flight offers from Amadeus API', {
        route: `${params.origin}-${params.destination}`,
        departureDate: params.departureDate,
        travelers: params.travelers,
      });

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        const amadeusError = errorJson.errors?.[0]?.detail || `Status ${res.status}: ${res.statusText}`;
        if (res.status === 429) {
          throw new ProviderRateLimitError(`Amadeus API rate limit exceeded: ${amadeusError}`);
        }
        throw new ProviderError(`Amadeus Search Error (${res.status}): ${amadeusError}`);
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.message?.includes('timed out')) {
        throw new ProviderTimeoutError('Flight search request to Amadeus timed out or was cancelled');
      }
      throw err;
    }
  }
}

export const amadeusClient = new AmadeusClient();
