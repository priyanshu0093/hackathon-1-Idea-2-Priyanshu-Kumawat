/**
 * Amadeus Flight Offers Search v2 Normalizer
 * Normalizes raw Amadeus GDS response into standard internal schema
 */

// Parses ISO-8601 duration string (e.g., 'PT8H15M', 'PT2H', 'PT45M')
export function parseIsoDuration(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') {
    return { minutes: 0, formatted: 'N/A' };
  }

  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) {
    return { minutes: 0, formatted: durationStr };
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const totalMinutes = hours * 60 + minutes;

  const formatted = hours > 0 ? (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`) : `${minutes}m`;
  return { minutes: totalMinutes, formatted };
}

// Map Amadeus cabin enum to lowercase unified values
export function normalizeCabinClass(cabinStr) {
  if (!cabinStr) return 'economy';
  const upper = cabinStr.toUpperCase();
  if (upper.includes('BUSINESS')) return 'business';
  if (upper.includes('FIRST')) return 'first';
  if (upper.includes('PREMIUM')) return 'premium_economy';
  return 'economy';
}

/**
 * Normalizes a single Amadeus flight offer object
 * 
 * @param {Object} rawOffer - Raw offer item from Amadeus `data`
 * @param {Object} dictionaries - Optional carrier/aircraft lookup from Amadeus root
 * @param {Object} context - { origin, destination, travelers, dataSource }
 * @returns {Object} Normalized flight offer
 */
export function normalizeAmadeusOffer(rawOffer, dictionaries = {}, context = {}) {
  const carriers = dictionaries.carriers || {};
  const aircrafts = dictionaries.aircraft || {};

  const offerId = rawOffer.id ? String(rawOffer.id) : `amadeus-${Math.random().toString(36).substring(2, 9)}`;
  const currency = rawOffer.price?.currency || 'EUR';
  const totalAmount = parseFloat(rawOffer.price?.grandTotal || rawOffer.price?.total || '0');
  const baseAmount = parseFloat(rawOffer.price?.base || '0');
  const taxesAndFees = Math.max(0, parseFloat((totalAmount - baseAmount).toFixed(2)));

  const travelerCount = rawOffer.travelerPricings?.length || context.travelers || 1;
  const perTravelerAmount = travelerCount > 0 ? parseFloat((totalAmount / travelerCount).toFixed(2)) : totalAmount;

  // Extract cabin class from traveler pricings
  let cabinClass = 'economy';
  if (rawOffer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin) {
    cabinClass = normalizeCabinClass(rawOffer.travelerPricings[0].fareDetailsBySegment[0].cabin);
  }

  // Validating airline code
  const validatingAirlineCode = rawOffer.validatingAirlineCodes?.[0] || rawOffer.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Unknown';
  const validatingAirlineName = carriers[validatingAirlineCode] || validatingAirlineCode;

  // Normalize itineraries (outbound and optional return)
  const itineraries = (rawOffer.itineraries || []).map((itinerary, index) => {
    const direction = index === 0 ? 'outbound' : 'return';
    const parsedDuration = parseIsoDuration(itinerary.duration);
    const segments = itinerary.segments || [];
    const stops = Math.max(0, segments.length - 1);

    const normalizedSegments = segments.map((seg) => {
      const segCarrierCode = seg.carrierCode || 'Unknown';
      const segCarrierName = carriers[segCarrierCode] || segCarrierCode;
      const aircraftCode = seg.aircraft?.code || '';
      const aircraftName = aircrafts[aircraftCode] || aircraftCode;
      const segDuration = parseIsoDuration(seg.duration);

      return {
        id: seg.id || `${offerId}-seg-${seg.number}`,
        carrierCode: segCarrierCode,
        carrierName: segCarrierName,
        flightNumber: `${segCarrierCode}${seg.number || ''}`,
        aircraft: aircraftName || null,
        departure: {
          iataCode: seg.departure?.iataCode || '',
          terminal: seg.departure?.terminal || null,
          at: seg.departure?.at || '',
        },
        arrival: {
          iataCode: seg.arrival?.iataCode || '',
          terminal: seg.arrival?.terminal || null,
          at: seg.arrival?.at || '',
        },
        durationMinutes: segDuration.minutes,
        durationFormatted: segDuration.formatted,
        numberOfStops: seg.numberOfStops || 0,
      };
    });

    const originCode = normalizedSegments[0]?.departure?.iataCode || context.origin || '';
    const destCode = normalizedSegments[normalizedSegments.length - 1]?.arrival?.iataCode || context.destination || '';
    const departureTime = normalizedSegments[0]?.departure?.at || '';
    const arrivalTime = normalizedSegments[normalizedSegments.length - 1]?.arrival?.at || '';

    return {
      direction,
      origin: originCode,
      destination: destCode,
      departureTime,
      arrivalTime,
      durationMinutes: parsedDuration.minutes,
      durationFormatted: parsedDuration.formatted,
      stops,
      segments: normalizedSegments,
    };
  });

  const outbound = itineraries[0] || {};
  const returnItin = itineraries[1] || null;

  return {
    id: offerId,
    provider: 'amadeus',
    dataSource: context.dataSource || 'live',
    retrievalTimestamp: new Date().toISOString(),
    airline: {
      code: validatingAirlineCode,
      name: validatingAirlineName,
    },
    flightNumber: outbound.segments?.[0]?.flightNumber || validatingAirlineCode,
    origin: outbound.origin || context.origin,
    destination: outbound.destination || context.destination,
    cabinClass,
    travelers: travelerCount,
    isRoundTrip: Boolean(returnItin),
    price: {
      currency,
      total: totalAmount,
      base: baseAmount,
      taxesAndFees,
      perTraveler: perTravelerAmount,
      isTotalForBooking: true,
    },
    itineraries,
    numberOfBookableSeats: rawOffer.numberOfBookableSeats || 1,
    bookingUrl: null, // Amadeus Flight Offers Search v2 does not return deep booking URLs; do not invent one
  };
}

/**
 * Normalizes entire Amadeus Search response
 */
export function normalizeAmadeusFlightOffers(responseBody, context = {}) {
  if (!responseBody || !Array.isArray(responseBody.data)) {
    return {
      offers: [],
      total: 0,
      meta: {
        provider: 'amadeus',
        retrievalTimestamp: new Date().toISOString(),
      },
    };
  }

  const dictionaries = responseBody.dicts || responseBody.dictionaries || {};
  const offers = responseBody.data.map((offer) =>
    normalizeAmadeusOffer(offer, dictionaries, context)
  );

  return {
    offers,
    total: offers.length,
    meta: {
      provider: 'amadeus',
      count: offers.length,
      retrievalTimestamp: new Date().toISOString(),
      dataSource: context.dataSource || 'live',
    },
  };
}
