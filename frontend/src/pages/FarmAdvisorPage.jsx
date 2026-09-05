import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { farmersAPI } from '../services/api';
import { Send, Bot, User, Clock, AlertTriangle, Lightbulb, Sparkles, Sprout, Droplets, DollarSign } from 'lucide-react';

function FarmAdvisorPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m your AI Farm Advisor. I can help you with crop selection, pest management, irrigation planning, market prices, and more. What would you like to know today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: advisoryContext } = useQuery({
    queryKey: ['advisory-context'],
    queryFn: () => farmersAPI.getAdvisoryContext('current-farmer-id').then(r => r.data),
  });

  const { data: quickQuestions } = useQuery({
    queryKey: ['quick-questions'],
    queryFn: () => farmersAPI.getQuickQuestions().then(r => r.data),
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        role: 'assistant',
        content: generateAIResponse(inputMessage, advisoryContext),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (query, context) => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('pest') || lowerQuery.includes('disease')) {
      return 'Based on current weather conditions in your region, I recommend monitoring for leaf blight and stem rot. Consider applying organic neem-based pesticides as a preventive measure. Would you like specific product recommendations?';
    } else if (lowerQuery.includes('water') || lowerQuery.includes('irrigation')) {
      return 'With the upcoming rainfall prediction, I suggest reducing irrigation frequency by 30% over the next week. Monitor soil moisture levels and maintain drainage to prevent waterlogging.';
    } else if (lowerQuery.includes('price') || lowerQuery.includes('market')) {
      return 'Current market trends show rice prices up by 5% and wheat stable. For your region, I recommend selling rice within the next 2 weeks to capitalize on the current upward trend.';
    } else if (lowerQuery.includes('fertilizer')) {
      return 'Based on your soil analysis, I recommend applying a balanced NPK fertilizer (10-26-26) at 50kg per hectare. Consider split application - half now and half in 3 weeks for optimal absorption.';
    } else {
      return `I understand you're asking about ${ query }. To give you the most accurate advice, could you provide more details about your specific situation, such as your crop type, current growth stage, or any particular concerns you're noticing?`;
    }
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Bot className="w-8 h-8 mr-3 text-green-600" />
            AI Farm Advisor
          </h1>
          <p className="text-gray-600">Get personalized agricultural advice powered by AI</p>
        </div>

        {/* Advisory Context Banner */}
        {advisoryContext && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Sparkles className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
              <div>
                <div className="font-medium text-green-800 mb-1">Context-Aware Advice</div>
                <div className="text-sm text-green-700">
                  I'm aware of your location ({advisoryContext.location}), current crops ({advisoryContext.crops?.join(', ')}),
                  and soil type ({advisoryContext.soil_type}). All advice is personalized to your situation.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user' ?
                      'bg-green-600 text-white' :
                      'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start mb-2">
                    {message.role === 'assistant' ? (
                      <Bot className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                    ) : (
                      <User className="w-5 h-5 mr-2 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">
                        {message.role === 'assistant' ? 'Farm Advisor' : 'You'}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                  <div className={`text-xs mt-2 flex items-center ${
                    message.role === 'user' ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div className="border-t p-4">
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-2">Quick Questions:</div>
              <div className="flex flex-wrap gap-2">
                {quickQuestions?.slice(0, 4).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
                  >
                    {question}
                  </button>
                )) || (
                  <>
                    <button
                      onClick={() => handleQuickQuestion('What pests should I watch for this season?')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
                    >
                      Pest warnings
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('How should I adjust irrigation for current weather?')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
                    >
                      Irrigation advice
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('What are the current market prices for my crops?')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
                    >
                      Market prices
                    </button>
                    <button
                      onClick={() => handleQuickQuestion('What fertilizer should I use now?')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
                    >
                      Fertilizer guide
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="flex space-x-3">
              <input aria-label="Text"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about farming..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Advisory Categories */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: AlertTriangle, title: 'Pest Management', color: 'red' },
            { icon: Droplets, title: 'Irrigation', color: 'blue' },
            { icon: DollarSign, title: 'Market Prices', color: 'green' },
            { icon: Sprout, title: 'Crop Health', color: 'emerald' },
          ].map((category) => (
            <button
              key={category.title}
              className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-center"
            >
              <category.icon className={`w-8 h-8 mx-auto mb-2 text-${category.color}-600`} />
              <div className="font-medium text-gray-800 text-sm">{category.title}</div>
            </button>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Lightbulb className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <div className="font-medium text-blue-800 mb-1">Tips for Better Advice</div>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Be specific about your crop variety and growth stage</li>
                <li>• Mention any symptoms or changes you've observed</li>
                <li>• Include information about recent weather in your area</li>
                <li>• Ask follow-up questions to dive deeper into topics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmAdvisorPage;
