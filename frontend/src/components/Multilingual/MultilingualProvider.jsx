import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Multilingual Context Provider
 * Manages language state and provides translation functions
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
      const langResponse = await fetch('/api/v1/multilingual/languages');
      const langData = await langResponse.json();
      setLanguages(langData);

      // Fetch user preferences
      const prefResponse = await fetch('/api/v1/multilingual/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (prefResponse.ok) {
        const prefData = await prefResponse.json();
        setPreferences(prefData);
        if (prefData.primary_language_code) {
          setCurrentLanguage(prefData.primary_language_code);
        }
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
      const response = await fetch(`/api/v1/multilingual/content?language=${languageCode}`);
      const data = await response.json();
      
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
      await fetch('/api/v1/multilingual/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          primary_language: language.iso_code
        })
      });
    } catch (error) {
      console.error('Failed to update language preference:', error);
    }

    // Reload translations for new language
    await loadTranslations(language.iso_code);
  };

  const translate = async (text, targetLanguage = currentLanguage) => {
    try {
      const response = await fetch('/api/v1/multilingual/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          text,
          source_language: 'en', // Assuming source is English
          target_language: targetLanguage
        })
      });
      
      const data = await response.json();
      return data.translated_text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text on error
    }
  };

  const detectLanguage = async (text) => {
    try {
      const response = await fetch('/api/v1/multilingual/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      return data;
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
