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

// Generic bridge for backend/src/modules/M0XX plain-function modules - see
// backend/src/routes/claude/backendModuleBridge.js for the real contract.
export const moduleAPI = {
  getOperations: (moduleId) => api.get(`/backend-modules/${moduleId}`),
  execute: (moduleId, operation, id, payload) => (
    id !== undefined
      ? api.post(`/backend-modules/${moduleId}/${operation}/${id}`, payload)
      : api.post(`/backend-modules/${moduleId}/${operation}`, payload)
  ),
};

// backend/src/services/legacy/custodyEventRoutes.js (mounted at /api/v1/custody
// via setupRoutes in index.js).
export const custodyAPI = {
  getChain: (shipmentId) => api.get(`/custody/chain/${shipmentId}`),
};

// backend/src/routes/landRecordsRoutes.js (mounted at /api/landrecords).
export const farmerPortalAPI = {
  getLandRecords: () => api.get('/landrecords'),
  addLandRecord: (data) => api.post('/landrecords', data),
  syncGovernmentLandRecords: () => api.post('/landrecords/sync-government'),
};

// NOTE: backend has two divergent, unreconciled IoT integration services
// (services/iotIntegrationService.js, mounted at /api/iotintegration, and
// services/logistics/iotIntegrationService.js, which is not mounted at all)
// with neither exposing this exact method set. This is a best-effort stub
// pending manual reconciliation of the two services - see PR notes.
export const iotAPI = {
  getDevices: () => api.get('/iot/devices'),
  getUnacknowledgedAlerts: () => api.get('/iot/alerts/unacknowledged'),
  getSensorData: (deviceId) => api.get(`/iot/sensor-data/${deviceId}`),
};
