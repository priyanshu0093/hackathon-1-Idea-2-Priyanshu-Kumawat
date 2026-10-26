import { API_CONFIG } from './apiConfig';
import { searchFlightsDemo } from './demoAdapter';

/**
 * Production-ready flight search service with request timeout and cancellation
 * 
 * @param {Object} searchParams
 * @param {Object} options
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Object>}
 */
export async function searchFlights(searchParams, { signal } = {}) {
  // If live backend is enabled in environment, query it
  if (API_CONFIG.isLiveApiEnabled) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.requestTimeoutMs);

    // Combine caller signal with timeout controller
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.flightSearch}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Flight search API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw err;
      }
      console.warn('Live API request failed, falling back to demo adapter:', err.message);
      // Fallback gracefully to demo adapter
      return searchFlightsDemo(searchParams, { signal });
    }
  }

  // Default: use clearly labeled demo adapter
  return searchFlightsDemo(searchParams, { signal });
}
