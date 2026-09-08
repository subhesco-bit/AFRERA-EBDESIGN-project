/**
 * Enterprise-Grade Internationalization (i18n) Support
 *
 * Production-ready i18n with:
 * - Translation management
 * - Language detection and switching
 * - RTL (Right-to-Left) support
 * - Pluralization
 * - Date/time formatting
 * - Number formatting
 * - Currency formatting
 * - Lazy loading of translations
 * - Namespace support
 * - Interpolation
 * - Context-aware translations
 */

import config from '../config/env';

/**
 * Supported languages
 */
const SUPPORTED_LANGUAGES = {
  en: {
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    locale: 'en-US',
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिंदी',
    dir: 'ltr',
    locale: 'hi-IN',
  },
  ta: {
    name: 'Tamil',
    nativeName: 'தமிழ்',
    dir: 'ltr',
    locale: 'ta-IN',
  },
  te: {
    name: 'Telugu',
    nativeName: 'తెలుగు',
    dir: 'ltr',
    locale: 'te-IN',
  },
  kn: {
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    dir: 'ltr',
    locale: 'kn-IN',
  },
  mr: {
    name: 'Marathi',
    nativeName: 'मराठी',
    dir: 'ltr',
    locale: 'mr-IN',
  },
  bn: {
    name: 'Bengali',
    nativeName: 'বাংলা',
    dir: 'ltr',
    locale: 'bn-IN',
  },
  gu: {
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    dir: 'ltr',
    locale: 'gu-IN',
  },
  pa: {
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    dir: 'ltr',
    locale: 'pa-IN',
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    locale: 'ar-SA',
  },
};

/**
 * Default translations (English)
 */
const DEFAULT_TRANSLATIONS = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    clear: 'Clear',
    select: 'Select',
    deselect: 'Deselect',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    yes: 'Yes',
    no: 'No',
    or: 'or',
    and: 'and',
    of: 'of',
    to: 'to',
    from: 'from',
    at: 'at',
    in: 'in',
    on: 'on',
    by: 'by',
    with: 'with',
    without: 'without',
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    welcomeBack: 'Welcome Back',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    loginSuccess: 'Login successful',
    loginFailed: 'Login failed',
    registerSuccess: 'Registration successful',
    registerFailed: 'Registration failed',
    logoutSuccess: 'Logout successful',
    invalidCredentials: 'Invalid email or password',
    passwordMismatch: 'Passwords do not match',
    weakPassword: 'Password is too weak',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
  },
  navigation: {
    home: 'Home',
    marketplace: 'Marketplace',
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    contact: 'Contact',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Network error. Please check your connection.',
    server: 'Server error. Please try again later.',
    notFound: 'Page not found',
    unauthorized: 'You are not authorized to access this resource',
    forbidden: 'Access forbidden',
    validation: 'Please check your input and try again',
    timeout: 'Request timed out. Please try again.',
  },
  validation: {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    minLength: 'Must be at least {{min}} characters',
    maxLength: 'Must be at most {{max}} characters',
    pattern: 'Please match the required format',
    min: 'Must be at least {{min}}',
    max: 'Must be at most {{max}}',
    numeric: 'Must be a number',
    integer: 'Must be an integer',
    url: 'Please enter a valid URL',
    phone: 'Please enter a valid phone number',
  },
};

/**
 * Translation cache
 */
const translationCache = new Map();

/**
 * Current language state
 */
let currentLanguage = config.DEFAULT_LANGUAGE || 'en';

/**
 * Get current language
 */
function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Set current language
 */
function setLanguage(languageCode) {
  if (!SUPPORTED_LANGUAGES[languageCode]) {

    return false;
  }

  currentLanguage = languageCode;

  // Update document direction
  if (typeof document !== 'undefined') {
    document.documentElement.lang = languageCode;
    document.documentElement.dir = SUPPORTED_LANGUAGES[languageCode].dir;
  }

  // Save to localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('preferred_language', languageCode);
  }

  return true;
}

/**
 * Detect user's preferred language
 */
function detectLanguage() {
  // Check localStorage first
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('preferred_language');
    if (saved && SUPPORTED_LANGUAGES[saved]) {
      return saved;
    }
  }

  // Check browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGUAGES[browserLang]) {
      return browserLang;
    }
  }

  // Return default
  return config.DEFAULT_LANGUAGE || 'en';
}

/**
 * Get translation for a key
 */
function t(key, options = {}) {
  const { namespace = 'common', defaultValue, interpolate = {} } = options;

  // Get translations for current language
  const translations = translationCache.get(currentLanguage) || DEFAULT_TRANSLATIONS;

  // Get value from namespace
  let value = translations[namespace]?.[key];

  // Fallback to common namespace
  if (!value && namespace !== 'common') {
    value = translations.common?.[key];
  }

  // Fallback to default value
  if (!value) {
    value = defaultValue || key;
  }

  // Interpolate variables
  if (Object.keys(interpolate).length > 0) {
    value = interpolateVariables(value, interpolate);
  }

  return value;
}

