import { apiRequest } from './apiClient';

export async function fetchPersistedTrips() {
  try {
    const res = await apiRequest('/api/v1/trips');
    return res?.data || [];
  } catch {
    return [];
  }
}

export async function persistTrip(trip) {
  try {
    const payload = {
      id: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      cabin: trip.cabin || 'economy',
      departureDate: trip.departureDate || null,
      returnDate: trip.returnDate || null,
      carrier: trip.carrier || null,
      cashPrice: trip.cashPrice || trip.cashFare?.totalCashEur || null,
      pointsCost: trip.pointsCost || trip.metrics?.totalPoints || null,
      taxes: trip.taxes || trip.awardFlight?.taxesAndFeesEur || null,
      program: trip.program || null,
      estimatedSavings: trip.estimatedSavings || trip.metrics?.savingsEuro || null,
      dataSource: trip.dataSource || 'benchmark',
      metadata: {
        originCity: trip.originCity,
        destinationCity: trip.destinationCity,
      },
    };

    const res = await apiRequest('/api/v1/trips', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data;
  } catch {
    return null;
  }
}

export async function deletePersistedTrip(tripId) {
  try {
    await apiRequest(`/api/v1/trips/${tripId}`, {
      method: 'DELETE',
    });
    return true;
  } catch {
    return false;
  }
}
