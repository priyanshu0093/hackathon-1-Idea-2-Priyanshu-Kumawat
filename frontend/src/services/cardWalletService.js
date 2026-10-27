import { apiRequest } from './apiClient';

export async function fetchCardCatalog() {
  const res = await apiRequest('/api/v1/cards/catalog');
  return res.data;
}

export async function fetchUserCards() {
  const res = await apiRequest('/api/v1/cards');
  return res.data;
}

export async function addCardToWallet(payload) {
  const res = await apiRequest('/api/v1/cards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateCardInWallet(cardId, updates) {
  const res = await apiRequest(`/api/v1/cards/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return res.data;
}

export async function removeCardFromWallet(cardId) {
  const res = await apiRequest(`/api/v1/cards/${cardId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function fetchCardForecast() {
  const res = await apiRequest('/api/v1/cards/forecast');
  return res.data;
}

export async function syncCardsToWallet() {
  const res = await apiRequest('/api/v1/cards/sync-wallet', {
    method: 'POST',
  });
  return res.data;
}
