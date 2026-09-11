import React, { useEffect, useMemo, useRef, useState } from 'react';
import { farmerAIAPI, multilingualAPI, voiceAIAPI } from '../../services/componentApi';

const LOCALE_MAP = {
  en: 'en-IN', hi: 'hi-IN', as: 'as-IN', bn: 'bn-IN', mni: 'mni-IN',
  kha: 'en-IN', miz: 'en-IN', ne: 'ne-NP', brx: 'hi-IN', or: 'or-IN',
  mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', ta: 'ta-IN', te: 'te-IN',
  kn: 'kn-IN', ml: 'ml-IN', ur: 'ur-IN',
};

/**
 * Farmer Voice Assistant
 *
 * Voice is a first-class interaction path: selected regional language is
 * carried through recognition, the authenticated AI session, intent
 * processing and spoken response. Browser speech is preferred; the server
 * voice APIs remain available for providers that support richer STT/TTS.
 */
const VoiceAssistant = ({ language = 'en', onLanguageDetected }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [languages, setLanguages] = useState([]);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const sessionRef = useRef(null);
  const mountedRef = useRef(true);

  const selectedLanguage = useMemo(() => {
    return languages.find((item) => item.iso_code === language || item.code === language)
      || { iso_code: language, name: language, native_name: language };
  }, [languages, language]);

  const speechLocale = LOCALE_MAP[language] || `${language}-IN`;

  useEffect(() => {
    mountedRef.current = true;
    initialize();
    return () => {
      mountedRef.current = false;
      recognitionRef.current?.abort();
      if (sessionRef.current) {
        voiceAIAPI.endSession(sessionRef.current).catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.lang = speechLocale;
  }, [speechLocale]);

  const initialize = async () => {
    try {
      const [languageResult, preferenceResult] = await Promise.allSettled([
        multilingualAPI.getLanguages(),
        voiceAIAPI.getPreferences(),
      ]);

      if (languageResult.status === 'fulfilled') {
        const data = languageResult.value.data;
        setLanguages(Array.isArray(data) ? data : (data?.languages || []));
      }
      if (preferenceResult.status === 'fulfilled') setPreferences(preferenceResult.value.data);

      const session = await voiceAIAPI.createSession(language, {
        locale: speechLocale,
        interface: 'farmer_voice',
      });
      const id = session.data?.id || session.data?.session_id;
      if (id) {
        sessionRef.current = id;
        if (mountedRef.current) setSessionId(id);
      }

      initializeSpeechRecognition();
    } catch (err) {
      console.error('Voice initialization failed:', err);
      initializeSpeechRecognition();
      if (mountedRef.current) setError('Voice AI is starting in local mode.');
    }
  };

  const initializeSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = speechLocale;

    recognition.onstart = () => {
      if (mountedRef.current) {
        setIsListening(true);
        setError('');
      }
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0]?.transcript || '';
        if (event.results[index].isFinal) finalText += text;
        else interimText += text;
      }
      const nextText = `${finalText}${interimText}`.trim();
      transcriptRef.current = nextText;
      if (mountedRef.current) setTranscript(nextText);
      if (finalText.trim()) transcriptRef.current = finalText.trim();
    };

    recognition.onend = () => {
      const finalText = transcriptRef.current.trim();
      if (mountedRef.current) setIsListening(false);
      if (finalText) processVoiceCommand(finalText);
    };

    recognition.onerror = (event) => {
      if (mountedRef.current) {
        setIsListening(false);
        if (event.error !== 'aborted') setError(`Voice recognition: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition is not supported by this browser. Use the server voice option.');
      return;
    }
    transcriptRef.current = '';
    setTranscript('');
    setResponse('');
    setError('');
    try {
      recognitionRef.current.lang = speechLocale;
      recognitionRef.current.start();
    } catch (err) {
      // Browsers throw when start() is called while already running.
      if (!String(err?.message || '').toLowerCase().includes('already')) {
        setError('Could not start the microphone. Check microphone permission.');
      }
    }
  };

  const stopListening = () => recognitionRef.current?.stop();

  const processVoiceCommand = async (text) => {
    setIsProcessing(true);
    setError('');
    try {
      const activeSession = sessionRef.current || sessionId;
      const result = await voiceAIAPI.sendCommand({
        session_id: activeSession,
        transcript: text,
        language,
        locale: speechLocale,
        command_type: 'farmer_assistant',
        parameters: {},
      });

      const data = result.data || {};
      const serverText = data.text || data.response || data.message;
      if (serverText) {
        setResponse(serverText);
      } else if (data.intent) {
        setResponse(`I understood your request about ${data.intent}.`);
      } else {
        // Use the advanced agricultural AI route when the legacy command
        // service does not return a natural-language response.
        const advanced = await farmerAIAPI.processVoice({
          transcript: text,
          language,
          locale: speechLocale,
          session_id: activeSession,
        });
        setResponse(advanced.data?.text || advanced.data?.response || text);
      }

      const detected = data.detected_language || data.language_detected;
      if (detected && onLanguageDetected) onLanguageDetected(detected);
    } catch (err) {
      console.error('Voice AI command failed:', err);
      try {
        const fallback = await farmerAIAPI.processVoice({
          transcript: text,
          language,
          locale: speechLocale,
          session_id: sessionRef.current || sessionId,
        });
        setResponse(fallback.data?.text || fallback.data?.response || 'I could not complete that request. Please try again.');
      } catch (fallbackError) {
        console.error('Advanced voice fallback failed:', fallbackError);
        setResponse('I could not understand the request. Please try again slowly.');
        setError('Voice AI could not reach the server.');
      }
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  };

  const speak = async (text) => {
    if (!text) return;
    const enabled = preferences?.auto_response_enabled !== false;
    if (!enabled) return;

    // Prefer browser TTS because it is immediate and works offline when the
    // device has a matching regional voice. The server TTS endpoint remains
    // available to callers needing provider-backed voices.
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLocale;
      utterance.rate = Number(preferences?.speech_rate) || 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      return;
    }

    try {
      await voiceAIAPI.generateSpeech(text, language);
    } catch (err) {
      console.error('Server speech generation failed:', err);
    }
  };

  useEffect(() => {
    if (response && !isProcessing) speak(response);
  }, [response, isProcessing, language]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6" lang={language}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Farmer Voice Assistant</h3>
          <p className="text-sm text-gray-500 mt-1">
            {selectedLanguage.native_name || selectedLanguage.name || language} • {speechLocale}
          </p>
        </div>
        {preferences && (
          <span className="text-sm text-gray-500">{preferences.voice_gender || 'AI voice'}</span>
        )}
      </div>

      <div className="flex items-center justify-center mb-6">
        <button
          type="button"
          aria-label={isListening ? 'Stop listening' : 'Start voice assistant'}
          aria-pressed={isListening}
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="text-3xl text-white" aria-hidden="true">{isListening ? '■' : '🎙️'}</span>
        </button>
      </div>

      {transcript && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-600 mb-1">You said:</p>
          <p className="text-gray-800">{transcript}</p>
        </div>
      )}

      {response && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-600 mb-1">Assistant:</p>
          <p className="text-gray-800">{response}</p>
        </div>
      )}

      {error && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">{error}</div>}

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-gray-500" aria-live="polite">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span>AI is processing your request...</span>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 mt-4">
        {isListening ? 'Listening… speak naturally.' : 'Tap the microphone and speak in your selected regional language.'}
      </div>

      <div className="mt-6 pt-6 border-t">
        <p className="text-sm font-medium text-gray-700 mb-3">Examples</p>
        <div className="flex flex-wrap gap-2">
          {[
            'What is today’s crop price?',
            'Show my orders',
            'I want to sell my harvest',
            'What subsidy can I apply for?',
          ].map((command) => (
            <button
              type="button"
              key={command}
              onClick={() => processVoiceCommand(command)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
            >
              {command}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
