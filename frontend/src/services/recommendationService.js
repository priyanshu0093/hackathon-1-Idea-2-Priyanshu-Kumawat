import { API_CONFIG } from './apiConfig';

function getAuthHeader() {
  const token = localStorage.getItem('a_una_milla_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 1. Best Time to Book: Evaluate target price, historical snapshots & heuristics
 */
export async function getBestTimeToBook(payload) {
  const res = await fetch(`${API_CONFIG.baseUrl}/api/v1/recommendations/best-time-to-book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to analyze best time to book.');
  }

  const json = await res.json();
  return json.data;
}

/**
 * 1. Fare Snapshot: Save target price and current fare snapshot
 */
export async function saveFareSnapshot(payload) {
  const res = await fetch(`${API_CONFIG.baseUrl}/api/v1/recommendations/fare-snapshots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to save fare snapshot.');
  }

  const json = await res.json();
  return json.data;
}

/**
 * 2. Best Card & Rewards Recommendation: Analyzes authenticated user's wallet against flight
 */
export async function getBestCardAndRewards(flightContext) {
  const res = await fetch(`${API_CONFIG.baseUrl}/api/v1/recommendations/best-card-rewards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(flightContext),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to evaluate card & rewards recommendation.');
  }

  const json = await res.json();
  return json.data;
}

/**
 * 3. Smart Trip Savings Plan: Genuine flight search, budget comparison, and accumulation timeline
 */
export async function getSmartTripSavingsPlan(planInput) {
  const res = await fetch(`${API_CONFIG.baseUrl}/api/v1/recommendations/trip-savings-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(planInput),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to generate smart trip savings plan.');
  }

  const json = await res.json();
  return json.data;
}
