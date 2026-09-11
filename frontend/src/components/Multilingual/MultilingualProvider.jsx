import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { multilingualAPI } from '../../services/componentApi';

const MultilingualContext = createContext(null);

// Regional-first catalogue for India/Northeast India. The backend catalogue
// remains authoritative; this guarantees language selection is still usable
// during offline/startup failures and prevents a farmer-facing English-only UI.
export const REGIONAL_LANGUAGES = [
  { id: 'en', iso_code: 'en', name: 'English', native_name: 'English', direction: 'ltr', is_active: true, priority: 100 },
  { id: 'hi', iso_code: 'hi', name: 'Hindi', native_name: 'हिन्दी', direction: 'ltr', is_active: true, priority: 95 },
  { id: 'as', iso_code: 'as', name: 'Assamese', native_name: 'অসমীয়া', direction: 'ltr', is_active: true, priority: 94 },
  { id: 'bn', iso_code: 'bn', name: 'Bengali', native_name: 'বাংলা', direction: 'ltr', is_active: true, priority: 93 },
  { id: 'mni', iso_code: 'mni', name: 'Manipuri', native_name: 'মৈতৈলোন্', direction: 'ltr', is_active: true, priority: 92 },
  { id: 'kha', iso_code: 'kha', name: 'Khasi', native_name: 'Ka Ktien Khasi', direction: 'ltr', is_active: true, priority: 91 },
  { id: 'miz', iso_code: 'miz', name: 'Mizo', native_name: 'Mizo', direction: 'ltr', is_active: true, priority: 90 },
  { id: 'ne', iso_code: 'ne', name: 'Nepali', native_name: 'नेपाली', direction: 'ltr', is_active: true, priority: 89 },
  { id: 'brx', iso_code: 'brx', name: 'Bodo', native_name: 'बड़ो', direction: 'ltr', is_active: true, priority: 88 },
  { id: 'mr', iso_code: 'mr', name: 'Marathi', native_name: 'मराठी', direction: 'ltr', is_active: true, priority: 80 },
  { id: 'gu', iso_code: 'gu', name: 'Gujarati', native_name: 'ગુજરાતી', direction: 'ltr', is_active: true, priority: 79 },
  { id: 'pa', iso_code: 'pa', name: 'Punjabi', native_name: 'ਪੰਜਾਬੀ', direction: 'ltr', is_active: true, priority: 78 },
  { id: 'or', iso_code: 'or', name: 'Odia', native_name: 'ଓଡ଼ିଆ', direction: 'ltr', is_active: true, priority: 77 },
  { id: 'ta', iso_code: 'ta', name: 'Tamil', native_name: 'தமிழ்', direction: 'ltr', is_active: true, priority: 76 },
  { id: 'te', iso_code: 'te', name: 'Telugu', native_name: 'తెలుగు', direction: 'ltr', is_active: true, priority: 75 },
  { id: 'kn', iso_code: 'kn', name: 'Kannada', native_name: 'ಕನ್ನಡ', direction: 'ltr', is_active: true, priority: 74 },
  { id: 'ml', iso_code: 'ml', name: 'Malayalam', native_name: 'മലയാളം', direction: 'ltr', is_active: true, priority: 73 },
  { id: 'ur', iso_code: 'ur', name: 'Urdu', native_name: 'اردو', direction: 'rtl', is_active: true, priority: 72 },
];

export const useMultilingual = () => {
  const context = useContext(MultilingualContext);
  if (!context) throw new Error('useMultilingual must be used within MultilingualProvider');
  return context;
};

const normaliseLanguages = (serverLanguages = []) => {
  const byCode = new Map(REGIONAL_LANGUAGES.map((language) => [language.iso_code, language]));
  serverLanguages.forEach((language) => {
    const code = language.iso_code || language.code;
    if (!code) return;
    byCode.set(code, { ...byCode.get(code), ...language, iso_code: code });
  });
  return Array.from(byCode.values())
    .filter((language) => language.is_active !== false)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
};

