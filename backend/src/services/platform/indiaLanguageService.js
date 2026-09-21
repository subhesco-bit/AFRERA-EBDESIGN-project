const {
  LANGUAGES,
  getLanguage,
  listLanguages,
  resolveLocale,
  capability
} = require('../../config/indiaLanguageRegistry');

/**
 * Application-facing language service. Keeps UI, AI, speech and ERP-facing
 * consumers on the same canonical language identity and prevents callers
 * from inventing incompatible locale codes.
 */
function resolvePreference(preferred, fallback = 'en') {
  const requested = typeof preferred === 'string' ? preferred.trim().toLowerCase() : '';
  const language = requested ? getLanguage(requested) : getLanguage(fallback);
  return {
    ...language,
    fallback: language.code === requested ? null : fallback,
    uiLocale: language.locale,
    speechLocale: language.locale,
    textDirection: 'ltr'
  };
}

function getCatalogue(options) {
  return listLanguages(options).map(language => ({
    ...language,
    capabilities: {
      ui: language.ui === true,
      text: language.text === true,
      nlp: language.nlp === true,
      speechRecognition: language.speechRecognition,
      textToSpeech: language.textToSpeech
    }
  }));
}

function canUseVoice(code) {
  return capability(code, 'speechRecognition') && capability(code, 'textToSpeech');
}

function normaliseVoiceSession({ language, sessionLanguage, fallback = 'en' } = {}) {
  const resolved = resolvePreference(sessionLanguage || language, fallback);
  return {
    language: resolved.code,
    locale: resolved.locale,
    speechLocale: resolveLocale(resolved.code),
    voiceEnabled: canUseVoice(resolved.code)
  };
}

module.exports = {
  LANGUAGES,
  getCatalogue,
  resolvePreference,
  normaliseVoiceSession,
  canUseVoice
};
