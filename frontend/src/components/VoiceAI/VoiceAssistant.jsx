import React, { useState, useEffect, useRef } from 'react';
import { voiceAIAPI } from '../../services/api';

/**
 * Voice Assistant Component
 * Voice-activated AI assistant for hands-free interaction
 *
 * FE-02 note: not resolved here. Every call is tied to live session/voice
 * interaction state (starting a session, processing whatever the user just
 * said), not a fixed dataset a parent page could hand down as props, and
 * there is no current parent page rendering it (unmounted as of 2026-08-07).
 * FE-01 (routing through api.js) is fixed below.
 */
const VoiceAssistant = ({ language = 'en' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    initializeSession();
    fetchPreferences();
    
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript) {
          processVoiceCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (sessionId) {
        endSession();
      }
    };
  }, [language]);

  const initializeSession = async () => {
    try {
      const response = await voiceAIAPI.createSession(language);
      setSessionId(response.data.id);
    } catch (err) {
      console.error('Failed to initialize voice session:', err);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await voiceAIAPI.getPreferences();
      setPreferences(response.data);
    } catch (err) {
      console.error('Failed to fetch voice preferences:', err);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setTranscript('');
      setResponse('');
      recognitionRef.current.start();
    } else {
      alert('Speech recognition is not supported in this browser');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceCommand = async (transcriptText) => {
    setIsProcessing(true);
    try {
      const response = await voiceAIAPI.sendCommand({
        session_id: sessionId,
        transcript: transcriptText,
        command_type: 'general',
        parameters: {}
      });

      const data = response.data;
      setResponse(`I understood: "${data.intent}". Processing your request...`);

      // Simulate response (in production, this would be actual AI response)
      setTimeout(() => {
        setResponse(`Here's what I found for "${transcriptText}"`);
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to process voice command:', err);
      setResponse('Sorry, I had trouble processing that request.');
      setIsProcessing(false);
    }
  };

  const endSession = async () => {
    if (sessionId) {
      try {
        await voiceAIAPI.endSession(sessionId);
      } catch (err) {
        console.error('Failed to end session:', err);
      }
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window && preferences?.auto_response_enabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = preferences.preferred_language || 'en';
      utterance.rate = preferences.speech_rate || 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (response && !isProcessing) {
      speak(response);
    }
  }, [response, isProcessing]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Voice Assistant</h3>
        {preferences && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{preferences.preferred_language.toUpperCase()}</span>
            <span>•</span>
            <span>{preferences.voice_gender}</span>
          </div>
        )}
      </div>

      {/* Voice Status */}
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-600 mb-1">You said:</p>
          <p className="text-gray-800">{transcript}</p>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-600 mb-1">Assistant:</p>
          <p className="text-gray-800">{response}</p>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span>Processing...</span>
        </div>
      )}

      {/* Status */}
      <div className="text-center text-sm text-gray-500 mt-4">
        {isListening ? (
          <span className="text-red-600 font-medium">Listening...</span>
        ) : (
          <span>Tap the microphone to start speaking</span>
        )}
      </div>

      {/* Quick Commands */}
      <div className="mt-6 pt-6 border-t">
        <p className="text-sm font-medium text-gray-700 mb-3">Try saying:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => processVoiceCommand('Search for organic rice')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
          >
            "Search for organic rice"
          </button>
          <button
            onClick={() => processVoiceCommand('Show my orders')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
          >
            "Show my orders"
          </button>
          <button
            onClick={() => processVoiceCommand('What is the price of basmati rice')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
          >
            "What is the price of basmati rice"
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
