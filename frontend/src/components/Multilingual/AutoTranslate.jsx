import React, { useState, useEffect } from 'react';

/**
 * Auto Translate Component
 * Automatically detects language and translates content
 */
const AutoTranslate = ({ 
  text, 
  targetLanguage, 
  onTranslated, 
  showOriginal = true,
  className = '' 
}) => {
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    if (text && targetLanguage && showTranslation) {
      handleTranslate();
    }
  }, [text, targetLanguage, showTranslation]);

  const handleTranslate = async () => {
    if (!text || !targetLanguage) return;

    setLoading(true);
    setError(null);

    try {
      // First detect language
      const detectResponse = await fetch('/api/v1/multilingual/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!detectResponse.ok) throw new Error('Language detection failed');
      
      const detectData = await detectResponse.json();
      setDetectedLanguage(detectData);

      // If detected language is same as target, no need to translate
      if (detectData.iso_code === targetLanguage) {
        setTranslatedText(text);
        onTranslated?.(text, detectData.iso_code);
        return;
      }

      // Translate text
      const translateResponse = await fetch('/api/v1/multilingual/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          source_language: detectData.iso_code,
          target_language: targetLanguage
        })
      });

      if (!translateResponse.ok) throw new Error('Translation failed');

      const translateData = await translateResponse.json();
      setTranslatedText(translateData.translated_text);
      onTranslated?.(translateData.translated_text, targetLanguage);

    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  if (!text) return null;

  return (
    <div className={`auto-translate ${className}`}>
      {showOriginal && (
        <div className="mb-2">
          <div className="text-sm text-gray-500 mb-1">
            {detectedLanguage ? `${detectedLanguage.name} (detected)` : 'Original'}
          </div>
          <p className="text-gray-800">{text}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={toggleTranslation}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Translating...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{showTranslation ? 'Hide Translation' : 'Show Translation'}</span>
            </>
          )}
        </button>

        {detectedLanguage && (
          <span className="text-xs text-gray-500">
            Detected: {detectedLanguage.name} ({detectedLanguage.confidence.toFixed(0)}%)
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {showTranslation && translatedText && !loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-600 mb-1 font-medium">Translation</div>
          <p className="text-gray-800">{translatedText}</p>
        </div>
      )}
    </div>
  );
};

export default AutoTranslate;
