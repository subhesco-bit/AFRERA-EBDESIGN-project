import { api } from './apiClient';

/** Farmer Support Clinic API — /api/v1/farmer-support-clinic/* */
export const farmerSupportClinicAPI = {
  getCapabilities: () => api.get('/farmer-support-clinic/capabilities'),
  getTriage: (species, packId) => api.post('/farmer-support-clinic/triage', { species, packId }),
  consult: (payload) => api.post('/farmer-support-clinic/consult', payload),
  getSession: (sessionId) => api.get(`/farmer-support-clinic/session/${sessionId}`),
  analyzeVision: (payload) => api.post('/farmer-support-clinic/vision', payload),
};

export default farmerSupportClinicAPI;
