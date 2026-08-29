import React, { useState } from 'react';
import { authAPI } from '../../services/api';

/**
 * AI Chat Component
 * Unified AI chat interface with multiple agents
 */
export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('farmer-advisor');
  const [loading, setLoading] = useState(false);

  const agents = [
    { id: 'farmer-advisor', name: 'Farmer Advisor', icon: '🌾' },
    { id: 'business-analyst', name: 'Business Analyst', icon: '📊' },
    { id: 'operations-manager', name: 'Operations Manager', icon: '⚙️' },
    { id: 'governance-agent', name: 'Governance Agent', icon: '🛡️' }
  ];

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await authAPI.post('/ai/unified', {
        requestType: 'conversational',
        query: input,
        agentPreference: selectedAgent
      });

      const aiMessage = { 
        role: 'assistant', 
        content: response.data.data.response,
        agent: response.data.data.agent
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded"
          >
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.icon} {agent.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-6xl mb-4">🤖</div>
            <p>Start a conversation with the AI assistant</p>
            <p className="text-sm mt-2">Select an agent and ask your question</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {message.agent && (
                    <div className="text-xs text-gray-500 mb-1">
                      {agents.find(a => a.id === message.agent)?.name}
                    </div>
                  )}
                  <p>{message.content}</p>
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
          </div>
        )}
      </div>

      <div className="bg-white border-t p-4">
        <div className="flex space-x-2">
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
  );
}
