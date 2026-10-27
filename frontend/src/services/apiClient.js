import { buildApiUrl } from './apiConfig';

/**
 * Unified API Client with Bearer token authentication support
 */
export async function apiRequest(endpoint, options = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('a_una_milla_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = buildApiUrl(endpoint);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}
