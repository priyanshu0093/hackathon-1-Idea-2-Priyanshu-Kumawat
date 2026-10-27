const PROGRAM_NAMES = {
  aeroplan: 'Air Canada Aeroplan',
  alaska: 'Alaska Airlines Mileage Plan',
  american: 'American Airlines AAdvantage',
  avianca: 'Avianca LifeMiles',
  delta: 'Delta SkyMiles',
  emirates: 'Emirates Skywards',
  etihad: 'Etihad Guest',
  flyingblue: 'Air France/KLM Flying Blue',
  jetblue: 'JetBlue TrueBlue',
  qantas: 'Qantas Frequent Flyer',
  qatar: 'Qatar Airways Privilege Club',
  saudia: 'Saudia Alfursan',
  smiles: 'GOL Smiles',
  united: 'United MileagePlus',
  velocity: 'Virgin Australia Velocity',
  virgin: 'Virgin Atlantic Flying Club',
  ba: 'British Airways Executive Club',
  iberia: 'Iberia Plus',
};

const PROGRAM_URLS = {
  aeroplan: 'https://www.aircanada.com/aeroplan/',
  american: 'https://www.aa.com/',
  delta: 'https://www.delta.com/',
  flyingblue: 'https://www.flyingblue.com/',
  united: 'https://www.united.com/',
  virgin: 'https://www.virginatlantic.com/',
  ba: 'https://www.britishairways.com/',
  iberia: 'https://www.iberia.com/',
  emirates: 'https://www.emirates.com/',
  qatar: 'https://www.qatarairways.com/',
  avianca: 'https://www.lifemiles.com/',
  alaska: 'https://www.alaskaair.com/',
};

/**
 * Normalizes a raw availability item from Seats.aero API into standard award offer
 */
export function normalizeSeatsAeroOffer(item, { requestedCabin = 'economy', requestedTravelers = 1 } = {}) {
  if (!item || typeof item !== 'object') return null;

  const route = item.Route || {};
  const origin = (route.OriginAirport || item.OriginAirport || '').toUpperCase();
  const destination = (route.DestinationAirport || item.DestinationAirport || '').toUpperCase();
  const departureDate = item.Date || null;
  const programCode = (route.Source || item.Source || '').toLowerCase();
  const programName = PROGRAM_NAMES[programCode] || (programCode ? programCode.toUpperCase() : 'Airline Loyalty Program');

  // Cabin selection
  let isAvailable = false;
  let pointsCostRaw = null;
  let remainingSeats = null;
  let isDirect = null;

  switch (requestedCabin) {
    case 'business':
      isAvailable = Boolean(item.JAvailable);
      pointsCostRaw = item.JMileageCost;
      remainingSeats = item.JRemainingSeats ?? item.RemainingSeats ?? null;
      isDirect = item.JDirect !== undefined ? Boolean(item.JDirect) : null;
      break;
    case 'first':
      isAvailable = Boolean(item.FAvailable);
      pointsCostRaw = item.FMileageCost;
      remainingSeats = item.FRemainingSeats ?? item.RemainingSeats ?? null;
      isDirect = item.FDirect !== undefined ? Boolean(item.FDirect) : null;
      break;
    case 'premium_economy':
      isAvailable = Boolean(item.WAvailable);
      pointsCostRaw = item.WMileageCost;
      remainingSeats = item.WRemainingSeats ?? item.RemainingSeats ?? null;
      isDirect = item.WDirect !== undefined ? Boolean(item.WDirect) : null;
      break;
    case 'economy':
    default:
      isAvailable = Boolean(item.YAvailable);
      pointsCostRaw = item.YMileageCost;
      remainingSeats = item.YRemainingSeats ?? item.RemainingSeats ?? null;
      isDirect = item.YDirect !== undefined ? Boolean(item.YDirect) : null;
      break;
  }

  // Parse points required (safely handle string or numeric input)
  const pointsRequired = pointsCostRaw ? parseInt(String(pointsCostRaw).replace(/,/g, ''), 10) : null;

  // Never invent values: if availability is false or points cost is invalid, skip
  if (!isAvailable || !pointsRequired || pointsRequired <= 0) {
    return null;
  }

  // Parse taxes (Seats.aero expresses TotalTaxes in cents)
  let taxesAmount = 0;
  if (item.TotalTaxes !== undefined && item.TotalTaxes !== null) {
    taxesAmount = Number((Number(item.TotalTaxes) / 100).toFixed(2));
  }
  const taxesCurrency = (item.TaxesCurrency || 'USD').toUpperCase();

  // Carriers & flight numbers
  const operatingAirlines = item.Carriers
    ? item.Carriers.split(',').map((c) => c.trim()).filter(Boolean)
    : [];
  const flightNumbers = item.FlightNumbers
    ? item.FlightNumbers.split(',').map((f) => f.trim()).filter(Boolean)
    : [];

  // Parse segments if available
  const segments = Array.isArray(item.AvailabilitySegments)
    ? item.AvailabilitySegments.map((seg) => ({
        origin: seg.OriginAirport || origin,
        destination: seg.DestinationAirport || destination,
        flightNumber: seg.FlightNumber || null,
        carrier: seg.Carrier || (operatingAirlines[0] || null),
        departureTime: seg.DepartureTime || null,
        arrivalTime: seg.ArrivalTime || null,
        aircraft: seg.Aircraft || null,
        cabin: requestedCabin,
      }))
    : [];

  const bookingUrl = PROGRAM_URLS[programCode] || null;

  return {
    id: String(item.ID || `seats_${origin}_${destination}_${departureDate}_${programCode}`),
    provider: 'seats_aero',
    origin,
    destination,
    departureDate,
    returnDate: null,
    cabin: requestedCabin,
    program: {
      code: programCode,
      name: programName,
    },
    operatingAirlines,
    flightNumbers,
    pointsRequired,
    taxesAndFees: {
      amount: taxesAmount,
      currency: taxesCurrency,
    },
    seatsAvailable: typeof remainingSeats === 'number' && remainingSeats >= 0 ? remainingSeats : null,
    passengers: requestedTravelers,
    isDirect,
    segments,
    bookingUrl,
    bookingInstructions:
      'Confirm saver seat availability directly on the official airline portal before transferring credit card points. Award seats are subject to capacity controls.',
    dataSource: 'verified_provider',
    retrievalTimestamp: item.UpdatedAt || new Date().toISOString(),
    raw: {
      source: programCode,
      rawTaxes: item.TotalTaxes,
      carriers: item.Carriers,
    },
  };
}

/**
 * Normalizes an array of Seats.aero items
 */
export function normalizeSeatsAeroResponse(rawPayload, { requestedCabin = 'economy', requestedTravelers = 1, maxOffers = 10 } = {}) {
  const items = Array.isArray(rawPayload?.data)
    ? rawPayload.data
    : Array.isArray(rawPayload)
    ? rawPayload
    : [];

  const normalizedOffers = [];

  for (const item of items) {
    const normalized = normalizeSeatsAeroOffer(item, { requestedCabin, requestedTravelers });
    if (normalized) {
      normalizedOffers.push(normalized);
    }
    if (normalizedOffers.length >= maxOffers) {
      break;
    }
  }

  return normalizedOffers;
}
