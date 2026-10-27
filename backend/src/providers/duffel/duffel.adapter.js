import { FlightProviderInterface } from '../flightProvider.interface.js';
import { duffelClient } from './duffel.client.js';
import { normalizeDuffelFlightOffers } from './duffel.normalizer.js';
import { logger } from '../../utils/logger.js';

export class DuffelAdapter extends FlightProviderInterface {
  get name() {
    return 'duffel';
  }

  isConfigured() {
    return duffelClient.isConfigured();
  }

  async search(params, options = {}) {
    if (!this.isConfigured()) {
      throw new Error(
        'Duffel flight provider is not configured. Please supply DUFFEL_ACCESS_TOKEN in backend/.env.'
      );
    }

    try {
      const rawData = await duffelClient.searchFlightOffers(params, options);
      const normalized = normalizeDuffelFlightOffers(rawData, {
        origin: params.origin,
        destination: params.destination,
        travelers: params.travelers || 1,
        cabin: params.cabin || 'economy',
        maxOffers: params.maxOffers || 10,
        dataSource: 'live',
      });

      return normalized;
    } catch (err) {
      logger.error('Duffel flight search failed in adapter', { message: err.message });
      throw err;
    }
  }
}

export const duffelAdapter = new DuffelAdapter();
