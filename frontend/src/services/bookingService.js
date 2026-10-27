import { apiRequest } from './apiClient';

export async function fetchExternalBookings() {
  const res = await apiRequest('/api/v1/bookings');
  return res.data;
}

export async function recordExternalBooking(bookingData) {
  const res = await apiRequest('/api/v1/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
  return res.data;
}

export async function removeExternalBooking(bookingId) {
  const res = await apiRequest(`/api/v1/bookings/${bookingId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function redeemDemoPoints(payload) {
  const res = await apiRequest('/api/v1/bookings/redeem-points', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function revalidateDuffelOffer(offerId) {
  const res = await apiRequest(`/api/v1/bookings/duffel/offers/${offerId}`);
  return res.data;
}

export async function bookDuffelFlight(payload) {
  const res = await apiRequest('/api/v1/bookings/duffel/book', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}
