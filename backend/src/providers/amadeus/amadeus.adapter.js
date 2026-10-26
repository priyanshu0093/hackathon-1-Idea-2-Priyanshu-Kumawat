import { FlightProviderInterface } from '../flightProvider.interface.js';
import { amadeusClient } from './amadeus.client.js';
import { normalizeAmadeusFlightOffers } from './amadeus.normalizer.js';
import { logger } from '../../utils/logger.js';

export class AmadeusAdapter extends FlightProviderInterface {
  get name() {
    return 'amadeus';
  }

  isConfigured() {
    return amadeusClient.isConfigured();
  }

  async search(params, options = {}) {
    if (!this.isConfigured()) {
      throw new Error(
        'Amadeus flight provider is not configured. Please supply AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in environment.'
      );
    }

    try {
      const rawData = await amadeusClient.searchFlightOffers(params, options);
      const normalized = normalizeAmadeusFlightOffers(rawData, {
        origin: params.origin,
        destination: params.destination,
        travelers: params.travelers || 1,
        dataSource: 'live',
      });

      return normalized;
    } catch (err) {
      logger.error('Amadeus flight search failed in adapter', { message: err.message });
      throw err;
    }
  }
}

export const amadeusAdapter = new AmadeusAdapter();
