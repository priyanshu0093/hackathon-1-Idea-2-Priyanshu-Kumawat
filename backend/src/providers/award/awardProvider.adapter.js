import { seatsAeroAdapter } from './seatsAero/seatsAero.adapter.js';
import { mockAwardAdapter } from './mock/mockAward.adapter.js';

export class AwardProviderAdapter {
  isConfigured() {
    return seatsAeroAdapter.isConfigured();
  }

  getActiveProvider(params = {}) {
    const isDemo = params.demo === true || params.provider === 'mock' || params.provider === 'demo';
    if (isDemo) {
      return mockAwardAdapter;
    }
    return seatsAeroAdapter;
  }

  async searchAwardAvailability(params = {}, options = {}) {
    const isDemo = params.demo === true || params.provider === 'mock' || params.provider === 'demo';

    if (isDemo && params.origin && params.destination) {
      return await mockAwardAdapter.searchAwards(params, options);
    }

    if (!this.isConfigured() || !params.origin || !params.destination) {
      return {
        status: 'unsupported',
        available: false,
        provider: 'seats_aero',
        reason:
          'Award flight inventory provider is not configured or authorized. Live award flight inventory provider (Seats.aero) requires an authorized commercial partner agreement. Personal Pro API keys are legally restricted to personal, non-commercial use.',
        eligibilityNote:
          'To enable live award search, configure commercial API credentials in SEATS_AERO_API_KEY. Alternatively, use Demo Mode or the Smart Savings Redemption Planner with user-entered estimates.',
        offers: [],
        total: 0,
        meta: {
          dataSource: 'unconfigured',
          retrievalTimestamp: new Date().toISOString(),
          fromCache: false,
        },
      };
    }

    return await seatsAeroAdapter.searchAwards(params, options);
  }
}

export const awardProviderAdapter = new AwardProviderAdapter();
