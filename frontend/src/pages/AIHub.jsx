/**
 * UNIFIED AI HUB DASHBOARD
 * Central dashboard for all 12+ AI specialized services
 */

import React, { useEffect, useState } from 'react';
import './AIHub.css';

const AIHubDashboard = () => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('agricultural');
  const [selectedCapability, setSelectedCapability] = useState('crop_recommendation');
  const [inputData, setInputData] = useState('{}');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/v1/ai-modules/registry');
      const data = await response.json();
      setModules(data.modules || []);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      setError(error.message);
    }
  };

  const getCurrentModule = () => {
    return modules.find(m => m.name === selectedModule || m.moduleId === selectedModule);
  };

  const handleProcessRequest = async () => {
    if (!selectedModule || !selectedCapability || !inputData) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = JSON.parse(inputData);
      
      const response = await fetch('/api/v1/ai-modules/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: selectedModule,
          capability: selectedCapability,
          data,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setResult(result);
      } else {
        setError(result.error || 'Request failed');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const moduleInfo = {
    agricultural: {
      icon: '🌾',
      title: 'Agricultural AI',
      description: 'Crop and livestock management intelligence',
    },
    predictive: {
      icon: '📊',
      title: 'Predictive Analytics',
      description: 'Forecasting and trend analysis',
    },
    chat: {
      icon: '💬',
      title: 'Conversational AI',
      description: 'Farmer support chatbot',
    },
    veterinary: {
      icon: '🐾',
      title: 'Veterinary Decision Support',
      description: 'Animal-health triage and professional-review support',
    },
    chef: {
      icon: '👨‍🍳',
      title: 'AI Master Chef',
      description: 'Recipe generation and meal planning',
    },
    nutrition: {
      icon: '🥗',
      title: 'AI Nutritionist',
      description: 'Personalized nutrition planning',
    },
    image: {
      icon: '🎨',
      title: 'AI Image Maker',
      description: 'Image generation and design',
    },
    script: {
      icon: '📝',
      title: 'AI Script Writer',
      description: 'Story and content generation',
    },
    disease_analyzer: {
      icon: '🔬',
      title: 'AI Disease Analyzer',
      description: 'Plant disease identification and solutions',
    },
    cartoon: {
      icon: '🎭',
      title: 'AI Cartoon Maker',
      description: 'Cartoon character and animation',
    },
    prescription: {
      icon: '💊',
      title: 'Clinical Coding Assistant',
      description: 'Review-only coding and documentation support',
    },
    farmer_support: {
      icon: '👨‍🌾',
      title: 'AI Farmer Support',
      description: 'Comprehensive farming guidance',
    },
  };

  const currentModule = moduleInfo[selectedModule] || {
    icon: '🤖',
    title: 'AI Module',
    description: 'AI Service',
  };

  const current = getCurrentModule();
  const capabilities = current?.capabilities || [];

  return (
    <div className="ai-hub-dashboard">
      <header className="hub-header">
        <h1>🤖 EBDESIGN AI HUB</h1>
        <p>Unified AI Services for All Your Needs</p>
      </header>

      <div className="hub-container">
        {/* Module Selection */}
        <section className="module-selector">
          <h2>Select AI Service</h2>
          <div className="module-grid">
            {modules.map(module => (
              <div
                key={module.name}
                className={`module-card ${selectedModule === module.name ? 'active' : ''}`}
                onClick={() => {
                  setSelectedModule(module.name);
                  setSelectedCapability(module.capabilities[0]);
                }}
              >
                <div className="module-icon">{moduleInfo[module.name]?.icon || '🤖'}</div>
                <div className="module-name">{moduleInfo[module.name]?.title || module.name}</div>
                <div className="module-count">{module.capabilities.length} capabilities</div>
              </div>
            ))}
          </div>
        </section>

        {/* Processor Panel */}
        <section className="processor-panel">
          <div className="panel-header">
            <span className="icon">{currentModule.icon}</span>
            <div>
              <h2>{currentModule.title}</h2>
              <p>{currentModule.description}</p>
            </div>
          </div>

          <div className="processor-content">
            {/* Capability Selection */}
            <div className="field-group">
              <label>Capability</label>
              <select
                value={selectedCapability}
                onChange={(e) => setSelectedCapability(e.target.value)}
              >
                {capabilities.map(cap => (
                  <option key={cap} value={cap}>
                    {cap.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Data */}
            <div className="field-group">
              <label>Input Data (JSON)</label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                rows="8"
                placeholder='{"key": "value"}'
              />
            </div>

            {/* Button */}
            <button
              className="process-button"
              onClick={handleProcessRequest}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '▶️ Process Request'}
            </button>

            {/* Error Display */}
            {error && (
              <div className="error-box">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className="result-box">
                <h3>✅ Result</h3>
                <div className="result-content">
                  <div className="result-item">
                    <span className="label">Module:</span>
                    <span className="value">{result.moduleId}</span>
                  </div>
                  <div className="result-item">
                    <span className="label">Capability:</span>
                    <span className="value">{result.capability}</span>
                  </div>
                  <div className="result-item">
                    <span className="label">Response:</span>
                    <p className="value-text">{result.result}</p>
                  </div>
                  {result.duration && (
                    <div className="result-item">
                      <span className="label">Processing Time:</span>
                      <span className="value">{result.duration}ms</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Examples */}
        <section className="examples-section">
          <h2>📚 Quick Examples</h2>
          <div className="examples-grid">
            <div className="example-card">
              <h4>🌾 Crop Recommendation</h4>
              <code>{`{
  "soil": "loamy",
  "climate": "tropical",
  "budget": 50000
}`}</code>
            </div>
            <div className="example-card">
              <h4>🐾 Animal Diagnosis</h4>
              <code>{`{
  "animalType": "chicken",
  "symptoms": ["lethargy", "diarrhea"],
  "duration": "3 days"
}`}</code>
            </div>
            <div className="example-card">
              <h4>👨‍🍳 Recipe Generation</h4>
              <code>{`{
  "ingredients": ["rice", "chicken", "tomato"],
  "servings": 4,
  "prepTime": 30
}`}</code>
            </div>
            <div className="example-card">
              <h4>🔬 Disease Detection</h4>
              <code>{`{
  "plantType": "rice",
  "symptoms": ["yellow_spots"],
  "location": "leaf"
}`}</code>
            </div>
          </div>
        </section>
      </div>

      <footer className="hub-footer">
        <p>EBDESIGN AI Hub | Powered by Claude, OpenAI, and Multi-Provider AI</p>
      </footer>
    </div>
  );
};

export default AIHubDashboard;
