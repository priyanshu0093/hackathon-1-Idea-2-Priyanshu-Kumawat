/**
 * API configuration and runtime environment validation for A Una Milla
 */

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const API_CONFIG = {
  // Normalize base URL (strip trailing slash)
  baseUrl: RAW_API_BASE_URL.replace(/\/+$/, ''),
  
  // Timeout in milliseconds for flight search requests
  requestTimeoutMs: 8000,

  // Mode flag: whether the frontend is connected to a live backend or running in demo adapter mode
  isLiveApiEnabled: Boolean(RAW_API_BASE_URL && RAW_API_BASE_URL.trim().length > 0),

  // Default endpoints
  endpoints: {
    flightSearch: '/api/v1/flights/search',
    savingsCalculation: '/api/v1/savings/calculate',
    airportsAutocomplete: '/api/v1/airports',
  },
};

/**
 * Validates configuration and logs non-sensitive diagnostics
 */
export function getApiEnvironmentStatus() {
  return {
    isLive: API_CONFIG.isLiveApiEnabled,
    adapter: API_CONFIG.isLiveApiEnabled ? 'Express Backend' : 'Demo Adapter (Phase 2)',
    timeoutMs: API_CONFIG.requestTimeoutMs,
  };
}
