import { apiRequest } from './apiClient';

/**
 * Calls backend Smart Savings Engine for verified comparison calculation
 */
export async function calculateSmartSavingsApi(params) {
  const response = await apiRequest('/api/v1/savings/smart-calculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response.data;
}

/**
 * Persists a redemption plan for the authenticated user
 */
export async function saveRedemptionPlanApi(payload) {
  const response = await apiRequest('/api/v1/savings/redemptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}

/**
 * Fetches all saved redemption plans for the authenticated user
 */
export async function fetchRedemptionPlansApi() {
  const response = await apiRequest('/api/v1/savings/redemptions');
  return response.data || [];
}

/**
 * Deletes a redemption plan by ID
 */
export async function deleteRedemptionPlanApi(planId) {
  const response = await apiRequest(`/api/v1/savings/redemptions/${planId}`, {
    method: 'DELETE',
  });
  return response.data;
}
