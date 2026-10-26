import { env } from '../../config/env.js';

export class AwardProviderAdapter {
  constructor() {
    this.apiKey = env.SEATS_AERO_API_KEY;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async searchAwardAvailability(params) { // eslint-disable-line no-unused-vars
    // If no licensed partner award inventory credentials exist, return explicit unsupported state
    if (!this.isConfigured()) {
      return {
        status: 'unsupported',
        available: false,
        reason: 'Live award seat inventory provider (e.g. Seats.aero / PointsYeah) is not configured or authorized on this server.',
        loyaltyProgram: null,
        requiredPoints: null,
        taxesAndFees: null,
        seatsAvailable: null,
        dataFreshness: null,
        bookingInstructions: null,
      };
    }

    // Future Phase: When SEATS_AERO_API_KEY is configured and approved, query live award endpoint
    return {
      status: 'unsupported',
      available: false,
      reason: 'Seats.aero commercial API access is pending authorization.',
    };
  }
}

export const awardProviderAdapter = new AwardProviderAdapter();
