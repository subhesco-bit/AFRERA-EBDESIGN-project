// Component-facing adapter. API ownership remains in services/api.js.
import api from './api';
import config from '../config/env';

export { default } from './api';
export * from './api';

// api's baseURL is config.API_URL (".../api/v1"), but the real backend
// mounts this router unversioned at /api/multilingual (see
// backend/src/index.js), same as most non-/api/v1 routes - matches the
// AUTH_BASE pattern already established in coreApi.js.
const MULTILINGUAL_BASE = `${config.API_URL.replace(/\/api\/v1\/?$/, '')}/api/multilingual`;

// 2026-09-15: every method here used to reference an undefined `api`
// (never imported in this file - a guaranteed ReferenceError the moment
// any of them ran) and called endpoints (/i18n/:lang) that don't exist
// on the backend under any mount. components/Multilingual/MultilingualProvider.jsx
// actually calls getLanguages/getPreferences/getContent/updatePreferences/
// translate/detect - none of which existed here. Rewritten against the
// real, previously-unmounted services/legacy/multilingualService.js router
// (now mounted at /api/multilingual in index.js), matching its real
// endpoints and request/response shapes exactly.
export const multilingualAPI = {
  getLanguages: () => api.get(`${MULTILINGUAL_BASE}/languages`),
  getPreferences: () => api.get(`${MULTILINGUAL_BASE}/preferences`),
  getContent: (languageCode) => api.get(`${MULTILINGUAL_BASE}/content`, { params: { language: languageCode } }),
  updatePreferences: (data) => api.put(`${MULTILINGUAL_BASE}/preferences`, data),
  translate: (data) => api.post(`${MULTILINGUAL_BASE}/translate`, data),
  detect: (text) => api.post(`${MULTILINGUAL_BASE}/detect`, { text }),
};

// 2026-09-15: components/Layout.jsx already documented that ChatInterface.jsx
// and VoiceAssistant.jsx were "fully built (real conversational-ai/voice-ai
// API calls) but had no parent page rendering them" - true on both ends:
// their real callers (getDomains/createSession/respond/endSession and
// createSession/getPreferences/sendCommand/endSession) didn't match what
// used to be here (sendMessage/getConversationHistory,
// transcribeAudio/generateSpeech - both also had the undefined-`api` bug),
// AND the real backends (services/legacy/conversationalAIService.js,
// services/legacy/voiceAIService.js) were never mounted at all. Backend
// now mounted at /api/conversational-ai and /api/voice-ai (index.js);
// rewritten here to match both real callers and real endpoints exactly.
const CONVERSATIONAL_AI_BASE = `${config.API_URL.replace(/\/api\/v1\/?$/, '')}/api/conversational-ai`;
const VOICE_AI_BASE = `${config.API_URL.replace(/\/api\/v1\/?$/, '')}/api/voice-ai`;

export const conversationalAIAPI = {
  getDomains: () => api.get(`${CONVERSATIONAL_AI_BASE}/domains`),
  createSession: (data) => api.post(`${CONVERSATIONAL_AI_BASE}/sessions`, data),
  respond: (sessionId, message, context) =>
    api.post(`${CONVERSATIONAL_AI_BASE}/sessions/${sessionId}/respond`, { message, context }),
  endSession: (sessionId, data) => api.post(`${CONVERSATIONAL_AI_BASE}/sessions/${sessionId}/end`, data),
};

export const voiceAIAPI = {
  createSession: (language) => api.post(`${VOICE_AI_BASE}/voice-sessions`, { language }),
  getPreferences: () => api.get(`${VOICE_AI_BASE}/voice-preferences`),
  sendCommand: (data) => api.post(`${VOICE_AI_BASE}/voice-commands`, data),
  endSession: (sessionId) => api.post(`${VOICE_AI_BASE}/voice-sessions/${sessionId}/end`),
};

// 2026-09-16: components/FarmerPortal/LandRecords.jsx's getLandRecords/
// addLandRecord/syncGovernmentLandRecords calls had no client at all
// (MISSING_EXPORT build error). services/legacy/landRecordsService.js
// (real, land_records-table-backed) already had a real router
// (routes/landRecordsRoutes.js, mounted at /api/landrecords in index.js
// since 2026-08-29) matching all 3 calls and their exact response shapes
// (getFarmerLandRecords returns {records, totals, pagination};
// syncWithGovernmentLandRecords returns {syncedCount, ...}) - just never
// had a frontend client written.
const LAND_RECORDS_BASE = `${config.API_URL.replace(/\/api\/v1\/?$/, '')}/api/landrecords`;

export const farmerPortalAPI = {
  getLandRecords: (params) => api.get(LAND_RECORDS_BASE, { params }),
  addLandRecord: (data) => api.post(LAND_RECORDS_BASE, data),
  syncGovernmentLandRecords: () => api.post(`${LAND_RECORDS_BASE}/sync-government`),
};

// 2026-09-16: components/common/ModuleOperationPanel.jsx's own header
// comment claims a real bridge at /api/v1/backend-modules/:moduleId/:operation
// (backendModuleBridge.js) - checked directly: routes/claude/backendModuleBridge.js
// is a 20-line placeholder exposing only GET /health, nothing resembling
// getOperations/execute. Confirmed dead, not just unwired - same
// wrong-table-binding-adjacent class of gap as the modules/ tree names in
// api.js. Exported empty (not fabricated) so the build succeeds; every
// page using this generic panel already handles a load/execute error via
// loadError / its catch handler, so failing loudly at the call site is
// the correct, already-supported behavior.
export const moduleAPI = {};
