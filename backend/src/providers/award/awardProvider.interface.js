/**
 * Award Provider Interface Contract
 * 
 * Every award flight inventory provider adapter must implement:
 * - name: string (identifier, e.g. 'seats_aero', 'mock')
 * - isConfigured(): boolean
 * - searchAwards(params, options): Promise<NormalizedAwardSearchResult>
 */

export class AwardProviderInterface {
  get name() {
    throw new Error('Award provider name getter must be implemented');
  }

  isConfigured() {
    throw new Error('isConfigured() must be implemented');
  }

  async searchAwards(params, options = {}) { // eslint-disable-line no-unused-vars
    throw new Error('searchAwards() must be implemented');
  }
}
