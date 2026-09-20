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

// LIVE BUG FIX: components/Logistics/CustodyChainViewer.jsx imports
// `custodyAPI` from this file, but it never existed here - the import
// silently resolved to undefined, so calling custodyAPI.getChain() at
// render time threw "Cannot read properties of undefined". The real,
// hash-chained backend/src/services/legacy/custodyEventService.js is now
// rescued via backend/src/routes/ORPHANED_SERVICES_MOUNT.js (registered
// through custodyEventRoutes.js). Note: CustodyChainViewer.jsx itself is not
// currently rendered by any page - this only fixes it for whenever it is.
const ORPHANED_BASE = `${UNVERSIONED_BASE}/api/orphaned_services_mount`;
export const custodyAPI = {
  getChain: (shipmentId, verify) => api.get(`${ORPHANED_BASE}/api/v1/custody/chain/${shipmentId}`, verify !== undefined ? { params: { verify } } : undefined),
  appendEvent: data => api.post(`${ORPHANED_BASE}/api/v1/custody/events`, data),
  issueSettlementInstruction: data => api.post(`${ORPHANED_BASE}/api/v1/custody/settlement/instructions`, data),
  confirmSettlement: instructionId => api.post(`${ORPHANED_BASE}/api/v1/custody/settlement/${instructionId}/confirm`),
  getSettlement: instructionId => api.get(`${ORPHANED_BASE}/api/v1/custody/settlement/${instructionId}`),
  getStateMachine: () => api.get(`${ORPHANED_BASE}/api/v1/custody/state-machine`),
};
