/**
 * API configuration for A Una Milla
 */

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const API_CONFIG = {
  // Normalize base URL (strip trailing slash; empty string means relative proxy)
  baseUrl: RAW_API_BASE_URL.replace(/\/+$/, ''),
  
  // Timeout in milliseconds for flight search requests
  requestTimeoutMs: 10000,

  // Mode flag: by default, connect to live backend
  isLiveApiEnabled: true,

  // Default endpoints
  endpoints: {
    flightSearch: '/api/v1/flights/search',
    awardSearch: '/api/v1/flights/award-search',
    savingsCalculation: '/api/v1/savings/calculate',
    airportsAutocomplete: '/api/v1/airports',
    advisorAnalyze: '/api/v1/advisor/analyze',
    health: '/api/v1/health',
  },
};

/**
 * Validates configuration and logs non-sensitive diagnostics
 */
export function getApiEnvironmentStatus() {
  return {
    isLive: API_CONFIG.isLiveApiEnabled,
    baseUrl: API_CONFIG.baseUrl || 'Local Proxy (/api)',
    timeoutMs: API_CONFIG.requestTimeoutMs,
  };
}
