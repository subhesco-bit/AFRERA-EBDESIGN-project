import { api } from './apiClient';

/** Farmer Support Clinic API — /api/v1/farmer-support-clinic/* */
export const farmerSupportClinicAPI = {
  getCapabilities: () => api.get('/farmer-support-clinic/capabilities'),
  getTriage: (species) => api.post('/farmer-support-clinic/triage', { species }),
  consult: (payload) => api.post('/farmer-support-clinic/consult', payload),
};

export default farmerSupportClinicAPI;
