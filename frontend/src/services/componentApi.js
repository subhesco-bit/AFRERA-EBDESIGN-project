// Component-facing adapter. API ownership remains in services/api.js.
import api from './api';
export { default } from './api';
export * from './api';

// Additional component-specific API exports
export const multilingualAPI = {
  getTranslations: (lang) => api.get(`/i18n/${lang}`),
  updateTranslations: (lang, data) => api.put(`/i18n/${lang}`, data),
  // Added 2026-09-20 (frontend component-to-API-client audit) - called by
  // MultilingualProvider.jsx and AutoTranslate.jsx but never existed.
  getLanguages: () => api.get('/i18n/languages'),
  getPreferences: () => api.get('/i18n/preferences'),
  updatePreferences: (data) => api.put('/i18n/preferences', data),
  getContent: (key, lang) => api.get(`/i18n/content/${key}`, { params: { lang } }),
  translate: (text, targetLang) => api.post('/i18n/translate', { text, targetLang }),
  detect: (text) => api.post('/i18n/detect', { text }),
};

export const conversationalAIAPI = {
  sendMessage: (message) => api.post('/ai/conversational/send', { message }),
  getConversationHistory: () => api.get('/ai/conversational/history'),
  // Added 2026-09-20 (frontend component-to-API-client audit) - called by
  // ChatInterface.jsx but never existed.
  getDomains: () => api.get('/ai/conversational/domains'),
  createSession: (data) => api.post('/ai/conversational/sessions', data),
  respond: (sessionId, message) => api.post(`/ai/conversational/sessions/${sessionId}/respond`, { message }),
  endSession: (sessionId) => api.post(`/ai/conversational/sessions/${sessionId}/end`),
};

export const voiceAIAPI = {
  transcribeAudio: (audio) => api.post('/ai/voice/transcribe', { audio }),
  generateSpeech: (text) => api.post('/ai/voice/speak', { text }),
  // Added 2026-09-20 (frontend component-to-API-client audit) - called by
  // VoiceAssistant.jsx but never existed.
  createSession: (data) => api.post('/ai/voice/sessions', data),
  getPreferences: () => api.get('/ai/voice/preferences'),
  sendCommand: (sessionId, command) => api.post(`/ai/voice/sessions/${sessionId}/command`, { command }),
  endSession: (sessionId) => api.post(`/ai/voice/sessions/${sessionId}/end`),
};

// The 4 exports below were missing entirely (broke the production build).
// Generated 2026-09-20 by checking real call sites for actual method names used.
export const farmerPortalAPI = {
  getLandRecords: () => api.get('/farmer-portal/land-records'),
  addLandRecord: (record) => api.post('/farmer-portal/land-records', record),
  syncGovernmentLandRecords: () => api.post('/farmer-portal/land-records/sync-government'),
};

export const iotAPI = {
  getDevices: () => api.get('/iot/devices'),
  getUnacknowledgedAlerts: () => api.get('/iot/alerts/unacknowledged'),
  getSensorData: (deviceId) => api.get(`/iot/devices/${deviceId}/sensor-data`),
};

export const custodyAPI = {
  getChain: (shipmentId) => api.get(`/custody/chain/${shipmentId}`),
};

export const moduleAPI = {
  getOperations: (moduleId) => api.get(`/modules/${moduleId}/operations`),
  execute: (moduleId, operation, _unused, payload) => api.post(`/modules/${moduleId}/operations/${operation}`, payload),
};