/**
 * Interpolate variables into translation string
 */
function interpolateVariables(str, variables) {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Pluralize translation
 */
function pluralize(key, count, options = {}) {
  const { namespace = 'common' } = options;

  // Get translations
  let translations = translationCache.get(currentLanguage) || DEFAULT_TRANSLATIONS;
  const namespaceTranslations = translations[namespace] || {};

  // Try to get pluralized form
  let value;

  if (count === 0 && namespaceTranslations[`${key}_zero`]) {
    value = namespaceTranslations[`${key}_zero`];
  } else if (count === 1 && namespaceTranslations[`${key}_one`]) {
    value = namespaceTranslations[`${key}_one`];
  } else if (namespaceTranslations[`${key}_other`]) {
    value = namespaceTranslations[`${key}_other`];
  } else {
    value = namespaceTranslations[key] || key;
  }

  // Interpolate count
  value = value.replace('{{count}}', count);

  return value;
}

/**
 * Format date according to locale
 */
function formatDate(date, options = {}) {
  const language = currentLanguage;
  const locale = SUPPORTED_LANGUAGES[language]?.locale || 'en-US';

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
}

/**
 * Format time according to locale
 */
function formatTime(date, options = {}) {
  let language = currentLanguage;
  let locale = SUPPORTED_LANGUAGES[language]?.locale || 'en-US';

  let defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
}

/**
 * Format date and time according to locale
 */
function formatDateTime(date, options = {}) {
  let language = currentLanguage;
  let locale = SUPPORTED_LANGUAGES[language]?.locale || 'en-US';

  let defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
}

/**
 * Format number according to locale
 */
function formatNumber(number, options = {}) {
  let language = currentLanguage;
  let locale = SUPPORTED_LANGUAGES[language]?.locale || 'en-US';

  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Format currency according to locale
 */
function formatCurrency(amount, currency = 'INR', options = {}) {
  let language = currentLanguage;
  let locale = SUPPORTED_LANGUAGES[language]?.locale || 'en-US';

  let defaultOptions = {
    style: 'currency',
    currency,
  };

  return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(amount);
}

/**
 * Format percentage according to locale
 */
function formatPercent(value, options = {}) {
  let language = currentLanguage;
  let locale = SUPPORTED_LANGUAGES[language]?.locale || 'en-US';

  let defaultOptions = {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };

  return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(value);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date) {
  let language = currentLanguage;
  let locale = SUPPORTED_LANGUAGES[language]?.locale || 'en-US';

  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (years > 0) return rtf.format(-years, 'year');
  if (months > 0) return rtf.format(-months, 'month');
  if (days > 0) return rtf.format(-days, 'day');
  if (hours > 0) return rtf.format(-hours, 'hour');
  if (minutes > 0) return rtf.format(-minutes, 'minute');
  return rtf.format(-seconds, 'second');
}

/**
 * Check if current language is RTL
 */
function isRTL() {
  return SUPPORTED_LANGUAGES[currentLanguage]?.dir === 'rtl';
}

/**
 * Get text direction for current language
 */
function getTextDirection() {
  return SUPPORTED_LANGUAGES[currentLanguage]?.dir || 'ltr';
}

/**
 * Load translations for a language
 */
async function loadTranslations(languageCode) {
  if (translationCache.has(languageCode)) {
    return translationCache.get(languageCode);
  }

  try {
    // Try to load from file
    let translations = await import(`../locales/${languageCode}.json`);
    translationCache.set(languageCode, translations.default || translations);
    return translations.default || translations;
  } catch (error) {

    // Return default translations as fallback
    return DEFAULT_TRANSLATIONS;
  }
}

/**
 * Add translations dynamically
 */
function addTranslations(languageCode, translations) {
  const existing = translationCache.get(languageCode) || {};
  translationCache.set(languageCode, { ...existing, ...translations });
}

/**
 * Get all supported languages
 */
function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

/**
 * Get language info
 */
function getLanguageInfo(languageCode) {
  return SUPPORTED_LANGUAGES[languageCode];
}

/**
 * Initialize i18n
 */
function init() {
  // Detect and set language
  const detectedLanguage = detectLanguage();
  setLanguage(detectedLanguage);

  // Load default translations
  translationCache.set('en', DEFAULT_TRANSLATIONS);

  // Load translations for detected language if not English
  if (detectedLanguage !== 'en') {
    loadTranslations(detectedLanguage);
  }

  return currentLanguage;
}

/**
 * i18n API
 */
const i18n = {
  SUPPORTED_LANGUAGES,
  getCurrentLanguage,
  setLanguage,
  detectLanguage,
  t,
  pluralize,
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  isRTL,
  getTextDirection,
  loadTranslations,
  addTranslations,
  getSupportedLanguages,
  getLanguageInfo,
  init,
};

export default i18n;
