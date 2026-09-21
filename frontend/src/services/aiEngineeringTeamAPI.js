import { api } from './apiClient';

/** AI Engineering Design Team API — /api/v1/ai-engineering-team/* */
export const aiEngineeringTeamAPI = {
  getCapabilities: () => api.get('/ai-engineering-team/capabilities'),
  buildPlan: (payload) => api.post('/ai-engineering-team/plan', payload),
  generateBrief: (payload) => api.post('/ai-engineering-team/brief', payload),
};

export default aiEngineeringTeamAPI;
