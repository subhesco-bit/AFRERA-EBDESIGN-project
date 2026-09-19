// Component-facing adapter. API ownership remains in services/api.js.
import api from './api';
export { default } from './api';
export * from './api';

// Additional component-specific API exports
export const multilingualAPI = {
  getTranslations: (lang) => api.get(`/i18n/${lang}`),
  updateTranslations: (lang, data) => api.put(`/i18n/${lang}`, data),
};

export const conversationalAIAPI = {
  sendMessage: (message) => api.post('/ai/conversational/send', { message }),
  getConversationHistory: () => api.get('/ai/conversational/history'),
};

export const voiceAIAPI = {
  transcribeAudio: (audio) => api.post('/ai/voice/transcribe', { audio }),
  generateSpeech: (text) => api.post('/ai/voice/speak', { text }),
};

export const farmerPortalAPI = {
  getLandRecords: (params) => api.get('/farmer-portal/land-records', { params }),
  addLandRecord: (data) => api.post('/farmer-portal/land-records', data),
  syncGovernmentLandRecords: (data) => api.post('/farmer-portal/land-records/sync', data),
};

export const iotAPI = {
  getDevices: (params) => api.get('/iot/devices', { params }),
  getSensorData: (params) => api.get('/iot/sensor-data', { params }),
  getUnacknowledgedAlerts: (params) => api.get('/iot/alerts/unacknowledged', { params }),
};

export const custodyAPI = {
  getChain: (params) => api.get('/custody/chain', { params }),
};

export const moduleAPI = {
  getOperations: (params) => api.get('/modules/operations', { params }),
  execute: (data) => api.post('/modules/execute', data),
};
