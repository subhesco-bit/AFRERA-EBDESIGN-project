import { api } from './apiClient';

/**
 * MEP Design Studio API client — /api/v1/mep-design/*
 */
export const mepDesignAPI = {
  getCapabilities: () => api.get('/mep-design/capabilities'),

  buildPlan: (payload) => api.post('/mep-design/plan', payload),

  generateBrief: (payload) => api.post('/mep-design/brief', payload),
};

export default mepDesignAPI;
