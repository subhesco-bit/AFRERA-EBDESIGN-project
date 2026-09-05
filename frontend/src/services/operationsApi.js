import { api } from './apiClient';

export const financialAPI = {
  getOverview: (timeRange) => api.get('/financial/overview', { params: { timeRange } }),
  getLoans: (params) => api.get('/financial/loans', { params }),
  applyForLoan: (data) => api.post('/financial/loans', data),
  getFarmerLoans: (farmerId, filters) => api.get(`/financial/loans/farmer/${farmerId}`, { params: filters }),
  approveLoan: (id, data) => api.post(`/financial/loans/${id}/approve`, data),
  getEMISchedule: (id) => api.get(`/financial/loans/${id}/emi`),
  payEMI: (id, data) => api.post(`/financial/emi/${id}/pay`, data),
  requestAdvance: (data) => api.post('/financial/advances', data),
  getFarmerAdvances: (farmerId) => api.get(`/financial/advances/farmer/${farmerId}`),
  getCreditScore: (farmerId) => api.get(`/financial/credit-score/${farmerId}`),
};

export const logisticsAPI = {
  createShipment: (data) => api.post('/logistics/shipments', data),
  getShipment: (id) => api.get(`/logistics/shipments/${id}`),
  getShipments: (filters, pagination) => api.get('/logistics/shipments', { params: { ...filters, ...pagination } }),
  updateShipmentStatus: (id, data) => api.put(`/logistics/shipments/${id}/status`, data),
  addTrackingUpdate: (id, data) => api.post(`/logistics/shipments/${id}/tracking`, data),
  getShipmentTracking: (id) => api.get(`/logistics/shipments/${id}/tracking`),
  registerVehicle: (data) => api.post('/logistics/vehicles', data),
  getVehicles: (filters) => api.get('/logistics/vehicles', { params: filters }),
  registerDriver: (data) => api.post('/logistics/drivers', data),
  getDrivers: (filters) => api.get('/logistics/drivers', { params: filters }),
  getShipmentModes: () => api.get('/logistics/modes'),
  getLiveTracking: (shipmentId) => api.get(`/logistics/shipments/${shipmentId}/live-tracking`),
  getTemperatureData: (shipmentId) => api.get(`/logistics/shipments/${shipmentId}/temperature`),
  getTemperatureAlerts: (shipmentId) => api.get(`/logistics/shipments/${shipmentId}/temperature-alerts`),
};

export const insuranceAPI = {
  createPolicy: (data) => api.post('/insurance/policies', data),
  getPolicy: (id) => api.get(`/insurance/policies/${id}`),
  getPolicies: (filters, pagination) => api.get('/insurance/policies', { params: { ...filters, ...pagination } }),
  submitClaim: (data) => api.post('/insurance/claims', data),
  getClaim: (id) => api.get(`/insurance/claims/${id}`),
  getClaims: (filters, pagination) => api.get('/insurance/claims', { params: { ...filters, ...pagination } }),
  processClaim: (id, data) => api.put(`/insurance/claims/${id}/process`, data),
  createMasterPolicy: (data) => api.post('/insurance/master-policies', data),
  getMasterPolicies: (filters) => api.get('/insurance/master-policies', { params: filters }),
  getInsuranceProducts: (filters) => api.get('/insurance/products', { params: filters }),
  calculatePremium: (data) => api.post('/insurance/calculate-premium', data),
  calculatePremiumByType: (type, data) => api.post(`/insurance/calculate/${type}`, data),
  generateQuote: (data) => api.post('/insurance/quotes', data),
};
