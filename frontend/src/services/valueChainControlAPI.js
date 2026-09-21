import { api } from './apiClient';

const BASE = '/value-chain-control';

export const valueChainControlAPI = {
  getCapabilities: () => api.get(`${BASE}/capabilities`),
  listCases: (params) => api.get(`${BASE}/cases`, { params }),
  createCase: (payload) => api.post(`${BASE}/cases`, payload),
  composeCase: (caseId, payload = {}) => api.post(`${BASE}/cases/${caseId}/compose`, payload),
  listCalculations: () => api.get(`${BASE}/calculations`),
  runCalculation: (payload) => api.post(`${BASE}/calculations/run`, payload),
  buildWaterfall: (payload) => api.post(`${BASE}/price-waterfall`, payload),
  projectMassBalance: (payload) => api.post(`${BASE}/mass-balance/project`, payload),
  evaluateGate: (caseId, gateCode, requirements) => api.post(`${BASE}/cases/${caseId}/gates/${gateCode}/evaluate`, { requirements }),
};

export default valueChainControlAPI;
