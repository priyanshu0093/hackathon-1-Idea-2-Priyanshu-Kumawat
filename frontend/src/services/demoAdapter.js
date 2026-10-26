import { DEMO_SWEET_SPOTS, DEMO_DATA_NOTICE } from '../data/demoData';
import { AIRPORTS } from '../data/airports';

/**
 * Cleanly separated demo adapter for flight search
 * Simulates network latency while respecting AbortController signals
 */
export async function searchFlightsDemo(searchParams, { signal } = {}) {
  // Check if request was already aborted
  if (signal?.aborted) {
    const error = new Error('Request was aborted');
    error.name = 'AbortError';
    throw error;
  }

  const {
    origin,
    destination,
    tripType = 'round_trip',
    travelers = 1,
    cabin = 'economy',
    isFlexibleDates = true,
    pointsProgram = 'amex_mr',
    skipPoints = false,
    stopover = false,
    legs,
  } = searchParams;

  // Simulate realistic network delay (350ms - 550ms)
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 400);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        const err = new Error('Flight search request aborted');
        err.name = 'AbortError';
        reject(err);
      });
    }
  });

  const originAirport = AIRPORTS.find((a) => a.code === origin) || { city: origin, code: origin, name: origin };
  const destAirport = AIRPORTS.find((a) => a.code === destination) || { city: destination, code: destination, name: destination };

  // Match known curated sweet spot or generate structured demo flight
  const exactSweetSpot = DEMO_SWEET_SPOTS.find(
    (h) => h.origin === origin && h.destination === destination
  );

  const cabinMultipliers = {
    economy: 1.0,
    premium_economy: 1.5,
    business: 2.6,
    first: 4.2,
  };
  const multiplier = cabinMultipliers[cabin] || 1.0;

  let baseCash = exactSweetSpot ? exactSweetSpot.normalCashPrice : 760;
  let basePoints = exactSweetSpot ? exactSweetSpot.awardPrice.pointsRequired : 23000;
  let baseTaxes = exactSweetSpot ? exactSweetSpot.awardPrice.taxesAndFees : 85;

  if (cabin === 'business') {
    baseCash = exactSweetSpot?.cabin === 'business' ? exactSweetSpot.normalCashPrice : Math.round(baseCash * 2.6);
    basePoints = exactSweetSpot?.cabin === 'business' ? basePoints : Math.round(basePoints * 1.85);
    baseTaxes = Math.round(baseTaxes * 1.25);
  } else if (cabin === 'premium_economy') {
    baseCash = Math.round(baseCash * 1.45);
    basePoints = Math.round(basePoints * 1.35);
  } else if (cabin === 'first') {
    baseCash = Math.round(baseCash * 4.0);
    basePoints = Math.round(basePoints * 3.1);
    baseTaxes = Math.round(baseTaxes * 1.5);
  }

  // Handle multi-stop itinerary legs if provided
  let routeLegs = [];
  if (Array.isArray(legs) && legs.length >= 2) {
    routeLegs = legs.map((leg, i) => ({
      legIndex: i + 1,
      from: leg.origin,
      to: leg.destination,
      date: leg.date,
      flightNumber: `IB${6000 + i * 150}`,
    }));
  }

  return {
    id: `demo-${origin}-${destination}-${Date.now()}`,
    origin,
    destination,
    originCity: originAirport.city,
    destinationCity: destAirport.city,
    originAirportName: originAirport.name,
    destAirportName: destAirport.name,
    airline: exactSweetSpot ? exactSweetSpot.airline : 'Oneworld Alliance Partner',
    flightNumber: exactSweetSpot ? exactSweetSpot.flightNumber : 'AW' + Math.floor(1000 + Math.random() * 9000),
    cabin,
    tripType,
    travelers,
    isFlexibleDates,
    legs: routeLegs,
    stopoverEnabled: Boolean(stopover),
    // Standard offer payloads for calculation
    offers: {
      cashPrice: baseCash,
      pointsRequired: basePoints,
      taxesAndFees: baseTaxes,
      pointsProgram: skipPoints ? 'None' : (exactSweetSpot ? exactSweetSpot.awardPrice.pointsProgram : 'Transferable Credit Card Points'),
      transferBank: exactSweetSpot?.awardPrice.transferBank || 'Amex MR / Chase UR / Capital One',
    },
    hackTitle: exactSweetSpot ? exactSweetSpot.hackTitle : `${destAirport.city} Award Travel Sweet Spot`,
    explanation: exactSweetSpot
      ? exactSweetSpot.explanation
      : `By taking advantage of distance-based partner award charts rather than dynamic airline cash pricing, you bypass high fuel surcharges and secure prime seats at a fraction of standard cash value.`,
    bookingSteps: exactSweetSpot?.bookingSteps || [
      { step: 1, title: 'Verify Seat Inventory', desc: `Search partner award inventory for ${origin} to ${destination} on your target dates.` },
      { step: 2, title: 'Initiate 1:1 Transfer', desc: `Transfer points into the partner airline program.` },
      { step: 3, title: 'Book & Confirm', desc: `Checkout on the partner airline portal paying points plus taxes.` },
    ],
    ...DEMO_DATA_NOTICE,
  };
}
