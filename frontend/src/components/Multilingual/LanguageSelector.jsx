import React, { useState, useEffect } from 'react';
import { useMultilingual } from './MultilingualProvider';

/**
 * Language Selector Component
 * Allows users to select their preferred language.
 *
 * 2026-08-03 fixes:
 *  - Removed `import { useTranslation } from 'react-i18next'`. react-i18next is
 *    neither a dependency in package.json nor installed in node_modules, so any
 *    build that reached this file would fail with an unresolved import. The
 *    import was also unused. This project's own MultilingualProvider is the
 *    real translation mechanism.
 *  - currentLanguage/onLanguageChange were required props with no defaults, so
 *    rendering <LanguageSelector /> standalone (e.g. in the header) threw on
 *    selection. They now fall back to the MultilingualProvider context.
 */
const LanguageSelector = ({ currentLanguage, onLanguageChange, showFlags = true }) => {
  const ctx = useMultilingual();
  const activeLanguage = currentLanguage ?? ctx?.currentLanguage ?? 'en';
  const changeLanguage = onLanguageChange ?? ctx?.changeLanguage ?? (() => {});

  const [languages, setLanguages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await fetch('/api/v1/multilingual/languages');
      const data = await response.json();
      setLanguages(data);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = (language) => {
    changeLanguage(language);
    setIsOpen(false);
  };

  const getLanguageFlag = (isoCode) => {
    const flagMap = {
      'en': '🇬🇧',
      'hi': '🇮🇳',
      'bn': '🇧🇩',
      'as': '🇮🇳',
      'mni': '🇮🇳',
      'mte': '🇮🇳',
      'kha': '🇮🇳',
      'gar': '🇮🇳',
      'nep': '🇳🇵',
      'mizo': '🇮🇳',
      'bho': '🇮🇳',
      'ori': '🇮🇳',
      'pun': '🇮🇳',
      'guj': '🇮🇳',
      'tam': '🇮🇳',
      'tel': '🇮🇳',
      'mal': '🇮🇳',
      'kan': '🇮🇳',
      'mar': '🇮🇳',
      'urd': '🇵🇰'
    };
    return flagMap[isoCode] || '🌐';
  };

  if (loading) {
    return <div className="animate-pulse h-10 w-32 bg-gray-200 rounded"></div>;
  }

  const currentLang = languages.find(lang => lang.iso_code === activeLanguage) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {showFlags && <span className="text-xl">{getLanguageFlag(currentLang?.iso_code)}</span>}
        <span className="font-medium text-gray-700">{currentLang?.name || 'English'}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {languages.map((language) => (
              <button
                key={language.id}
                onClick={() => handleLanguageSelect(language)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  language.iso_code === activeLanguage
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {showFlags && <span className="text-xl">{getLanguageFlag(language.iso_code)}</span>}
                <div className="flex-1 text-left">
                  <div className="font-medium">{language.name}</div>
                  <div className="text-sm text-gray-500">{language.native_name}</div>
                </div>
                {language.iso_code === activeLanguage && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
