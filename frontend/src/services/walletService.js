import { apiRequest } from './apiClient';

export async function fetchWallet() {
  const res = await apiRequest('/api/v1/wallet');
  return res.data;
}

export async function saveWalletBalance(balanceData) {
  const res = await apiRequest('/api/v1/wallet', {
    method: 'POST',
    body: JSON.stringify(balanceData),
  });
  return res.data;
}

export async function removeWalletBalance(balanceId) {
  const res = await apiRequest(`/api/v1/wallet/${balanceId}`, {
    method: 'DELETE',
  });
  return res.data;
}
