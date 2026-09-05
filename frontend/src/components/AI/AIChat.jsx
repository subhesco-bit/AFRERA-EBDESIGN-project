import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/componentApi';

/**
 * AI Chat Component
 * Unified AI chat interface with multiple agents and decision-making capabilities
 * Enhanced with voice input, attachments, context panel, and AI decision-making
 */
export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('farmer-advisor');
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [context, setContext] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [decision, setDecision] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const agents = [
    { id: 'farmer-advisor', name: 'Farmer Advisor', icon: '🌾', specialty: 'Crop planning, weather, farming best practices' },
    { id: 'business-analyst', name: 'Business Analyst', icon: '📊', specialty: 'Market trends, pricing, financial analysis' },
    { id: 'operations-manager', name: 'Operations Manager', icon: '⚙️', specialty: 'Logistics, inventory, supply chain' },
    { id: 'governance-agent', name: 'Governance Agent', icon: '🛡️', specialty: 'Compliance, risk management, policy' },
  ];

  const QUICK_SUGGESTIONS = [
    'What crops should I plant this season?',
    'Analyze current market prices',
    'Optimize my inventory levels',
    'Check compliance status',
    'Forecast demand for next month',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const _loadChatHistory = async () => {
    try {
      const response = await api.get('/ai/chat/history');
      setChatHistory(response.data.data || []);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      attachments,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setLoading(true);

    try {
      let response = await api.post('/ai/unified', {
        requestType: 'conversational',
        query: userMessage.content,
        agentPreference: selectedAgent,
        context,
        attachments,
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.data.response,
        agent: response.data.data.agent,
        metadata: response.data.data.metadata,
        decision: response.data.data.decision,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setContext(response.data.data.context);
      setDecision(response.data.data.decision);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    setVoiceActive(!voiceActive);
    // Voice input implementation
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    sendMessage();
  };

  const handleDecisionAction = async (action) => {
    try {
      await api.post('/ai/decision/execute', {
        decision_id: decision.id,
        action,
      });
      alert(`Action "${action}" executed successfully`);
    } catch (err) {
      console.error('Failed to execute decision:', err);
      alert('Failed to execute action');
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[85vh] flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
            <span className="text-sm text-gray-500">|</span>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.icon} {agent.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-gray-100 rounded"
              title="Chat History"
            >
              📜
            </button>
            <button
              onClick={() => setShowContext(!showContext)}
              className="p-2 hover:bg-gray-100 rounded"
              title="Context Panel"
            >
              📋
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {agents.find(a => a.id === selectedAgent)?.specialty}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat History Sidebar */}
        {showHistory && (
          <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Chat History</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-2">
              {chatHistory.map((session, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-700"
                >
                  <div className="font-medium">{session.title || 'New Chat'}</div>
                  <div className="text-xs text-gray-400">{new Date(session.timestamp).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-6xl mb-4">🤖</div>
                <p>Start a conversation with the AI assistant</p>
                <p className="text-sm mt-2">Select an agent and ask your question</p>
                <div className="mt-6 space-y-2">
                  {QUICK_SUGGESTIONS.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-lg ${
                        message.role === 'user' ?
                          'bg-blue-600 text-white' :
                          'bg-white border border-gray-200'
                      }`}
                    >
                      {message.agent && (
                        <div className="text-xs text-gray-500 mb-1">
                          {agents.find(a => a.id === message.agent)?.name}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 text-xs">
                          {message.attachments.map((file, idx) => (
                            <span key={idx} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1">
                              📎 {file.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {message.decision && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="font-medium text-blue-800 mb-2">🎯 AI Decision</div>
                          <div className="text-sm text-blue-700 mb-2">{message.decision.recommendation}</div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDecisionAction('approve')}
                              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecisionAction('reject')}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleDecisionAction('modify')}
                              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                            >
                              Modify
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                    <span>📎 {file.name}</span>
                    <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-red-500">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAttachmentClick}
                className="p-2 hover:bg-gray-100 rounded"
                title="Attach file"
              >
                📎
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <button
                onClick={handleVoiceInput}
                className={`p-2 rounded ${voiceActive ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}
                title="Voice input"
              >
                🎤
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Context Panel */}
        {showContext && (
          <div className="w-72 border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Context</h3>
              <button onClick={() => setShowContext(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {context ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Active Agent</div>
                  <div className="text-sm font-medium">{context.agent || selectedAgent}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Session Context</div>
                  <div className="text-sm">{context.session_id || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Decision Confidence</div>
                  <div className="text-sm">{decision?.confidence || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Data Sources</div>
                  <div className="text-sm">{context.data_sources?.length || 0} sources</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No context available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
