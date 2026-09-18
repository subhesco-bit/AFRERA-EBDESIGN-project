import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const nutritionCommerceIntelligenceAPI = {
  health: () => api.get('/nutritionCommerceIntelligence/health'),
  productValue: (data) => api.post('/nutritionCommerceIntelligence/product-value', data),
  householdBasket: (items) => api.post('/nutritionCommerceIntelligence/basket', { items }),
  normalizeMarketOffer: (data) => api.post('/nutritionCommerceIntelligence/market-offer/normalize', data),
};

export default nutritionCommerceIntelligenceAPI;
