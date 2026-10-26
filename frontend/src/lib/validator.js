/**
 * Pure validation library for search forms in A Una Milla
 */

// Helper to check if date string is valid ISO date YYYY-MM-DD
export function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00');
  return !isNaN(d.getTime());
}

// Helper to check if date is before today
export function isDateInPast(dateStr) {
  if (!isValidDateFormat(dateStr)) return false;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target < today;
}

/**
 * Validates Quick Flight search parameters
 * 
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateQuickFlight(data) {
  const errors = {};

  // 1. Origin
  if (!data.origin || typeof data.origin !== 'string' || !data.origin.trim()) {
    errors.origin = 'Please select a departure airport.';
  }

  // 2. Destination
  if (!data.destination || typeof data.destination !== 'string' || !data.destination.trim()) {
    errors.destination = 'Please select a destination airport.';
  } else if (data.origin && data.origin.trim().toUpperCase() === data.destination.trim().toUpperCase()) {
    errors.destination = 'Origin and destination airports must be different.';
  }

  // 3. Departure Date
  if (!data.departureDate) {
    errors.departureDate = 'Departure date is required.';
  } else if (!isValidDateFormat(data.departureDate)) {
    errors.departureDate = 'Invalid departure date format.';
  } else if (isDateInPast(data.departureDate)) {
    errors.departureDate = 'Departure date cannot be in the past.';
  }

  // 4. Return Date (for round trips)
  if (data.tripType === 'round_trip') {
    if (!data.returnDate) {
      errors.returnDate = 'Return date is required for round trips.';
    } else if (!isValidDateFormat(data.returnDate)) {
      errors.returnDate = 'Invalid return date format.';
    } else if (data.departureDate && data.returnDate < data.departureDate) {
      errors.returnDate = 'Return date cannot be earlier than departure date.';
    }
  }

  // 5. Travelers
  const travelersNum = Number(data.travelers);
  if (!travelersNum || isNaN(travelersNum) || travelersNum < 1 || travelersNum > 9) {
    errors.travelers = 'Traveler count must be between 1 and 9.';
  }

  // 6. Points Balance (if provided and not skipped)
  if (!data.skipPoints && data.pointsBalance !== undefined && data.pointsBalance !== '') {
    const pointsNum = Number(data.pointsBalance);
    if (isNaN(pointsNum) || pointsNum < 0) {
      errors.pointsBalance = 'Points balance cannot be negative.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates Full Trip Plan / Multi-Stop itinerary
 * 
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Record<string, string>, legErrors: Array<Record<string, string>> }}
 */
export function validateFullTrip(data) {
  const errors = {};
  const legErrors = [];

  const legs = Array.isArray(data.legs) ? data.legs : [];

  if (legs.length < 2) {
    errors.general = 'Multi-stop trips must contain at least 2 legs.';
  }

  // Validate each leg
  let previousDate = null;

  legs.forEach((leg, idx) => {
    const currentLegErrors = {};

    if (!leg.origin || !leg.origin.trim()) {
      currentLegErrors.origin = `Leg ${idx + 1}: Origin is required.`;
    }

    if (!leg.destination || !leg.destination.trim()) {
      currentLegErrors.destination = `Leg ${idx + 1}: Destination is required.`;
    } else if (leg.origin && leg.origin.trim().toUpperCase() === leg.destination.trim().toUpperCase()) {
      currentLegErrors.destination = `Leg ${idx + 1}: Origin and destination cannot be identical.`;
    }

    if (!leg.date) {
      currentLegErrors.date = `Leg ${idx + 1}: Flight date is required.`;
    } else if (!isValidDateFormat(leg.date)) {
      currentLegErrors.date = `Leg ${idx + 1}: Invalid date format.`;
    } else if (isDateInPast(leg.date)) {
      currentLegErrors.date = `Leg ${idx + 1}: Date cannot be in the past.`;
    } else if (previousDate && leg.date < previousDate) {
      currentLegErrors.date = `Leg ${idx + 1}: Date must be on or after Leg ${idx}'s date.`;
    }

    if (leg.date && isValidDateFormat(leg.date)) {
      previousDate = leg.date;
    }

    legErrors.push(currentLegErrors);
  });

  const hasLegErrors = legErrors.some((le) => Object.keys(le).length > 0);

  // Travelers
  const travelersNum = Number(data.travelers);
  if (!travelersNum || isNaN(travelersNum) || travelersNum < 1 || travelersNum > 9) {
    errors.travelers = 'Traveler count must be between 1 and 9.';
  }

  // Points Balance
  if (!data.skipPoints && data.pointsBalance !== undefined && data.pointsBalance !== '') {
    const pointsNum = Number(data.pointsBalance);
    if (isNaN(pointsNum) || pointsNum < 0) {
      errors.pointsBalance = 'Points balance cannot be negative.';
    }
  }

  const isValid = Object.keys(errors).length === 0 && !hasLegErrors;

  return {
    isValid,
    errors,
    legErrors,
  };
}
