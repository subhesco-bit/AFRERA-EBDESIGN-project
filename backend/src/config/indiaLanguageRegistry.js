/**
 * Canonical India Language Registry
 *
 * Single source of truth for language, script, locale and interaction
 * capabilities. Provider-specific speech support is deliberately marked
 * conservatively; the application must verify provider capability before
 * enabling a voice feature.
 */

const SCHEDULED = [
  ['as', 'Assamese', 'অসমীয়া', 'Bengali-Assamese', 'as-IN'],
  ['bn', 'Bengali', 'বাংলা', 'Bengali', 'bn-IN'],
  ['brx', 'Bodo', 'बड़ो', 'Devanagari', 'brx-IN'],
  ['doi', 'Dogri', 'डोगरी', 'Devanagari', 'doi-IN'],
  ['gu', 'Gujarati', 'ગુજરાતી', 'Gujarati', 'gu-IN'],
  ['hi', 'Hindi', 'हिन्दी', 'Devanagari', 'hi-IN'],
  ['kn', 'Kannada', 'ಕನ್ನಡ', 'Kannada', 'kn-IN'],
  ['ks', 'Kashmiri', 'कॉशुर / کٲشُر', 'Arabic/Devanagari', 'ks-IN'],
  ['kok', 'Konkani', 'कोंकणी', 'Devanagari', 'kok-IN'],
  ['mai', 'Maithili', 'मैथिली', 'Devanagari', 'mai-IN'],
  ['ml', 'Malayalam', 'മലയാളം', 'Malayalam', 'ml-IN'],
  ['mni', 'Manipuri / Meitei', 'মৈতৈলোন্ / ꯃꯇꯩꯂꯣꯟ', 'Bengali/Meitei Mayek', 'mni-IN'],
  ['mr', 'Marathi', 'मराठी', 'Devanagari', 'mr-IN'],
  ['ne', 'Nepali', 'नेपाली', 'Devanagari', 'ne-IN'],
  ['or', 'Odia', 'ଓଡ଼ିଆ', 'Odia', 'or-IN'],
  ['pa', 'Punjabi', 'ਪੰਜਾਬੀ', 'Gurmukhi', 'pa-IN'],
  ['sa', 'Sanskrit', 'संस्कृतम्', 'Devanagari', 'sa-IN'],
  ['sat', 'Santali', 'ᱥᱟᱱᱛᱟᱲᱤ', 'Ol Chiki', 'sat-IN'],
  ['sd', 'Sindhi', 'सिन्धी / سنڌي', 'Devanagari/Arabic', 'sd-IN'],
  ['ta', 'Tamil', 'தமிழ்', 'Tamil', 'ta-IN'],
  ['te', 'Telugu', 'తెలుగు', 'Telugu', 'te-IN'],
  ['ur', 'Urdu', 'اردو', 'Arabic', 'ur-IN']
].map(([code, name, nativeName, script, locale]) => ({
  code, name, nativeName, script, locale,
  scheduled: true,
  ui: true,
  text: true,
  nlp: true,
  speechRecognition: 'provider-verified',
  textToSpeech: 'provider-verified'
}));

// High-priority Northeast field languages. These remain separate from the
// constitutional scheduled-language set so coverage claims stay precise.
const NORTHEAST = [
  ['kha', 'Khasi', 'Khasi', 'Latin', 'kha-IN'],
  ['mizo', 'Mizo', 'Mizo', 'Latin', 'miz-IN'],
  ['grt', 'Garo', 'Garo', 'Latin', 'grt-IN'],
  ['trp', 'Kokborok / Tripuri', 'Kokborok', 'Bengali', 'trp-IN'],
  ['nag', 'Nagamese', 'Nagamese', 'Latin', 'nag-IN'],
  ['tcy', 'Tulu', 'ತುಳು', 'Kannada', 'tcy-IN']
].map(([code, name, nativeName, script, locale]) => ({
  code, name, nativeName, script, locale,
  scheduled: false,
  northeast: true,
  ui: true,
  text: true,
  nlp: true,
  speechRecognition: 'provider-verified',
  textToSpeech: 'provider-verified'
}));

const ENGLISH = {
  code: 'en', name: 'English', nativeName: 'English', script: 'Latin', locale: 'en-IN',
  scheduled: false, ui: true, text: true, nlp: true,
  speechRecognition: 'provider-verified', textToSpeech: 'provider-verified'
};

const LANGUAGES = Object.freeze([ENGLISH, ...SCHEDULED, ...NORTHEAST]);
const BY_CODE = Object.freeze(Object.fromEntries(LANGUAGES.map(language => [language.code, language])));

function getLanguage(code = 'en') {
  return BY_CODE[code] || BY_CODE.en;
}

function listLanguages({ northeast = false, scheduled = false } = {}) {
  return LANGUAGES.filter(language =>
    (!northeast || language.northeast === true) &&
    (!scheduled || language.scheduled === true)
  );
}

function resolveLocale(code, fallback = 'en-IN') {
  return getLanguage(code).locale || fallback;
}

function capability(code, name) {
  const language = getLanguage(code);
  return language[name] === true || language[name] === 'provider-verified';
}

module.exports = {
  LANGUAGES,
  SCHEDULED,
  NORTHEAST,
  BY_CODE,
  getLanguage,
  listLanguages,
  resolveLocale,
  capability
};
