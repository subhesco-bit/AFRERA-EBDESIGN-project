import React, { useState, useEffect, useRef } from 'react';

/**
 * Chat Interface Component
 * AI-powered conversational interface for user assistance
 */
const ChatInterface = ({ domain = 'General', language = 'en' }) => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeSession();
  }, [domain, language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/v1/conversational-ai/domains');
      const domains = await response.json();
      const selectedDomain = domains.find(d => d.name === domain) || domains[0];

      const sessionResponse = await fetch('/api/v1/conversational-ai/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          domain_id: selectedDomain?.id,
          language
        })
      });

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        setSessionId(sessionData.id);
        
        // Add welcome message
        setMessages([{
          role: 'assistant',
          content: `Hello! I'm your ${domain} assistant. How can I help you today?`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !sessionId) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add user message
    const newMessages = [...messages, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }];
    setMessages(newMessages);

    try {
      setIsTyping(true);

      const response = await fetch(`/api/v1/conversational-ai/sessions/${sessionId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          message: userMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: data.content,
            timestamp: new Date(),
            intent: data.intent,
            confidence: data.confidence
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const endConversation = async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/v1/conversational-ai/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          resolution_status: 'resolved'
        })
      });
      setSessionId(null);
      setMessages([]);
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">{domain} Assistant</h3>
            <p className="text-xs text-blue-100">AI-powered support</p>
          </div>
        </div>
        {sessionId && (
          <button
            onClick={endConversation}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
          >
            End Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.intent && (
                <p className="text-xs mt-1 opacity-70">
                  Intent: {message.intent} ({(message.confidence * 100).toFixed(0)}%)
                </p>
              )}
              <p className="text-xs mt-2 opacity-60">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <input aria-label="Text"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading || !sessionId}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim() || !sessionId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
