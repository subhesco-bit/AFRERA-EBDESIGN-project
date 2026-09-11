import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const commercialSettlementAPI = {
  create: (data) => api.post('/commercial-settlements', data),
  get: (id) => api.get(`/commercial-settlements/${id}`),
  transition: (id, toStatus, reason) => api.post(`/commercial-settlements/${id}/transition`, { toStatus, reason }),
  paymentAttempt: (id, data) => api.post(`/commercial-settlements/${id}/payment-attempts`, data)
};

export default commercialSettlementAPI;
