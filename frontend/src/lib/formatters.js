/**
 * Formatting helpers for currency, points, and travel dates
 */

export function formatEuro(amount) {
  if (amount === null || amount === undefined) return '€0';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPoints(points) {
  if (!points) return '0 pts';
  return new Intl.NumberFormat('en-US').format(points) + ' pts';
}

export function formatFlightDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatPercentage(val) {
  return `${Math.round(val)}%`;
}
