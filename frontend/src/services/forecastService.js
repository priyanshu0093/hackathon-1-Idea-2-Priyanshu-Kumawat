import { apiRequest } from './apiClient';

export async function calculateForecast(params) {
  const res = await apiRequest('/api/v1/forecast/calculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return res.data;
}

export async function saveForecast(params) {
  const res = await apiRequest('/api/v1/forecast/save', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return res.data;
}

export async function getSavedForecast() {
  const res = await apiRequest('/api/v1/forecast/saved');
  return res.data;
}
