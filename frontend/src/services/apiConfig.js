/**
 * API configuration for A Una Milla
 */

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();

// Normalize base URL: strip trailing slash and any trailing /api/v1
// Ensures baseUrl is always the clean server origin without duplicating /api/v1
const NORMALIZED_BASE_URL = RAW_API_BASE_URL
  .replace(/\/+$/, '')
  .replace(/\/api\/v1\/?$/, '');

export const API_CONFIG = {
  // Normalize base URL (strip trailing slash; empty string means relative proxy)
  baseUrl: NORMALIZED_BASE_URL,
  
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
    authLogin: '/api/v1/auth/login',
    authSignup: '/api/v1/auth/signup',
    authMe: '/api/v1/auth/me',
    authLogout: '/api/v1/auth/logout',
  },
};

/**
 * Builds a normalized, absolute or proxy-relative API URL
 * Prevents duplicate /api/v1 segments regardless of whether VITE_API_BASE_URL
 * contains /api/v1 or is just the origin.
 *
 * @param {string} endpoint - Path like '/api/v1/auth/login' or '/auth/login'
 * @returns {string} Fully resolved API URL
 */
export function buildApiUrl(endpoint) {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const cleanBase = (API_CONFIG.baseUrl || '').trim().replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
  const pathWithSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Ensure path starts with /api/v1
  const normalizedPath = pathWithSlash.startsWith('/api/v1/') || pathWithSlash === '/api/v1'
    ? pathWithSlash
    : `/api/v1${pathWithSlash}`;

  return cleanBase ? `${cleanBase}${normalizedPath}` : normalizedPath;
}

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
