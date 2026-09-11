import api from './api';

// Component-facing adapter. API ownership remains in services/api.js.
export { default } from './api';
export * from './api';

/**
 * Multilingual platform contract.
 * The language catalog is server-owned; the fallback is only used when the
 * catalog cannot be reached so the farmer UI remains usable offline.
 */
export const multilingualAPI = {
  getLanguages: () => api.get('/multilingual/languages'),
  getPreferences: () => api.get('/multilingual/preferences'),
  updatePreferences: (body) => api.put('/multilingual/preferences', body),
  getContent: (language) => api.get('/multilingual/content', { params: { language } }),
  translate: (body) => api.post('/multilingual/translate', body),
  detect: (text) => api.post('/multilingual/detect', { text }),
  getTranslations: (lang) => api.get(`/i18n/${encodeURIComponent(lang)}`),
  updateTranslations: (lang, data) => api.put(`/i18n/${encodeURIComponent(lang)}`, data),
};

/**
 * Conversational AI contract.
 */
export const conversationalAIAPI = {
  sendMessage: (message, options = {}) => api.post('/ai/conversational/send', { message, ...options }),
  getConversationHistory: () => api.get('/ai/conversational/history'),
};

/**
 * Voice AI contract.
 * Uses the existing authenticated voice-ai session/command service. Audio
 * capture/transcription can be browser-native or supplied by a server STT
 * provider; both paths carry the selected locale so the AI does not silently
 * fall back to English.
 */
export const voiceAIAPI = {
  createSession: (language, options = {}) => api.post('/voice-ai/voice-sessions', {
    language,
    ...options,
  }),
  getPreferences: () => api.get('/voice-ai/voice-preferences'),
  updatePreferences: (body) => api.put('/voice-ai/voice-preferences', body),
  sendCommand: (body) => api.post('/voice-ai/voice-commands', body),
  endSession: (sessionId) => api.post(`/voice-ai/voice-sessions/${encodeURIComponent(sessionId)}/end`),
  getCommands: (sessionId) => api.get(`/voice-ai/voice-sessions/${encodeURIComponent(sessionId)}/commands`),
  transcribeAudio: (audio, language) => api.post('/ai/voice/transcribe', { audio, language }),
  generateSpeech: (text, language) => api.post('/ai/voice/speak', { text, language }),
};

export const farmerAIAPI = {
  processVoice: (body) => api.post('/advanced-voice/process', body),
  getLanguages: () => api.get('/advanced-voice/languages'),
  createConversation: (body) => api.post('/advanced-voice/conversation', body),
};
