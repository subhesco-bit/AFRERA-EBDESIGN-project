import React, { createContext, useContext, useState, useEffect } from 'react';
import { multilingualAPI } from '../../services/api';

/**
 * Multilingual Context Provider
 * Manages language state and provides translation functions
 *
 * FE-02 note: not resolved here by design. This *is* the data-fetching
 * boundary for translations in this app — it exists specifically so
 * descendants (LanguageSelector, AutoTranslate, any future consumer) read
 * from context/props instead of fetching for themselves. Its own fetches
 * can't be lifted further up without duplicating this same provider pattern
 * one level higher. FE-01 (routing through api.js) is fixed below.
 */
const MultilingualContext = createContext();

export const useMultilingual = () => {
  const context = useContext(MultilingualContext);
  if (!context) {
    throw new Error('useMultilingual must be used within MultilingualProvider');
  }
  return context;
};

export const MultilingualProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [languages, setLanguages] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    initializeMultilingual();
  }, []);

  const initializeMultilingual = async () => {
    try {
      // Fetch available languages
      const langResponse = await multilingualAPI.getLanguages();
      setLanguages(langResponse.data);

      // Fetch user preferences
      try {
        const prefResponse = await multilingualAPI.getPreferences();
        const prefData = prefResponse.data;
        setPreferences(prefData);
        if (prefData.primary_language_code) {
          setCurrentLanguage(prefData.primary_language_code);
        }
      } catch (prefError) {
        // Preferences are optional (e.g. anonymous visitor) — fall through to defaults.
        console.error('Failed to fetch language preferences:', prefError);
      }

      // Load translations for current language
      await loadTranslations(currentLanguage);
    } catch (error) {
      console.error('Failed to initialize multilingual:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTranslations = async (languageCode) => {
    try {
      // In a real implementation, this would fetch all translations for the current language
      // For now, we'll use a basic implementation
      const response = await multilingualAPI.getContent(languageCode);
      const data = response.data;

      // Convert array to key-value map
      const translationMap = {};
      if (Array.isArray(data)) {
        data.forEach(item => {
          translationMap[item.content_key] = item.translated_text;
        });
      }
      setTranslations(translationMap);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  };

  const changeLanguage = async (language) => {
    setCurrentLanguage(language.iso_code);

    // Update user preferences
    try {
      await multilingualAPI.updatePreferences({ primary_language: language.iso_code });
    } catch (error) {
      console.error('Failed to update language preference:', error);
    }

    // Reload translations for new language
    await loadTranslations(language.iso_code);
  };

  const translate = async (text, targetLanguage = currentLanguage) => {
    try {
      const response = await multilingualAPI.translate({
        text,
        source_language: 'en', // Assuming source is English
        target_language: targetLanguage
      });

      return response.data.translated_text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text on error
    }
  };

  const detectLanguage = async (text) => {
    try {
      const response = await multilingualAPI.detect(text);
      return response.data;
    } catch (error) {
      console.error('Language detection failed:', error);
      return null;
    }
  };

  const t = (key, fallback = key) => {
    return translations[key] || fallback;
  };

  const value = {
    currentLanguage,
    languages,
    preferences,
    loading,
    translations,
    changeLanguage,
    translate,
    detectLanguage,
    t,
    loadTranslations
  };

  return (
    <MultilingualContext.Provider value={value}>
      {children}
    </MultilingualContext.Provider>
  );
};
