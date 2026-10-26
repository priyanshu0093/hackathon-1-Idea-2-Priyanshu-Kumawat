import { FlightProviderInterface } from '../flightProvider.interface.js';
import { normalizeAmadeusFlightOffers } from '../amadeus/amadeus.normalizer.js';
import fixtureData from './fixtures/amadeusSampleOffers.json' with { type: 'json' };

export class MockFlightAdapter extends FlightProviderInterface {
  get name() {
    return 'mock';
  }

  isConfigured() {
    return true;
  }

  async search(params) {
    // Normalizes real sample fixture using the exact same normalization pipeline
    const normalized = normalizeAmadeusFlightOffers(fixtureData, {
      origin: params.origin,
      destination: params.destination,
      travelers: params.travelers || 1,
      dataSource: 'fixture',
    });

    return normalized;
  }
}

export const mockFlightAdapter = new MockFlightAdapter();
