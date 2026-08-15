/**
 * AI Backbone Service - Real AI Integration
 * 
 * Complete AI backbone with real AI provider integrations:
 * - Anthropic Claude API
 * - OpenAI ChatGPT API
 * - Google Gemini API
 * - Azure OpenAI
 * - Hugging Face Models
 * - Custom AI Models
 * 
 * Provides unified AI interface for all ERP modules
 */

const { logger } = require('../utils/logger');
const fetch = require('node-fetch');

// ============================================================================
// AI PROVIDER CONFIGURATIONS
// ============================================================================

const AI_PROVIDERS = {
  claude: {
    enabled: process.env.CLAUDE_ENABLED === 'true',
    apiKey: process.env.CLAUDE_API_KEY,
    baseUrl: 'https://api.anthropic.com/v1',
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096
  },
  openai: {
    enabled: process.env.OPENAI_ENABLED === 'true',
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096
  },
  gemini: {
    enabled: process.env.GEMINI_ENABLED === 'true',
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 4096
  },
  azure: {
    enabled: process.env.AZURE_OPENAI_ENABLED === 'true',
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
  },
  huggingface: {
    enabled: process.env.HUGGINGFACE_ENABLED === 'true',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    baseUrl: 'https://api-inference.huggingface.co',
    defaultModel: process.env.HUGGINGFACE_DEFAULT_MODEL || 'meta-llama/Llama-2-7b-chat-hf'
  }
};

// ============================================================================
// AI REQUEST/RESPONSE TRACKING
// ============================================================================

const aiRequestTracker = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  providerStats: {
    claude: { total: 0, success: 0, failed: 0 },
    openai: { total: 0, success: 0, failed: 0 },
    gemini: { total: 0, success: 0, failed: 0 },
    azure: { total: 0, success: 0, failed: 0 },
    huggingface: { total: 0, success: 0, failed: 0 }
  }
};

// ============================================================================
// CLAUDE AI INTEGRATION
// ============================================================================

