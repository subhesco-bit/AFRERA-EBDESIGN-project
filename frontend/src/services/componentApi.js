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
