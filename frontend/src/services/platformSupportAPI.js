import { api } from './apiClient';

/** Platform Support Orchestrator — /api/v1/platform-support/* */
export const platformSupportAPI = {
  getCapabilities: () => api.get('/platform-support/capabilities'),
  getDesk: (payload) => api.post('/platform-support/desk', payload),
  execute: (payload) => api.post('/platform-support/execute', payload),
};

export default platformSupportAPI;
