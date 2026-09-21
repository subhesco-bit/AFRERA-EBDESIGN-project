import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const api = axios.create({ baseURL: API_BASE_URL, timeout: 30000, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const commercialFlowAPI = {
  recordInventory: (data) => api.post('/commercial-reconciliation/inventory', data),
  recordAccounting: (data) => api.post('/commercial-reconciliation/accounting', data),
  reconcileOrder: (orderId) => api.post(`/commercial-reconciliation/orders/${orderId}/reconcile`),
  createShipment: (data) => api.post('/fulfillment-orchestration/shipments', data),
  getShipment: (id) => api.get(`/fulfillment-orchestration/shipments/${id}`),
  allocateShipment: (id, allocations) => api.post(`/fulfillment-orchestration/shipments/${id}/allocate`, { allocations }),
  transitionShipment: (id, toStatus, notes) => api.post(`/fulfillment-orchestration/shipments/${id}/transition`, { toStatus, notes }),
};

export default commercialFlowAPI;
