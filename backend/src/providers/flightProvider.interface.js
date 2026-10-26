/**
 * Flight Provider Interface Contract
 * 
 * Every flight provider adapter must implement:
 * - name: string (identifier)
 * - isConfigured(): boolean
 * - search(params, options): Promise<{ offers: NormalizedFlightOffer[], total: number, meta: object }>
 */

export class FlightProviderInterface {
  get name() {
    throw new Error('Provider name getter must be implemented');
  }

  isConfigured() {
    throw new Error('isConfigured() must be implemented');
  }

  async search(params, options = {}) { // eslint-disable-line no-unused-vars
    throw new Error('search() must be implemented');
  }
}
