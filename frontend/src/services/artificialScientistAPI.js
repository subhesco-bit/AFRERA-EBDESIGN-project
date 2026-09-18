import { api } from './api';

const base = '/artificial-scientist';

export const artificialScientistAPI = {
  createHypothesis: (data) => api.post(`${base}/hypotheses`, data),
  getHypothesis: (id) => api.get(`${base}/hypotheses/${id}`),
  reviewHypothesis: (id, data) => api.post(`${base}/hypotheses/${id}/review`, data),
  createExperiment: (data) => api.post(`${base}/experiments`, data),
  getExperiment: (id) => api.get(`${base}/experiments/${id}`),
  reviseProtocol: (id, protocol) => api.post(`${base}/experiments/${id}/protocols`, { protocol }),
  reviewProtocol: (id, data) => api.post(`${base}/protocols/${id}/review`, data),
  transitionExperiment: (id, state) => api.post(`${base}/experiments/${id}/transition`, { state }),
  createRun: (id, data) => api.post(`${base}/experiments/${id}/runs`, data),
  getRun: (id) => api.get(`${base}/runs/${id}`),
  transitionRun: (id, data) => api.post(`${base}/runs/${id}/transition`, data),
  registerArtifact: (data) => api.post(`${base}/artifacts`, data),
  reviewEntity: (entityType, id, data) => api.post(`${base}/${entityType}/${id}/reviews`, data),
  requestAssistance: (data) => api.post(`${base}/ai-assistance`, data),
};

export default artificialScientistAPI;