export const MultilingualProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => localStorage.getItem('preferred_language') || 'en');
  const [languages, setLanguages] = useState(REGIONAL_LANGUAGES);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState({});
  const [translationStatus, setTranslationStatus] = useState('idle');

  const loadTranslations = useCallback(async (languageCode) => {
    setTranslationStatus('loading');
    try {
      const response = await multilingualAPI.getContent(languageCode);
      const data = Array.isArray(response.data) ? response.data : [];
      const translationMap = {};
      data.forEach((item) => {
        if (item.content_key) translationMap[item.content_key] = item.translated_text;
      });
      setTranslations(translationMap);
      setTranslationStatus('ready');
    } catch (error) {
      console.error('Failed to load translations:', error);
      setTranslations({});
      setTranslationStatus('fallback');
    }
  }, []);

  const initializeMultilingual = useCallback(async () => {
    try {
      const langResponse = await multilingualAPI.getLanguages();
      const serverLanguages = Array.isArray(langResponse.data)
        ? langResponse.data
        : (langResponse.data?.languages || []);
      setLanguages(normaliseLanguages(serverLanguages));
    } catch (error) {
      console.warn('Using regional language fallback catalogue:', error.message);
      setLanguages(REGIONAL_LANGUAGES);
    }

    try {
      const prefResponse = await multilingualAPI.getPreferences();
      const prefData = prefResponse.data || {};
      setPreferences(prefData);
      const preferred = prefData.primary_language_code || prefData.primary_language;
      if (preferred) {
        setCurrentLanguage(preferred);
        localStorage.setItem('preferred_language', preferred);
        await loadTranslations(preferred);
        return;
      }
    } catch (error) {
      console.info('Language preferences unavailable; using local preference.');
    }

    await loadTranslations(currentLanguage);
  }, [currentLanguage, loadTranslations]);

  useEffect(() => {
    initializeMultilingual().finally(() => setLoading(false));
  }, [initializeMultilingual]);

  const changeLanguage = useCallback(async (languageOrCode) => {
    const code = typeof languageOrCode === 'string'
      ? languageOrCode
      : languageOrCode?.iso_code || languageOrCode?.code;
    if (!code) return false;

    const selected = languages.find((language) => language.iso_code === code)
      || REGIONAL_LANGUAGES.find((language) => language.iso_code === code);
    if (!selected) return false;

    setCurrentLanguage(code);
    localStorage.setItem('preferred_language', code);
    document.documentElement.lang = code;
    document.documentElement.dir = selected.direction || 'ltr';

    try {
      const updated = await multilingualAPI.updatePreferences({ primary_language: code });
      setPreferences(updated.data || preferences);
    } catch (error) {
      console.info('Server language preference unavailable; local preference retained.');
    }

    await loadTranslations(code);
    return true;
  }, [languages, loadTranslations, preferences]);

  const translate = useCallback(async (text, targetLanguage = currentLanguage, options = {}) => {
    if (!text) return '';
    const localKey = options.key;
    if (localKey && translations[localKey]) return translations[localKey];
    try {
      const response = await multilingualAPI.translate({
        text,
        source_language: options.sourceLanguage || 'en',
        target_language: targetLanguage,
        domain: options.domain,
        context: options.context,
      });
      return response.data?.translated_text || text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  }, [currentLanguage, translations]);

  const detectLanguage = useCallback(async (text) => {
    try {
      const response = await multilingualAPI.detect(text);
      return response.data;
    } catch (error) {
      console.error('Language detection failed:', error);
      return null;
    }
  }, []);

  const t = useCallback((key, fallback = key) => translations[key] || fallback, [translations]);

  const value = useMemo(() => ({
    currentLanguage,
    languages,
    preferences,
    loading,
    translations,
    translationStatus,
    changeLanguage,
    translate,
    detectLanguage,
    t,
    loadTranslations,
  }), [currentLanguage, languages, preferences, loading, translations, translationStatus, changeLanguage, translate, detectLanguage, t, loadTranslations]);

  return <MultilingualContext.Provider value={value}>{children}</MultilingualContext.Provider>;
};
