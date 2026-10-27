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
