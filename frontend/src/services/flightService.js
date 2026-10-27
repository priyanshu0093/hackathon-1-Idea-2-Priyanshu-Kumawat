import { API_CONFIG } from './apiConfig';
import { searchFlightsDemo } from './demoAdapter';

/**
 * Production flight search service connecting to Express backend
 * 
 * @param {Object} searchParams
 * @param {Object} options
 * @param {AbortSignal} [options.signal]
 * @param {boolean} [options.useDemo=false] - Explicit flag for illustrative demo mode
 * @returns {Promise<Object>}
 */
export async function searchFlights(searchParams, { signal, useDemo = false } = {}) {
  // If explicitly requested demo mode, invoke demo adapter
  if (useDemo || searchParams.useDemo) {
    return searchFlightsDemo(searchParams, { signal });
  }

  // Connect to live Express endpoint
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.requestTimeoutMs);

  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.flightSearch}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureDate: searchParams.departureDate,
        returnDate: searchParams.tripType === 'round_trip' ? searchParams.returnDate : undefined,
        tripType: searchParams.tripType,
        travelers: searchParams.travelers || 1,
        cabin: searchParams.cabin || 'economy',
        currency: 'EUR',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const message = errorJson.error?.message || `Flight search failed (HTTP ${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      error.code = errorJson.error?.code;
      throw error;
    }

    const payload = await response.json();
    const data = payload.data || {};
    const offers = data.offers || [];

    if (offers.length === 0) {
      return {
        id: `empty-${Date.now()}`,
        isEmpty: true,
        origin: searchParams.origin,
        destination: searchParams.destination,
        message: 'No available flight routes found for the selected dates.',
        offers: null,
        isDemo: false,
        dataSource: 'live',
      };
    }

    // Best primary cash offer
    const bestCashOffer = offers[0];
    const verifiedAwardOffer = Array.isArray(data.awardInventory?.offers) && data.awardInventory.offers.length > 0
      ? data.awardInventory.offers[0]
      : null;

    return {
      id: bestCashOffer.id,
      isEmpty: false,
      origin: bestCashOffer.origin,
      destination: bestCashOffer.destination,
      originCity: bestCashOffer.origin,
      destinationCity: bestCashOffer.destination,
      airline: bestCashOffer.airline.name || bestCashOffer.airline.code,
      flightNumber: bestCashOffer.flightNumber,
      cabin: bestCashOffer.cabinClass,
      tripType: searchParams.tripType,
      travelers: bestCashOffer.travelers,
      isRoundTrip: bestCashOffer.isRoundTrip,
      price: bestCashOffer.price,
      itineraries: bestCashOffer.itineraries,
      bookingUrl: bestCashOffer.bookingUrl,
      // Award inventory status from server (Phase 15 Genuine Award Integration)
      awardInventory: data.awardInventory || {
        status: 'unsupported',
        available: false,
      },
      verifiedAwardOffer,
      // Offer details for savings comparison
      offers: {
        cashPrice: bestCashOffer.price.total,
        taxesAndFees: bestCashOffer.price.taxesAndFees,
        currency: bestCashOffer.price.currency,
        pointsRequired: verifiedAwardOffer ? verifiedAwardOffer.pointsRequired : null,
        pointsProgram: verifiedAwardOffer ? verifiedAwardOffer.program?.name : null,
        awardTaxesAndFees: verifiedAwardOffer ? verifiedAwardOffer.taxesAndFees?.amount : null,
        awardCurrency: verifiedAwardOffer ? verifiedAwardOffer.taxesAndFees?.currency : null,
      },
      dataSource: bestCashOffer.dataSource || 'live',
      provider: bestCashOffer.provider || 'duffel',
      isDemo: false,
      allOffers: offers,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw err;
    }
    // Strict requirement: Never silently fake live data with demo data when live search was requested
    throw err;
  }
}

/**
 * Directly search award availability using genuine partner provider (Seats.aero)
 */
export async function searchAwardFlights(searchParams, { signal } = {}) {
  const queryParams = new URLSearchParams({
    origin: searchParams.origin,
    destination: searchParams.destination,
    departureDate: searchParams.departureDate,
    cabin: searchParams.cabin || 'economy',
    travelers: String(searchParams.travelers || 1),
  });

  if (searchParams.demo) {
    queryParams.append('demo', 'true');
  }
  if (searchParams.program) {
    queryParams.append('program', searchParams.program);
  }

  const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/flights/award-search?${queryParams.toString()}`, {
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch award availability: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}
