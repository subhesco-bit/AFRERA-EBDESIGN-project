// Component-facing adapter. API ownership remains in services/api.js.
import api from './api';
export { default } from './api';
export * from './api';

// api.js's baseURL includes /api/v1, but several routes below (landrecords)
// are mounted unversioned on the Express app - same UNVERSIONED_BASE pattern
// used throughout api.js itself.
const UNVERSIONED_BASE = api.defaults.baseURL.replace(/\/api\/v1\/?$/, '');

const notImplemented = feature => () => Promise.reject(new Error(`${feature} has no backend implementation yet - not fabricating a response.`));

// ModuleOperationPanel.jsx documents this as /api/v1/backend-modules/:moduleId/:operation
// via backend/src/routes/claude/backendModuleBridge.js, but that file is an
// unfilled "Route operational" scaffold (only a /health check) and is never
// mounted anywhere in backend/src/index.js - verified directly, the comment
// in the component is stale/aspirational.
export const moduleAPI = {
  getOperations: notImplemented('Module operation introspection'),
  execute: notImplemented('Generic module operation execution'),
};

// FarmerPortal/LandRecords.jsx's calls are the exact same shape as the real,
// verified landRecordsAPI in api.js (same /api/landrecords backend, same
// {data:{records,totals}} / {data:{syncedCount}} response bodies).
export const farmerPortalAPI = {
  getLandRecords: () => api.get(`${UNVERSIONED_BASE}/api/landrecords`),
  addLandRecord: data => api.post(`${UNVERSIONED_BASE}/api/landrecords`, data),
  syncGovernmentLandRecords: () => api.post(`${UNVERSIONED_BASE}/api/landrecords/sync-government`),
};

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
