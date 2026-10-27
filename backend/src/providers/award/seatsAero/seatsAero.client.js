import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

export class SeatsAeroClient {
  constructor() {
    this.baseUrl = 'https://seats.aero/partnerapi';
  }

  get apiKey() {
    return env.SEATS_AERO_API_KEY ? env.SEATS_AERO_API_KEY.trim() : '';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  /**
   * Search award flights via Seats.aero Cached Search endpoint
   */
  async searchAwards({ origin, destination, departureDate, cabin = 'economy', program = null, take = 20 }, { signal } = {}) {
    if (!this.isConfigured()) {
      throw new Error('Seats.aero API key is not configured. Supply SEATS_AERO_API_KEY in backend/.env.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const onAbort = () => controller.abort();
    if (signal) {
      signal.addEventListener('abort', onAbort);
    }

    const queryParams = new URLSearchParams({
      origin_airport: origin.toUpperCase(),
      destination_airport: destination.toUpperCase(),
      start_date: departureDate,
      end_date: departureDate,
      take: String(take),
    });

    if (cabin) {
      queryParams.append('cabins', cabin.toLowerCase());
    }
    if (program) {
      queryParams.append('sources', program.toLowerCase());
    }

    const url = `${this.baseUrl}/search?${queryParams.toString()}`;

    try {
      logger.info('Querying Seats.aero Award API', {
        route: `${origin}-${destination}`,
        date: departureDate,
        cabin,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Partner-Authorization': this.apiKey,
          'Accept': 'application/json',
          'User-Agent': 'A-Una-Milla-Award-Integration/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }

      // Track rate limit headers from Seats.aero
      const rateLimitMeta = {
        remaining: response.headers.get('X-RateLimit-Remaining')
          ? parseInt(response.headers.get('X-RateLimit-Remaining'), 10)
          : null,
        limit: response.headers.get('X-RateLimit-Limit')
          ? parseInt(response.headers.get('X-RateLimit-Limit'), 10)
          : null,
        resetSeconds: response.headers.get('X-RateLimit-Reset')
          ? parseInt(response.headers.get('X-RateLimit-Reset'), 10)
          : null,
      };

      if (response.status === 429) {
        logger.warn('Seats.aero rate limit exceeded', rateLimitMeta);
        const err = new Error('Seats.aero award API rate limit exceeded (1,000 calls/day limit reached).');
        err.code = 'RATE_LIMIT_EXCEEDED';
        err.statusCode = 429;
        err.meta = rateLimitMeta;
        throw err;
      }

      if (response.status === 401 || response.status === 403) {
        const errorText = await response.text();
        logger.error('Seats.aero API authorization failed', { status: response.status, errorText });
        const err = new Error('Seats.aero API authentication failed. Verify commercial API credentials.');
        err.code = 'PROVIDER_AUTH_ERROR';
        err.statusCode = 401;
        throw err;
      }

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Seats.aero API returned error', { status: response.status, errorText });
        const err = new Error(`Seats.aero returned HTTP ${response.status}: ${errorText}`);
        err.code = 'PROVIDER_ERROR';
        err.statusCode = response.status;
        throw err;
      }

      const data = await response.json();
      return {
        data,
        rateLimitMeta,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Seats.aero award search timed out after 8,000ms.');
        timeoutErr.code = 'PROVIDER_TIMEOUT';
        timeoutErr.statusCode = 504;
        throw timeoutErr;
      }
      throw err;
    }
  }
}

export const seatsAeroClient = new SeatsAeroClient();