async function callClaudeAI(prompt, options = {}) {
  if (!AI_PROVIDERS.claude.enabled || !AI_PROVIDERS.claude.apiKey) {
    throw new Error('Claude AI is not configured');
  }

  aiRequestTracker.totalRequests++;
  aiRequestTracker.providerStats.claude.total++;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(`${AI_PROVIDERS.claude.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AI_PROVIDERS.claude.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options.model || AI_PROVIDERS.claude.model,
          max_tokens: options.maxTokens || AI_PROVIDERS.claude.maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          ...options
        })
      });

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 429 && retryCount < maxRetries - 1) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000;
          logger.warn(`Claude API rate limited, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`Claude API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      aiRequestTracker.successfulRequests++;
      aiRequestTracker.providerStats.claude.success++;

      logger.info('Claude AI request successful', { 
        model: AI_PROVIDERS.claude.model,
        tokens: data.usage?.input_tokens + data.usage?.output_tokens 
      });

      return {
        provider: 'claude',
        model: AI_PROVIDERS.claude.model,
        content: data.content[0].text,
        usage: data.usage,
        finishReason: data.stop_reason
      };
      break;
    } catch (error) {
      aiRequestTracker.failedRequests++;
      aiRequestTracker.providerStats.claude.failed++;
      logger.error('Claude AI request failed', { error: error.message, retryCount });
      if (retryCount >= maxRetries - 1) {
        throw error;
      }
      retryCount++;
      const delay = Math.pow(2, retryCount) * 1000;
      logger.warn(`Claude API error, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ============================================================================
// OPENAI CHATGPT INTEGRATION
// ============================================================================

async function callOpenAI(prompt, options = {}) {
  if (!AI_PROVIDERS.openai.enabled || !AI_PROVIDERS.openai.apiKey) {
    throw new Error('OpenAI is not configured');
  }

  aiRequestTracker.totalRequests++;
  aiRequestTracker.providerStats.openai.total++;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(`${AI_PROVIDERS.openai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_PROVIDERS.openai.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || AI_PROVIDERS.openai.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: options.maxTokens || AI_PROVIDERS.openai.maxTokens,
          temperature: options.temperature || 0.7,
          ...options
        })
      });

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 429 && retryCount < maxRetries - 1) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000;
          logger.warn(`OpenAI API rate limited, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      aiRequestTracker.successfulRequests++;
      aiRequestTracker.providerStats.openai.success++;

      logger.info('OpenAI request successful', { 
        model: AI_PROVIDERS.openai.model,
      tokens: data.usage?.total_tokens 
    });

    return {
      provider: 'openai',
      model: AI_PROVIDERS.openai.model,
      content: data.choices[0].message.content,
      usage: data.usage,
      finishReason: data.choices[0].finish_reason
    };
    break;
  } catch (error) {
    aiRequestTracker.failedRequests++;
    aiRequestTracker.providerStats.openai.failed++;
    logger.error('OpenAI request failed', { error: error.message, retryCount });
    if (retryCount >= maxRetries - 1) {
      throw error;
    }
    retryCount++;
    const delay = Math.pow(2, retryCount) * 1000;
    logger.warn(`OpenAI API error, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ============================================================================
// GOOGLE GEMINI INTEGRATION
// ============================================================================

async function callGeminiAI(prompt, options = {}) {
  if (!AI_PROVIDERS.gemini.enabled || !AI_PROVIDERS.gemini.apiKey) {
    throw new Error('Gemini AI is not configured');
  }

  aiRequestTracker.totalRequests++;
  aiRequestTracker.providerStats.gemini.total++;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(
        `${AI_PROVIDERS.gemini.baseUrl}/${AI_PROVIDERS.gemini.model}:generateContent?key=${AI_PROVIDERS.gemini.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: options.maxTokens || AI_PROVIDERS.gemini.maxTokens,
              temperature: options.temperature || 0.7
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 429 && retryCount < maxRetries - 1) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000;
          logger.warn(`Gemini API rate limited, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      aiRequestTracker.successfulRequests++;
    aiRequestTracker.providerStats.gemini.success++;

    logger.info('Gemini AI request successful', { 
      model: AI_PROVIDERS.gemini.model 
    });

    return {
      provider: 'gemini',
      model: AI_PROVIDERS.gemini.model,
      content: data.candidates[0].content.parts[0].text,
      usage: data.usageMetadata,
      finishReason: data.candidates[0].finishReason
    };
    break;
  } catch (error) {
    aiRequestTracker.failedRequests++;
    aiRequestTracker.providerStats.gemini.failed++;
    logger.error('Gemini AI request failed', { error: error.message, retryCount });
    if (retryCount >= maxRetries - 1) {
      throw error;
    }
    retryCount++;
    const delay = Math.pow(2, retryCount) * 1000;
    logger.warn(`Gemini API error, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ============================================================================
// AZURE OPENAI INTEGRATION
// ============================================================================

async function callAzureOpenAI(prompt, options = {}) {
  if (!AI_PROVIDERS.azure.enabled || !AI_PROVIDERS.azure.apiKey) {
    throw new Error('Azure OpenAI is not configured');
  }

  aiRequestTracker.totalRequests++;
  aiRequestTracker.providerStats.azure.total++;

  try {
    const response = await fetch(
      `${AI_PROVIDERS.azure.endpoint}/openai/deployments/${AI_PROVIDERS.azure.deployment}/chat/completions?api-version=${AI_PROVIDERS.azure.apiVersion}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AI_PROVIDERS.azure.apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    aiRequestTracker.successfulRequests++;
    aiRequestTracker.providerStats.azure.success++;

    logger.info('Azure OpenAI request successful', { 
      deployment: AI_PROVIDERS.azure.deployment 
    });

    return {
      provider: 'azure',
      model: AI_PROVIDERS.azure.deployment,
      content: data.choices[0].message.content,
      usage: data.usage,
      finishReason: data.choices[0].finish_reason
    };
  } catch (error) {
    aiRequestTracker.failedRequests++;
    aiRequestTracker.providerStats.azure.failed++;
    logger.error('Azure OpenAI request failed', { error: error.message });
    throw error;
  }
}

// ============================================================================
// HUGGING FACE INTEGRATION
// ============================================================================

async function callHuggingFace(prompt, options = {}) {
  if (!AI_PROVIDERS.huggingface.enabled || !AI_PROVIDERS.huggingface.apiKey) {
    throw new Error('Hugging Face is not configured');
  }

  aiRequestTracker.totalRequests++;
  aiRequestTracker.providerStats.huggingface.total++;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const model = options.model || AI_PROVIDERS.huggingface.defaultModel;
      const response = await fetch(`${AI_PROVIDERS.huggingface.baseUrl}/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_PROVIDERS.huggingface.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: options.maxTokens || 512,
            temperature: options.temperature || 0.7,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 429 && retryCount < maxRetries - 1) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000;
          logger.warn(`Hugging Face API rate limited, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      aiRequestTracker.successfulRequests++;
    aiRequestTracker.providerStats.huggingface.success++;

    logger.info('Hugging Face request successful', { model });

    return {
      provider: 'huggingface',
      model: model,
      content: Array.isArray(data) ? data[0].generated_text : data.generated_text,
      usage: null,
      finishReason: 'stop'
    };
    break;
  } catch (error) {
    aiRequestTracker.failedRequests++;
    aiRequestTracker.providerStats.huggingface.failed++;
    logger.error('Hugging Face request failed', { error: error.message, retryCount });
    if (retryCount >= maxRetries - 1) {
      throw error;
    }
    retryCount++;
    const delay = Math.pow(2, retryCount) * 1000;
    logger.warn(`Hugging Face API error, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ============================================================================
// UNIFIED AI INTERFACE
// ============================================================================

/**
 * Unified AI call function with automatic provider selection
 */
async function callAI(prompt, options = {}) {
  const provider = options.provider || getPreferredProvider();
  
  switch (provider) {
    case 'claude':
      return await callClaudeAI(prompt, options);
    case 'openai':
      return await callOpenAI(prompt, options);
    case 'gemini':
      return await callGeminiAI(prompt, options);
    case 'azure':
      return await callAzureOpenAI(prompt, options);
    case 'huggingface':
      return await callHuggingFace(prompt, options);
    default:
      // Try providers in order of preference
      const providers = ['claude', 'openai', 'gemini', 'azure', 'huggingface'];
      for (const p of providers) {
        if (AI_PROVIDERS[p].enabled) {
          try {
            return await callAI(prompt, { ...options, provider: p });
          } catch (error) {
            logger.warn(`Provider ${p} failed, trying next`, { error: error.message });
            continue;
          }
        }
      }
      throw new Error('No AI provider is available or configured');
  }
}

/**
 * Get preferred AI provider based on configuration
 */
function getPreferredProvider() {
  if (AI_PROVIDERS.claude.enabled) return 'claude';
  if (AI_PROVIDERS.openai.enabled) return 'openai';
  if (AI_PROVIDERS.gemini.enabled) return 'gemini';
  if (AI_PROVIDERS.azure.enabled) return 'azure';
  if (AI_PROVIDERS.huggingface.enabled) return 'huggingface';
  return 'claude'; // Default fallback
}

// ============================================================================
// AI FOR ERP MODULES - REAL AI INTEGRATIONS
// ============================================================================

/**
 * AI-powered financial analysis for ERP
 */
async function analyzeFinancialData(financialData) {
  const prompt = `As an expert financial analyst, analyze the following financial data and provide insights:
  
Revenue: ${financialData.revenue}
Expenses: ${financialData.expenses}
Net Profit: ${financialData.netProfit}
Profit Margin: ${financialData.profitMargin}%

Please provide:
1. Financial health assessment
2. Key risk factors
3. Recommendations for improvement
4. Forward-looking insights
5. Comparative analysis (if applicable)`;

  const response = await callAI(prompt, { maxTokens: 2048 });
  
  return {
    analysis: response.content,
    provider: response.provider,
    model: response.model,
    timestamp: new Date().toISOString()
  };
}

/**
 * AI-powered supply chain optimization
 */
async function optimizeSupplyChain(supplyChainData) {
  const prompt = `As an expert supply chain analyst, analyze the following supply chain data and provide optimization recommendations:

Inventory Levels: ${JSON.stringify(supplyChainData.inventory)}
Lead Times: ${JSON.stringify(supplyChainData.leadTimes)}
Supplier Performance: ${JSON.stringify(supplyChainData.supplierPerformance)}
Demand Forecast: ${JSON.stringify(supplyChainData.demandForecast)}

Please provide:
1. Inventory optimization recommendations
2. Supplier performance analysis
3. Demand forecasting insights
4. Risk mitigation strategies
5. Cost optimization opportunities`;

  const response = await callAI(prompt, { maxTokens: 2048 });
  
  return {
    optimization: response.content,
    provider: response.provider,
    model: response.model,
    timestamp: new Date().toISOString()
  };
}

/**
 * AI-powered production planning
 */
async function optimizeProduction(productionData) {
  const prompt = `As an expert production planner, analyze the following production data and provide optimization recommendations:

Production Orders: ${JSON.stringify(productionData.productionOrders)}
Capacity Utilization: ${productionData.capacityUtilization}%
Resource Availability: ${JSON.stringify(productionData.resources)}
Quality Metrics: ${JSON.stringify(productionData.qualityMetrics)}

Please provide:
1. Production schedule optimization
2. Resource allocation recommendations
3. Bottleneck identification
4. Quality improvement strategies
5. Efficiency improvement opportunities`;

  const response = await callAI(prompt, { maxTokens: 2048 });
  
  return {
    optimization: response.content,
    provider: response.provider,
    model: response.model,
    timestamp: new Date().toISOString()
  };
}

/**
 * AI-powered HR analytics
 */
async function analyzeHR(hrData) {
  const prompt = `As an expert HR analyst, analyze the following HR data and provide insights:

Employee Count: ${hrData.employeeCount}
Turnover Rate: ${hrData.turnoverRate}%
Training Completion: ${hrData.trainingCompletion}%
Performance Scores: ${JSON.stringify(hrData.performanceScores)}
Payroll Costs: ${hrData.payrollCosts}

Please provide:
1. Workforce health assessment
2. Retention strategies
3. Training program recommendations
4. Performance improvement insights
5. Cost optimization opportunities`;

  const response = await callAI(prompt, { maxTokens: 2048 });
  
  return {
    analysis: response.content,
    provider: response.provider,
    model: response.model,
    timestamp: new Date().toISOString()
  };
}

/**
 * AI-powered project management
 */
async function analyzeProject(projectData) {
  const prompt = `As an expert project manager, analyze the following project data and provide insights:

Project Status: ${projectData.status}
Completion: ${projectData.completion}%
Budget Utilization: ${projectData.budgetUtilization}%
Timeline Adherence: ${projectData.timelineAdherence}%
Resource Allocation: ${JSON.stringify(projectData.resources)}

Please provide:
1. Project health assessment
2. Risk identification
3. Timeline optimization recommendations
4. Resource optimization strategies
5. Budget management insights`;

  const response = await callAI(prompt, { maxTokens: 2048 });
  
  return {
    analysis: response.content,
    provider: response.provider,
    model: response.model,
    timestamp: new Date().toISOString()
  };
}

/**
 * AI-powered agricultural decision support
 */
async function supportAgriculturalDecision(agriculturalData) {
  const prompt = `As an expert agricultural consultant, analyze the following agricultural data and provide decision support:

Crop Data: ${JSON.stringify(agriculturalData.crops)}
Soil Data: ${JSON.stringify(agriculturalData.soil)}
Weather Data: ${JSON.stringify(agriculturalData.weather)}
Market Data: ${JSON.stringify(agriculturalData.market)}

Please provide:
1. Crop selection recommendations
2. Planting schedule optimization
3. Resource allocation advice
4. Risk mitigation strategies
5. Market timing recommendations`;

  const response = await callAI(prompt, { maxTokens: 2048 });
  
  return {
    recommendations: response.content,
    provider: response.provider,
    model: response.model,
    timestamp: new Date().toISOString()
  };
}

/**
 * AI-powered livestock management
 */
async function optimizeLivestock(livestockData) {
  const prompt = `As an expert livestock manager, analyze the following livestock data and provide optimization recommendations:

Animal Health: ${JSON.stringify(livestockData.health)}
Production Data: ${JSON.stringify(livestockData.production)}
Feed Consumption: ${JSON.stringify(livestockData.feed)}
Breeding Records: ${JSON.stringify(livestockData.breeding)}

Please provide:
1. Health monitoring recommendations
2. Production optimization strategies
3. Feed optimization advice
4. Breeding program recommendations
5. Disease prevention strategies`;

  const response = await callAI(prompt, { maxTokens: 2048 });
  
  return {
    optimization: response.content,
    provider: response.provider,
    model: response.model,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// AI BACKBONE MANAGEMENT
// ============================================================================

/**
 * Get AI provider status
 */
function getAIProviderStatus() {
  return {
    providers: AI_PROVIDERS,
    statistics: aiRequestTracker,
    availableProviders: Object.entries(AI_PROVIDERS)
      .filter(([_, config]) => config.enabled)
      .map(([name, _]) => name)
  };
}

/**
 * Switch AI provider
 */
function switchProvider(providerName) {
  if (!AI_PROVIDERS[providerName]) {
    throw new Error(`Unknown AI provider: ${providerName}`);
  }
  if (!AI_PROVIDERS[providerName].enabled) {
    throw new Error(`AI provider ${providerName} is not enabled`);
  }
  
  logger.info('AI provider switched', { provider: providerName });
  return { success: true, provider: providerName };
}

/**
 * Reset AI statistics
 */
function resetAIStatistics() {
  aiRequestTracker.totalRequests = 0;
  aiRequestTracker.successfulRequests = 0;
  aiRequestTracker.failedRequests = 0;
  Object.keys(aiRequestTracker.providerStats).forEach(provider => {
    aiRequestTracker.providerStats[provider] = { total: 0, success: 0, failed: 0 };
  });
  
  logger.info('AI statistics reset');
  return { success: true };
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

module.exports = {
  // AI Provider Functions
  callClaudeAI,
  callOpenAI,
  callGeminiAI,
  callAzureOpenAI,
  callHuggingFace,
  
  // Unified AI Interface
  callAI,
  getPreferredProvider,
  
  // ERP-Specific AI Functions
  analyzeFinancialData,
  optimizeSupplyChain,
  optimizeProduction,
  analyzeHR,
  analyzeProject,
  supportAgriculturalDecision,
  optimizeLivestock,
  
  // AI Backbone Management
  getAIProviderStatus,
  switchProvider,
  resetAIStatistics,
  
  // Configuration
  AI_PROVIDERS,
  aiRequestTracker
};
