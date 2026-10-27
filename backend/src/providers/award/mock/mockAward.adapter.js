import { AwardProviderInterface } from '../awardProvider.interface.js';

export class MockAwardAdapter extends AwardProviderInterface {
  get name() {
    return 'mock';
  }

  isConfigured() {
    return true;
  }

  async searchAwards(params) {
    const origin = (params.origin || 'MAD').toUpperCase();
    const destination = (params.destination || 'JFK').toUpperCase();
    const departureDate = params.departureDate || '2026-11-20';
    const cabin = params.cabin || 'economy';
    const travelers = params.travelers || 1;

    // Route-specific deterministic award offers
    let offers = [];

    if (origin === 'MAD' && destination === 'JFK') {
      offers = [
        {
          id: `mock_award_mad_jfk_ib_${cabin}`,
          provider: 'mock',
          origin: 'MAD',
          destination: 'JFK',
          departureDate,
          returnDate: null,
          cabin,
          program: {
            code: 'iberia',
            name: 'Iberia Plus',
          },
          operatingAirlines: ['IB'],
          flightNumbers: ['IB6251'],
          pointsRequired: cabin === 'business' ? 42500 : cabin === 'premium_economy' ? 25500 : 17000,
          taxesAndFees: {
            amount: cabin === 'business' ? 145.5 : 65.0,
            currency: 'EUR',
          },
          seatsAvailable: 4,
          passengers: travelers,
          isDirect: true,
          segments: [
            {
              origin: 'MAD',
              destination: 'JFK',
              flightNumber: 'IB6251',
              carrier: 'IB',
              departureTime: `${departureDate}T12:15:00Z`,
              arrivalTime: `${departureDate}T15:30:00Z`,
              aircraft: 'A350-900',
              cabin,
            },
          ],
          bookingUrl: 'https://www.iberia.com/',
          bookingInstructions:
            'Book online at Iberia.com using Avios. Confirm seat availability before transferring credit card points.',
          dataSource: 'demo',
          retrievalTimestamp: new Date().toISOString(),
          raw: null,
        },
        {
          id: `mock_award_mad_jfk_ba_${cabin}`,
          provider: 'mock',
          origin: 'MAD',
          destination: 'JFK',
          departureDate,
          returnDate: null,
          cabin,
          program: {
            code: 'ba',
            name: 'British Airways Executive Club',
          },
          operatingAirlines: ['BA', 'IB'],
          flightNumbers: ['BA1510'],
          pointsRequired: cabin === 'business' ? 50000 : 20000,
          taxesAndFees: {
            amount: 85.0,
            currency: 'EUR',
          },
          seatsAvailable: 2,
          passengers: travelers,
          isDirect: false,
          segments: [],
          bookingUrl: 'https://www.britishairways.com/',
          bookingInstructions: 'Book on British Airways Executive Club. Subject to partner availability.',
          dataSource: 'demo',
          retrievalTimestamp: new Date().toISOString(),
          raw: null,
        },
      ];
    } else if (origin === 'BOM' && destination === 'DEL') {
      offers = [
        {
          id: `mock_award_bom_del_ai_${cabin}`,
          provider: 'mock',
          origin: 'BOM',
          destination: 'DEL',
          departureDate,
          returnDate: null,
          cabin,
          program: {
            code: 'airindia',
            name: 'Air India Flying Returns',
          },
          operatingAirlines: ['AI'],
          flightNumbers: ['AI806'],
          pointsRequired: cabin === 'business' ? 12000 : 5000,
          taxesAndFees: {
            amount: 800,
            currency: 'INR',
          },
          seatsAvailable: 5,
          passengers: travelers,
          isDirect: true,
          segments: [],
          bookingUrl: 'https://www.airindia.com/',
          bookingInstructions: 'Redeem via Flying Returns portal directly.',
          dataSource: 'demo',
          retrievalTimestamp: new Date().toISOString(),
          raw: null,
        },
      ];
    } else {
      // Generic fallback demo award
      offers = [
        {
          id: `mock_award_generic_${origin}_${destination}_${cabin}`,
          provider: 'mock',
          origin,
          destination,
          departureDate,
          returnDate: null,
          cabin,
          program: {
            code: 'flyingblue',
            name: 'Air France/KLM Flying Blue',
          },
          operatingAirlines: ['AF'],
          flightNumbers: ['AF123'],
          pointsRequired: cabin === 'business' ? 45000 : 18500,
          taxesAndFees: {
            amount: 75.0,
            currency: 'EUR',
          },
          seatsAvailable: 3,
          passengers: travelers,
          isDirect: true,
          segments: [],
          bookingUrl: 'https://www.flyingblue.com/',
          bookingInstructions: 'Check Flying Blue promo rewards before booking.',
          dataSource: 'demo',
          retrievalTimestamp: new Date().toISOString(),
          raw: null,
        },
      ];
    }

    return {
      status: 'available',
      available: true,
      provider: this.name,
      offers,
      total: offers.length,
      meta: {
        dataSource: 'demo',
        retrievalTimestamp: new Date().toISOString(),
        fromCache: false,
      },
    };
  }
}

export const mockAwardAdapter = new MockAwardAdapter();
