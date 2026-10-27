import { parseIsoDuration } from '../amadeus/amadeus.normalizer.js';

/**
 * Normalizes a single Duffel offer object into the standard A Una Milla schema
 */
export function normalizeDuffelOffer(rawOffer, context = {}) {
  const offerId = rawOffer.id ? String(rawOffer.id) : `duffel-${Math.random().toString(36).substring(2, 9)}`;
  const currency = rawOffer.total_currency || rawOffer.base_currency || 'EUR';
  const totalAmount = parseFloat(rawOffer.total_amount || '0');
  const baseAmount = parseFloat(rawOffer.base_amount || '0');
  const taxAmount = parseFloat(rawOffer.tax_amount || '0');
  const taxesAndFees = taxAmount > 0 ? taxAmount : Math.max(0, parseFloat((totalAmount - baseAmount).toFixed(2)));

  const travelerCount = rawOffer.passengers?.length || context.travelers || 1;
  const perTravelerAmount = travelerCount > 0 ? parseFloat((totalAmount / travelerCount).toFixed(2)) : totalAmount;

  // Airline identity
  const owner = rawOffer.owner || {};
  const airlineCode = owner.iata_code || 'ZZ';
  const airlineName = owner.name || 'Airline Partner';

  // Normalize itineraries from slices
  const itineraries = (rawOffer.slices || []).map((slice, index) => {
    const direction = index === 0 ? 'outbound' : 'return';
    const parsedDuration = parseIsoDuration(slice.duration);
    const segments = slice.segments || [];
    const stops = Math.max(0, segments.length - 1);

    const normalizedSegments = segments.map((seg) => {
      const segCarrierCode =
        seg.marketing_carrier?.iata_code ||
        seg.operating_carrier?.iata_code ||
        airlineCode;
      const segCarrierName =
        seg.marketing_carrier?.name ||
        seg.operating_carrier?.name ||
        airlineName;
      const flightNumber = `${segCarrierCode}${seg.marketing_carrier_flight_number || ''}`;
      const aircraftName = seg.aircraft?.name || null;
      const segDuration = parseIsoDuration(seg.duration);

      const depIata =
        seg.origin?.iata_code ||
        (typeof seg.origin === 'string' ? seg.origin : '') ||
        '';
      const arrIata =
        seg.destination?.iata_code ||
        (typeof seg.destination === 'string' ? seg.destination : '') ||
        '';

      return {
        id: seg.id || `${offerId}-seg-${flightNumber}`,
        carrierCode: segCarrierCode,
        carrierName: segCarrierName,
        flightNumber,
        aircraft: aircraftName,
        departure: {
          iataCode: depIata,
          terminal: seg.origin_terminal || null,
          at: seg.departing_at || '',
        },
        arrival: {
          iataCode: arrIata,
          terminal: seg.destination_terminal || null,
          at: seg.arriving_at || '',
        },
        durationMinutes: segDuration.minutes,
        durationFormatted: segDuration.formatted,
        numberOfStops: Array.isArray(seg.stops) ? seg.stops.length : 0,
      };
    });

    const originCode =
      normalizedSegments[0]?.departure?.iataCode ||
      slice.origin?.iata_code ||
      context.origin ||
      '';
    const destCode =
      normalizedSegments[normalizedSegments.length - 1]?.arrival?.iataCode ||
      slice.destination?.iata_code ||
      context.destination ||
      '';
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
    provider: 'duffel',
    dataSource: context.dataSource || 'live',
    retrievalTimestamp: new Date().toISOString(),
    airline: {
      code: airlineCode,
      name: airlineName,
    },
    flightNumber: outbound.segments?.[0]?.flightNumber || airlineCode,
    origin: outbound.origin || context.origin,
    destination: outbound.destination || context.destination,
    cabinClass: context.cabin || 'economy',
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
    numberOfBookableSeats: 9,
    bookingUrl: null, // Duffel offers are not direct confirmed bookings
  };
}

/**
 * Normalizes entire Duffel Search response
 */
export function normalizeDuffelFlightOffers(responseBody, context = {}) {
  const rawOffers = responseBody?.data?.offers;

  if (!Array.isArray(rawOffers)) {
    return {
      offers: [],
      total: 0,
      meta: {
        provider: 'duffel',
        retrievalTimestamp: new Date().toISOString(),
      },
    };
  }

  const maxOffers = Number(context.maxOffers) || 10;
  const slicedOffers = rawOffers.slice(0, maxOffers);

  const offers = slicedOffers.map((offer) =>
    normalizeDuffelOffer(offer, context)
  );

  return {
    offers,
    total: offers.length,
    meta: {
      provider: 'duffel',
      count: offers.length,
      retrievalTimestamp: new Date().toISOString(),
      dataSource: context.dataSource || 'live',
    },
  };
}
