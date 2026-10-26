import { API_CONFIG } from './apiConfig';

/**
 * Service to request Travel Hacking Advisor recommendations from the backend
 *
 * @param {Object} payload - Current search flight context + optional question
 * @param {Object} options - { signal: AbortSignal }
 * @returns {Promise<Object>} Advisor analysis response
 */
export async function analyzeTripAdvice(payload, { signal } = {}) {
  const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.advisorAnalyze}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch {
        // Non-JSON response
      }

      if (errorBody.code === 'VALIDATION_ERROR' && errorBody.errors) {
        const firstErrorKey = Object.keys(errorBody.errors)[0];
        const firstErrorMsg = errorBody.errors[firstErrorKey]?.[0] || errorBody.message;
        throw new Error(`Validation Error (${firstErrorKey}): ${firstErrorMsg}`);
      }

      throw new Error(
        errorBody.message || `Advisor service request failed with HTTP ${response.status}`
      );
    }

    const data = await response.json();
    return data.data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    // Network or server error
    throw new Error(err.message || 'Unable to connect to Travel Hacking Advisor service.');
  }
}
