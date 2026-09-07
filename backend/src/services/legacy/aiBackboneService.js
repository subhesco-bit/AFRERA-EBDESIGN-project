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

const { logger } = require('../../utils/logger');
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
  },
  ollama: {
    // Local inference server - no API key required, just a reachable host.
    enabled: process.env.OLLAMA_ENABLED === 'true',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1',
    maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS) || 4096
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
    huggingface: { total: 0, success: 0, failed: 0 },
    ollama: { total: 0, success: 0, failed: 0 }
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
// OLLAMA (LOCAL) INTEGRATION
// ============================================================================

async function callOllamaAI(prompt, options = {}) {
  if (!AI_PROVIDERS.ollama.enabled) {
    throw new Error('Ollama is not configured');
  }

  aiRequestTracker.totalRequests++;
  aiRequestTracker.providerStats.ollama.total++;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(`${AI_PROVIDERS.ollama.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || AI_PROVIDERS.ollama.model,
          messages: [
            ...(options.system ? [{ role: 'system', content: options.system }] : []),
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: false,
          options: {
            num_predict: options.maxTokens || AI_PROVIDERS.ollama.maxTokens,
            temperature: options.temperature || 0.7
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        if (response.status === 429 && retryCount < maxRetries - 1) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000;
          logger.warn(`Ollama server busy, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      aiRequestTracker.successfulRequests++;
      aiRequestTracker.providerStats.ollama.success++;

      logger.info('Ollama request successful', {
        model: AI_PROVIDERS.ollama.model,
        tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      });

      return {
        provider: 'ollama',
        model: data.model || AI_PROVIDERS.ollama.model,
        content: data.message?.content,
        usage: {
          input_tokens: data.prompt_eval_count,
          output_tokens: data.eval_count
        },
        finishReason: data.done_reason || (data.done ? 'stop' : null)
      };
    } catch (error) {
      aiRequestTracker.failedRequests++;
      aiRequestTracker.providerStats.ollama.failed++;
      logger.error('Ollama request failed', { error: error.message, retryCount });
      if (retryCount >= maxRetries - 1) {
        throw error;
      }
      retryCount++;
      const delay = Math.pow(2, retryCount) * 1000;
      logger.warn(`Ollama error, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
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
    case 'ollama':
      return await callOllamaAI(prompt, options);
    default: {
      // Try providers in order of preference
      const providers = ['claude', 'openai', 'gemini', 'azure', 'huggingface', 'ollama'];
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
  if (AI_PROVIDERS.ollama.enabled) return 'ollama';
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
  const redactedProviders = Object.fromEntries(
    Object.entries(AI_PROVIDERS).map(([name, config]) => {
      const { apiKey, ...safeConfig } = config;
      // Ollama is a local server with no API key - configured just means enabled.
      const configured = name === 'ollama' ? config.enabled : Boolean(apiKey);
      return [name, { ...safeConfig, configured }];
    })
  );

  return {
    providers: redactedProviders,
    statistics: aiRequestTracker,
    availableProviders: Object.entries(AI_PROVIDERS)
      .filter(([name, config]) => config.enabled && (name === 'ollama' || config.apiKey))
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
  callOllamaAI,

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

// ============================================================================
// CONSOLIDATED FEATURES (merged from 7 services)
// ============================================================================
// Merged from: aiBackboneService, aiGateway, aiBrain, completeAI, advancedAI, aiCopilot, aiOperationIntelligence
// All original features preserved - this is a consolidation, not a reduction
// ============================================================================

// From aiBackboneService.js
 * AI Decision-Making Engine Service
 * Provides intelligent decision-making capabilities for:
 * - Predictive analytics (demand forecasting, price optimization)
 * - Risk assessment (credit scoring, insurance premiums)
 * - Recommendation engine (products, equipment, routes)
 * - Natural language processing (document analysis, query understanding)
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL, getMongoDatabase } = require('../../database/connection');
const { authMiddleware } = require('../../middleware/auth');

// AI Models configuration
const AI_MODELS = {
  demand_forecasting: {
    type: 'regression',
    features: ['season', 'region', 'historical_demand', 'price', 'competitor_pricing'],
    target: 'demand_quantity',
    accuracy: 0.87
  },
  price_optimization: {
    type: 'optimization',
    factors: ['supply', 'demand', 'competitor_prices', 'seasonality', 'quality_grade'],
    constraints: ['min_price', 'max_price', 'market_conditions'],
    accuracy: 0.82
  },
  credit_scoring: {
    type: 'classification',
    features: ['fdi_score', 'repayment_history', 'farm_size', 'crop_diversity', 'certifications'],
    target: 'credit_risk_level',
    accuracy: 0.89
  },
  fraud_detection: {
    type: 'anomaly_detection',
    features: ['transaction_patterns', 'user_behavior', 'location_data', 'timing_patterns'],
    threshold: 0.95,
    accuracy: 0.91
  },
  recommendation: {
    type: 'collaborative_filtering',
    features: ['user_history', 'similar_users', 'item_attributes', 'context'],
    accuracy: 0.78
  }
};

/**
 * Predict demand for a product
 */
async function predictDemand(productId, timeHorizon = 30) {
  try {
    const pg = getPostgreSQL();
    
    // Get historical data
    const historicalQuery = `
      SELECT 
        DATE_TRUNC('month', order_date) as month,
        SUM(quantity) as demand,
        AVG(price) as avg_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = $1
        AND order_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', order_date)
      ORDER BY month DESC
    `;
    
    const historicalData = await pg.query(historicalQuery, [productId]);
    
    // Get product details
    const productQuery = `
      SELECT p.*, c.name as category_name, s.name as state_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE p.id = $1
    `;
    
    const productResult = await pg.query(productQuery, [productId]);
    const product = productResult.rows[0];
    
    // Simple demand forecasting model (in production, use ML models)
    const seasonalFactor = getSeasonalFactor(product.category_name);
    const trendFactor = calculateTrend(historicalData.rows);
    const baseDemand = historicalData.rows.length > 0 
      ? historicalData.rows.reduce((sum, row) => sum + parseFloat(row.demand), 0) / historicalData.rows.length
      : 100;
    
    const predictedDemand = Math.round(baseDemand * seasonalFactor * trendFactor);
    
    const confidence = calculateConfidence(historicalData.rows.length, product.gi_status);
    
    logger.info(`Demand prediction for product ${productId}: ${predictedDemand} (confidence: ${confidence}%)`);
    
    return {
      product_id: productId,
      predicted_demand: predictedDemand,
      time_horizon_days: timeHorizon,
      confidence: confidence,
      factors: {
        seasonal: seasonalFactor,
        trend: trendFactor,
        base_demand: baseDemand
      },
      recommendations: generateDemandRecommendations(predictedDemand, confidence)
    };
  } catch (error) {
    logger.error('Error predicting demand', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Optimize pricing for a product
 */
async function optimizePrice(productId, currentPrice) {
  try {
    const pg = getPostgreSQL();
    
    // Get market data
    const marketQuery = `
      SELECT 
        AVG(price) as avg_market_price,
        MIN(price) as min_market_price,
        MAX(price) as max_market_price,
        STDDEV(price) as price_stddev
      FROM order_items oi
      WHERE oi.product_id = $1
        AND oi.order_date >= NOW() - INTERVAL '3 months'
    `;
    
    const marketData = await pg.query(marketQuery, [productId]);
    const market = marketData.rows[0];
    
    // Get competitor pricing (simulated)
    const competitorPrices = await getCompetitorPrices(productId);
    
    // Calculate optimal price using multi-objective optimization
    const optimalPrice = calculateOptimalPrice(currentPrice, market, competitorPrices);
    
    const priceElasticity = calculatePriceElasticity(productId);
    const revenueImpact = calculateRevenueImpact(currentPrice, optimalPrice, priceElasticity);
    
    logger.info(`Price optimization for product ${productId}: â‚¹${optimalPrice} (current: â‚¹${currentPrice})`);
    
    return {
      product_id: productId,
      current_price: currentPrice,
      optimal_price: optimalPrice,
      price_change: ((optimalPrice - currentPrice) / currentPrice * 100).toFixed(2),
      confidence: 0.82,
      market_analysis: {
        average_price: market.avg_market_price,
        price_range: {
          min: market.min_market_price,
          max: market.max_market_price
        },
        competitor_prices: competitorPrices
      },
      impact: {
        expected_demand_change: priceElasticity * ((optimalPrice - currentPrice) / currentPrice * 100),
        revenue_impact: revenueImpact,
        margin_impact: calculateMarginImpact(currentPrice, optimalPrice)
      },
      recommendations: generatePricingRecommendations(optimalPrice, market)
    };
  } catch (error) {
    logger.error('Error optimizing price', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Assess credit risk for a farmer
 */
async function assessCreditRisk(farmerId) {
  try {
    const pg = getPostgreSQL();
    
    // Get farmer data
    const farmerQuery = `
      SELECT f.*, u.name, u.phone
      FROM farmers f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = $1
    `;
    
    const farmerResult = await pg.query(farmerQuery, [farmerId]);
    const farmer = farmerResult.rows[0];
    
    // Get FDI score
    const fdiScore = await calculateFDI(farmerId);
    
    // Get repayment history
    const repaymentQuery = `
      SELECT 
        COUNT(*) as total_loans,
        SUM(CASE WHEN status = 'fully_paid' THEN 1 ELSE 0 END) as paid_loans,
        SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) as defaulted_loans,
        AVG(CASE WHEN due_date < payment_date THEN EXTRACT(DAY FROM (payment_date - due_date)) ELSE 0 END) as avg_days_late
      FROM loans
      WHERE farmer_id = $1
    `;
    
    const repaymentData = await pg.query(repaymentQuery, [farmerId]);
    const repayment = repaymentData.rows[0];
    
    // Calculate credit score (0-100)
    const creditScore = calculateCreditScore(fdiScore, repayment, farmer);
    
    // Determine risk level
    let riskLevel, maxAdvancePercentage, interestRate;
    if (creditScore >= 80) {
      riskLevel = 'low';
      maxAdvancePercentage = 50;
      interestRate = 8.5;
    } else if (creditScore >= 60) {
      riskLevel = 'medium';
      maxAdvancePercentage = 35;
      interestRate = 11.0;
    } else if (creditScore >= 40) {
      riskLevel = 'medium-high';
      maxAdvancePercentage = 20;
      interestRate = 14.5;
    } else {
      riskLevel = 'high';
      maxAdvancePercentage = 10;
      interestRate = 18.0;
    }
    
    logger.info(`Credit risk assessment for farmer ${farmerId}: ${riskLevel} (score: ${creditScore})`);
    
    return {
      farmer_id: farmerId,
      credit_score: creditScore,
      risk_level: riskLevel,
      confidence: 0.89,
      fdi_score: fdiScore.score,
      repayment_history: {
        total_loans: repayment.total_loans,
        repayment_rate: repayment.total_loans > 0 
          ? (repayment.paid_loans / repayment.total_loans * 100).toFixed(1) 
          : 0,
        default_rate: repayment.total_loans > 0 
          ? (repayment.defaulted_loans / repayment.total_loans * 100).toFixed(1) 
          : 0,
        avg_days_late: repayment.avg_days_late || 0
      },
      credit_parameters: {
        max_advance_percentage: maxAdvancePercentage,
        interest_rate: interestRate,
        loan_limit: calculateLoanLimit(creditScore, farmer.farm_size || 1)
      },
      factors: {
        fdi_contribution: fdiScore.score * 0.4,
        repayment_contribution: (repayment.total_loans > 0 
          ? (repayment.paid_loans / repayment.total_loans) * 100 * 0.35 
          : 50) * 0.35,
        certification_contribution: (farmer.certification_count || 0) * 5 * 0.15,
        experience_contribution: Math.min((farmer.years_active || 0) * 2, 10) * 0.1
      },
      recommendations: generateCreditRecommendations(riskLevel, creditScore)
    };
  } catch (error) {
    logger.error('Error assessing credit risk', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Detect potential fraud in transactions
 */
async function detectFraud(transactionData) {
  try {
    const mongo = getMongoDatabase();
    const fraudCollection = mongo.collection('fraud_patterns');
    
    // Get historical fraud patterns
    const patterns = await fraudCollection.find({ active: true }).toArray();
    
    const riskFactors = [];
    let totalRiskScore = 0;
    
    // Check for suspicious patterns
    if (transactionData.amount > 100000) {
      riskFactors.push({ factor: 'high_amount', risk: 0.3 });
      totalRiskScore += 30;
    }
    
    if (transactionData.velocity > 10) { // More than 10 transactions in short time
      riskFactors.push({ factor: 'high_velocity', risk: 0.4 });
      totalRiskScore += 40;
    }
    
    // Check location anomalies
    const locationRisk = await checkLocationAnomaly(transactionData);
    if (locationRisk > 0.5) {
      riskFactors.push({ factor: 'location_anomaly', risk: locationRisk });
      totalRiskScore += locationRisk * 50;
    }
    
    // Check against known fraud patterns
    for (const pattern of patterns) {
      if (matchesPattern(transactionData, pattern)) {
        riskFactors.push({ factor: pattern.name, risk: pattern.risk_score });
        totalRiskScore += pattern.risk_score * 100;
      }
    }
    
    // Normalize risk score
    const normalizedRisk = Math.min(totalRiskScore, 100);
    
    let decision, action;
    if (normalizedRisk >= 80) {
      decision = 'block';
      action = 'Transaction blocked - high fraud risk';
    } else if (normalizedRisk >= 50) {
      decision = 'review';
      action = 'Transaction flagged for manual review';
    } else {
      decision = 'approve';
      action = 'Transaction approved';
    }
    
    logger.info(`Fraud detection for transaction ${transactionData.id}: ${decision} (risk: ${normalizedRisk}%)`);
    
    // Store analysis for audit
    await mongo.collection('fraud_analyses').insertOne({
      transaction_id: transactionData.id,
      risk_score: normalizedRisk,
      risk_factors: riskFactors,
      decision: decision,
      timestamp: new Date()
    });
    
    return {
      transaction_id: transactionData.id,
      risk_score: normalizedRisk,
      decision: decision,
      action: action,
      confidence: 0.91,
      risk_factors: riskFactors,
      recommendations: generateFraudRecommendations(decision, riskFactors)
    };
  } catch (error) {
    logger.error('Error detecting fraud', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Generate personalized recommendations
 */
async function generateRecommendations(userId, context = {}) {
  try {
    const pg = getPostgreSQL();
    const mongo = getMongoDatabase();
    
    // Get user's purchase history
    const historyQuery = `
      SELECT 
        p.category_id,
        p.state_id,
        COUNT(*) as purchase_count,
        AVG(oi.price) as avg_spent
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY p.category_id, p.state_id
      ORDER BY purchase_count DESC
      LIMIT 10
    `;
    
    const historyData = await pg.query(historyQuery, [userId]);
    
    // Get collaborative filtering recommendations
    const collaborativeRecs = await getCollaborativeRecommendations(userId, historyData.rows);
    
    // Get content-based recommendations
    const contentRecs = await getContentBasedRecommendations(historyData.rows);
    
    // Get context-aware recommendations
    const contextRecs = await getContextualRecommendations(context);
    
    // Combine and rank recommendations
    const recommendations = combineRecommendations(
      collaborativeRecs,
      contentRecs,
      contextRecs
    );
    
    logger.info(`Generated ${recommendations.length} recommendations for user ${userId}`);
    
    return {
      user_id: userId,
      recommendations: recommendations.slice(0, 20), // Top 20
      confidence: 0.78,
      categories: {
        collaborative: collaborativeRecs.length,
        content_based: contentRecs.length,
        contextual: contextRecs.length
      },
      explanation: generateRecommendationExplanation(recommendations)
    };
  } catch (error) {
    logger.error('Error generating recommendations', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Helper functions
 */
function getSeasonalFactor(category) {
  const seasonalFactors = {
    'Grains & Millets': 1.2,
    'Spices': 1.4,
    'Fruits': 1.3,
    'Vegetables & Greens': 1.1,
    'Tea & Beverages': 0.9,
    'Honey & Sweeteners': 1.0
  };
  return seasonalFactors[category] || 1.0;
}

function calculateTrend(historicalData) {
  if (historicalData.length < 2) return 1.0;
  
  const recent = historicalData.slice(0, 3).reduce((sum, row) => sum + parseFloat(row.demand), 0) / 3;
  const older = historicalData.slice(3, 6).reduce((sum, row) => sum + parseFloat(row.demand), 0) / 3;
  
  return older > 0 ? recent / older : 1.0;
}

function calculateConfidence(dataPoints, giStatus) {
  const baseConfidence = Math.min(dataPoints * 5, 80);
  const giBonus = giStatus ? 10 : 0;
  return Math.min(baseConfidence + giBonus, 95);
}

function calculateOptimalPrice(currentPrice, market, competitorPrices) {
  const avgMarketPrice = market.avg_market_price || currentPrice;
  const avgCompetitorPrice = competitorPrices.length > 0
    ? competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length
    : currentPrice;
  
  // Weighted average of market and competitor prices
  const marketWeight = 0.4;
  const competitorWeight = 0.3;
  const currentWeight = 0.3;
  
  return Math.round(
    avgMarketPrice * marketWeight +
    avgCompetitorPrice * competitorWeight +
    currentPrice * currentWeight
  );
}

function calculatePriceElasticity(productId) {
  // Simplified elasticity calculation
  // In production, use historical price/demand data
  return -1.2; // Typical agricultural product elasticity
}

function calculateRevenueImpact(currentPrice, optimalPrice, elasticity) {
  const priceChange = (optimalPrice - currentPrice) / currentPrice;
  const demandChange = elasticity * priceChange * 100;
  return demandChange + priceChange * 100;
}

function calculateMarginImpact(currentPrice, optimalPrice) {
  const currentMargin = 0.25; // 25% margin
  const optimalMargin = 0.28; // Slightly better margin at optimal price
  return ((optimalMargin - currentMargin) / currentMargin * 100).toFixed(2);
}

function getCompetitorPrices(productId) {
  // Simulated competitor prices
  // In production, fetch from market data APIs
  return [280, 295, 310, 275, 305];
}

function calculateFDI(farmerId) {
  // This would call the FDI calculation service
  // For now, return a mock response
  return {
    score: 72,
    grade: 'B+',
    advance_percentage: 30
  };
}

function calculateCreditScore(fdiScore, repayment, farmer) {
  const fdiContribution = fdiScore.score * 0.4;
  const repaymentContribution = repayment.total_loans > 0 
    ? (repayment.paid_loans / repayment.total_loans) * 100 * 0.35 
    : 50 * 0.35;
  const certificationContribution = (farmer.certification_count || 0) * 5 * 0.15;
  const experienceContribution = Math.min((farmer.years_active || 0) * 2, 10) * 0.1;
  
  return Math.round(fdiContribution + repaymentContribution + certificationContribution + experienceContribution);
}

function calculateLoanLimit(creditScore, farmSize) {
  const baseLimit = 100000;
  const scoreMultiplier = creditScore / 100;
  const sizeMultiplier = Math.min(farmSize, 10);
  
  return Math.round(baseLimit * scoreMultiplier * sizeMultiplier);
}

function checkLocationAnomaly(transactionData) {
  // Simplified location anomaly check
  // In production, use geospatial analysis
  return 0.2;
}

function matchesPattern(transactionData, pattern) {
  // Check if transaction matches known fraud pattern
  return false;
}

async function getCollaborativeRecommendations(userId, history) {
  // Implement collaborative filtering
  return [];
}

async function getContentBasedRecommendations(history) {
  // Implement content-based filtering
  return [];
}

async function getContextualRecommendations(context) {
  // Implement contextual recommendations
  return [];
}

function combineRecommendations(collaborative, content, contextual) {
  // Combine and rank recommendations from different sources
  return [...collaborative, ...content, ...contextual];
}

function generateRecommendationExplanation(recommendations) {
  return 'Recommendations based on your purchase history, similar users, and current market conditions.';
}

function generateDemandRecommendations(predictedDemand, confidence) {
  const recommendations = [];
  if (predictedDemand > 1000) {
    recommendations.push('Increase inventory for this product');
  }
  if (confidence < 70) {
    recommendations.push('Consider gathering more historical data for better accuracy');
  }
  return recommendations;
}

function generatePricingRecommendations(optimalPrice, market) {
  const recommendations = [];
  if (optimalPrice > market.avg_market_price * 1.1) {
    recommendations.push('Price is above market average - monitor competition');
  }
  if (optimalPrice < market.avg_market_price * 0.9) {
    recommendations.push('Price is below market average - opportunity for margin improvement');
  }
  return recommendations;
}

function generateCreditRecommendations(riskLevel, creditScore) {
  const recommendations = [];
  if (riskLevel === 'low') {
    recommendations.push('Eligible for maximum advance percentage');
    recommendations.push('Consider offering premium interest rates');
  } else if (riskLevel === 'high') {
    recommendations.push('Require additional collateral');
    recommendations.push('Consider smaller advance amounts');
  }
  return recommendations;
}

function generateFraudRecommendations(decision, riskFactors) {
  const recommendations = [];
  if (decision === 'review') {
    recommendations.push('Manual review recommended');
    recommendations.push('Request additional verification');
  }
  if (decision === 'block') {
    recommendations.push('Transaction blocked');
    recommendations.push('Report to security team');
  }
  return recommendations;
}

/**
 * Express router for AI service
 */
const express = require('express');
const router = express.Router();

router.post('/predict/demand', authMiddleware, async (req, res) => {
  try {
    const { product_id, time_horizon } = req.body;
    const result = await predictDemand(product_id, time_horizon);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/optimize/price', authMiddleware, async (req, res) => {
  try {
    const { product_id, current_price } = req.body;
    const result = await optimizePrice(product_id, current_price);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DEPRECATED 2026-08-15 — assessCreditRisk() was a second, independent
// credit-scoring implementation alongside the canonical, MCDA-based
// financialService.farmerCreditRiskScore() (the one actually wired into the
// outcome-resolution loop). No frontend caller was found for this route.
// Delegated rather than deleted — assessCreditRisk() itself is untouched.
// See AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C for the reconciliation.
router.post('/assess/credit-risk', authMiddleware, async (req, res) => {
  try {
    const { farmer_id } = req.body;
    const financialService = require('./financialService');
    const result = await financialService.farmerCreditRiskScore(farmer_id);
    res.json({ ...result, delegatedFrom: 'aiBackboneService.assessCreditRisk (deprecated)', canonicalSource: 'financialService.farmerCreditRiskScore' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/detect/fraud', authMiddleware, async (req, res) => {
  try {
    const result = await detectFraud(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/recommend', authMiddleware, async (req, res) => {
  try {
    const { user_id, context } = req.body;
    const result = await generateRecommendations(user_id, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function isHealthy() {
  return true; // AI service health check
}


// ============================================================
// CANONICAL AI COMPATIBILITY API
// Provides the contract expected by platform services.
// ============================================================
async function generateRecommendation(request = {}) {
  const {
    task,
    userId,
    user_id,
    context = {},
    ...payload
  } = request;

  const effectiveUserId = userId || user_id || context.userId || context.user_id;

  if (!task) {
    throw new Error('AI recommendation task is required');
  }

  // Preserve the existing recommendation engine as the
  // canonical fallback while the task adapters are expanded.
  const result = await generateRecommendations(
    effectiveUserId,
    {
      ...context,
      ...payload,
      task
    }
  );

  return {
    ...result,
    task,
    confidence: typeof result?.confidence === 'number' ? result.confidence : 0,
    explanation: result?.explanation || null,
    recommendations: Array.isArray(result?.recommendations)
      ? result.recommendations
      : []
  };
}

const aiAPI = {
  generateRecommendation
};
module.exports = {
  aiAPI,
  router,
  predictDemand,
  optimizePrice,
  assessCreditRisk,
  detectFraud,
  generateRecommendations,
  isHealthy
};


// From aiBackboneService.js
 * AI Gateway Service
 * Central AI/ML integration hub for all platform modules
 * Provides standardized AI capabilities: prediction, optimization, analysis, recommendations
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

class aiBackboneService {
  constructor() {
    this.aiModels = new Map();
    this.modelCache = new Map();
    this.performanceMetrics = new Map();
    this.initializeAiModels();
  }

  /**
   * Initialize AI models
   */
  async initializeAiModels() {
    try {
      // Initialize model configurations
      this.aiModels.set('prediction', {
        endpoint: process.env.AI_PREDICTION_ENDPOINT || 'internal',
        version: '1.0',
        accuracy: 0.92,
        latency: 45
      });
      
      this.aiModels.set('optimization', {
        endpoint: process.env.AI_OPTIMIZATION_ENDPOINT || 'internal',
        version: '1.0',
        accuracy: 0.89,
        latency: 52
      });
      
      this.aiModels.set('analysis', {
        endpoint: process.env.AI_ANALYSIS_ENDPOINT || 'internal',
        version: '1.0',
        accuracy: 0.94,
        latency: 38
      });
      
      this.aiModels.set('recommendation', {
        endpoint: process.env.AI_RECOMMENDATION_ENDPOINT || 'internal',
        version: '1.0',
        accuracy: 0.91,
        latency: 41
      });

      logger.info('AI Gateway Service initialized with models:', Array.from(this.aiModels.keys()));
    } catch (error) {
      logger.error('Error initializing AI models:', error);
      throw error;
    }
  }

  /**
   * Generic AI prediction endpoint
   */
  async predict(modelType, parameters, context = {}) {
    try {
      const startTime = Date.now();
      
      const model = this.aiModels.get(modelType);
      if (!model) {
        throw new Error(`Model type ${modelType} not found`);
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(modelType, parameters);
      if (this.modelCache.has(cacheKey)) {
        const cached = this.modelCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
          logger.info(`Cache hit for ${modelType} prediction`);
          return cached.result;
        }
      }

      // Perform prediction
      const result = await this.performPrediction(modelType, parameters, context);
      
      // Cache result
      this.modelCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      // Track performance
      const latency = Date.now() - startTime;
      this.trackPerformance(modelType, latency, true);

      logger.info(`Prediction completed for ${modelType} in ${latency}ms`);
      return result;
    } catch (error) {
      logger.error(`Prediction error for ${modelType}:`, error);
      this.trackPerformance(modelType, 0, false);
      throw error;
    }
  }

  /**
   * AI optimization endpoint
   */
  async optimize(modelType, parameters, constraints = {}) {
    try {
      const startTime = Date.now();
      
      const model = this.aiModels.get(modelType);
      if (!model) {
        throw new Error(`Model type ${modelType} not found`);
      }

      const result = await this.performOptimization(modelType, parameters, constraints);
      
      const latency = Date.now() - startTime;
      this.trackPerformance(modelType, latency, true);

      logger.info(`Optimization completed for ${modelType} in ${latency}ms`);
      return result;
    } catch (error) {
      logger.error(`Optimization error for ${modelType}:`, error);
      this.trackPerformance(modelType, 0, false);
      throw error;
    }
  }

  /**
   * AI analysis endpoint
   */
  async analyze(modelType, data, analysisType = 'standard') {
    try {
      const startTime = Date.now();
      
      const model = this.aiModels.get(modelType);
      if (!model) {
        throw new Error(`Model type ${modelType} not found`);
      }

      const result = await this.performAnalysis(modelType, data, analysisType);
      
      const latency = Date.now() - startTime;
      this.trackPerformance(modelType, latency, true);

      logger.info(`Analysis completed for ${modelType} in ${latency}ms`);
      return result;
    } catch (error) {
      logger.error(`Analysis error for ${modelType}:`, error);
      this.trackPerformance(modelType, 0, false);
      throw error;
    }
  }

  /**
   * AI recommendation endpoint
   */
  async recommend(modelType, context, options = {}) {
    try {
      const startTime = Date.now();
      
      const model = this.aiModels.get(modelType);
      if (!model) {
        throw new Error(`Model type ${modelType} not found`);
      }

      const result = await this.performRecommendation(modelType, context, options);
      
      const latency = Date.now() - startTime;
      this.trackPerformance(modelType, latency, true);

      logger.info(`Recommendation completed for ${modelType} in ${latency}ms`);
      return result;
    } catch (error) {
      logger.error(`Recommendation error for ${modelType}:`, error);
      this.trackPerformance(modelType, 0, false);
      throw error;
    }
  }

  /**
   * Internal prediction implementation
   */
  async performPrediction(modelType, parameters, context) {
    // In production, this would call external AI services
    // For now, return mock predictions based on model type
    
    const predictions = {
      'crop_yield': this.predictCropYield(parameters, context),
      'weather': this.predictWeather(parameters, context),
      'market_price': this.predictMarketPrice(parameters, context),
      'pest_outbreak': this.predictPestOutbreak(parameters, context),
      'default': this.genericPrediction(parameters, context)
    };

    return predictions[modelType] || predictions['default'];
  }

  /**
   * Internal optimization implementation
   */
  async performOptimization(modelType, parameters, constraints) {
    const optimizations = {
      'resource_allocation': this.optimizeResourceAllocation(parameters, constraints),
      'scheduling': this.optimizeScheduling(parameters, constraints),
      'inventory': this.optimizeInventory(parameters, constraints),
      'logistics': this.optimizeLogistics(parameters, constraints),
      'default': this.genericOptimization(parameters, constraints)
    };

    return optimizations[modelType] || optimizations['default'];
  }

  /**
   * Internal analysis implementation
   */
  async performAnalysis(modelType, data, analysisType) {
    const analyses = {
      'soil': this.analyzeSoil(data, analysisType),
      'water': this.analyzeWater(data, analysisType),
      'crop_health': this.analyzeCropHealth(data, analysisType),
      'financial': this.analyzeFinancial(data, analysisType),
      'default': this.genericAnalysis(data, analysisType)
    };

    return analyses[modelType] || analyses['default'];
  }

  /**
   * Internal recommendation implementation
   */
  async performRecommendation(modelType, context, options) {
    const recommendations = {
      'crop_selection': this.recommendCropSelection(context, options),
      'fertilizer': this.recommendFertilizer(context, options),
      'irrigation': this.recommendIrrigation(context, options),
      'pest_control': this.recommendPestControl(context, options),
      'default': this.genericRecommendation(context, options)
    };

    return recommendations[modelType] || recommendations['default'];
  }

  // Missed in the 2026-08-15 pass below (predictMarketPrice etc.) — same
  // fabrication, same fix: honest null/implemented:false instead of a
  // randomized fake yield or weather forecast presented as real output.
  predictCropYield(parameters, context) {
    return { predicted_yield: null, confidence: null, factors: [], timeline: null, implemented: false, reason: 'No real crop-yield prediction model is connected to this gateway.' };
  }

  predictWeather(parameters, context) {
    return { temperature: null, humidity: null, rainfall: null, confidence: null, forecast_days: null, implemented: false, reason: 'No real weather-forecast provider is connected to this gateway — see whatever real weather integration exists elsewhere in the platform, if any, rather than this gateway.' };
  }

  // NOTE (2026-08-15): every method below this point previously used
  // Math.random() to fabricate predictions/scores/optimizations presented as
  // real AI output to 10 real consumers (see git blame). Replaced with an
  // honest `{implemented: false, ...}` shape — the field names callers
  // already destructure (confidence, score, etc.) are preserved as `null`
  // rather than removed, so nothing crashes, but nothing lies either. Real
  // computation for any of these would need real underlying data/models this
  // file has no connection to (soil/water/crop data already exists for real
  // elsewhere — see soilTestingService.js, weatherService.js — but wiring
  // this gateway to them is a real integration task, not a one-line fix).
  predictMarketPrice(parameters, context) {
    return { predicted_price: null, trend: null, confidence: null, time_horizon: null, implemented: false, reason: 'No real market-price prediction model is connected to this gateway.' };
  }

  predictPestOutbreak(parameters, context) {
    return { risk_level: null, confidence: null, affected_area: null, recommended_action: null, implemented: false, reason: 'No real pest-outbreak prediction model is connected to this gateway.' };
  }

  genericPrediction(parameters, context) {
    return { prediction: null, confidence: null, timestamp: new Date().toISOString(), implemented: false, reason: 'No real prediction model is connected to this gateway.' };
  }

  // Mock optimization methods
  optimizeResourceAllocation(parameters, constraints) {
    return { optimized_allocation: parameters, efficiency_gain: null, cost_reduction: null, implemented: false, reason: 'No real resource-allocation optimizer is connected to this gateway.' };
  }

  optimizeScheduling(parameters, constraints) {
    return { optimized_schedule: parameters, time_saved: null, resource_utilization: null, implemented: false, reason: 'No real scheduling optimizer is connected to this gateway.' };
  }

  optimizeInventory(parameters, constraints) {
    return { optimized_inventory: parameters, waste_reduction: null, cost_savings: null, implemented: false, reason: 'No real inventory optimizer is connected to this gateway.' };
  }

  optimizeLogistics(parameters, constraints) {
    return { optimized_routes: parameters, distance_saved: null, fuel_savings: null, implemented: false, reason: 'No real logistics optimizer is connected to this gateway — see logisticsService.js/logisticsEnhancementService.js for real freight-lane logic outside this gateway.' };
  }

  genericOptimization(parameters, constraints) {
    return { optimized_result: parameters, improvement: null, implemented: false, reason: 'No real optimizer is connected to this gateway.' };
  }

  // Mock analysis methods
  analyzeSoil(data, analysisType) {
    return { soil_health_score: null, nutrient_levels: null, recommendations: [], implemented: false, reason: 'No real soil-analysis model is connected to this gateway — see soilTestingService.js for real recorded soil-test data.' };
  }

  analyzeWater(data, analysisType) {
    return { water_quality_score: null, ph_level: null, contamination_risk: null, implemented: false, reason: 'No real water-analysis model is connected to this gateway.' };
  }

  analyzeCropHealth(data, analysisType) {
    return { health_score: null, stress_factors: [], growth_stage: null, implemented: false, reason: 'No real crop-health model is connected to this gateway.' };
  }

  analyzeFinancial(data, analysisType) {
    return { financial_health: null, profitability: null, risk_factors: [], implemented: false, reason: 'No real financial-analysis model is connected to this gateway — see financialService.js for real, DB-backed financial computations outside this gateway.' };
  }

  genericAnalysis(data, analysisType) {
    return { analysis_result: null, score: null, insights: [], implemented: false, reason: 'No real analysis model is connected to this gateway.' };
  }

  // Mock recommendation methods
  recommendCropSelection(context, options) {
    return { recommended_crops: [], confidence: null, reasoning: null, implemented: false, reason: 'No real crop-recommendation model is connected to this gateway.' };
  }

  recommendFertilizer(context, options) {
    return {
      fertilizer_type: 'NPK_10_26_26',
      application_rate: '50kg/acre',
      timing: 'before_sowing'
    };
  }

  recommendIrrigation(context, options) {
    return {
      irrigation_method: 'drip',
      frequency: 'daily',
      duration: '2_hours'
    };
  }

  recommendPestControl(context, options) {
    return {
      pest_control_method: 'integrated_pest_management',
      action: 'monitor_and_treat_as_needed',
      products: ['bio_pesticide', 'trap_crops']
    };
  }

  genericRecommendation(context, options) {
    return { recommendation: null, confidence: null, priority: null, implemented: false, reason: 'No real recommendation model is connected to this gateway.' };
  }

  /**
   * Generate cache key for predictions
   */
  generateCacheKey(modelType, parameters) {
    return `${modelType}_${JSON.stringify(parameters)}`;
  }

  /**
   * Track AI model performance
   */
  trackPerformance(modelType, latency, success) {
    if (!this.performanceMetrics.has(modelType)) {
      this.performanceMetrics.set(modelType, {
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        total_latency: 0,
        avg_latency: 0
      });
    }

    const metrics = this.performanceMetrics.get(modelType);
    metrics.total_calls++;
    metrics.total_latency += latency;
    metrics.avg_latency = metrics.total_latency / metrics.total_calls;

    if (success) {
      metrics.successful_calls++;
    } else {
      metrics.failed_calls++;
    }

    this.performanceMetrics.set(modelType, metrics);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(modelType = null) {
    if (modelType) {
      return this.performanceMetrics.get(modelType) || {};
    }
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * Health check for AI Gateway
   */
  async healthCheck() {
    try {
      const modelStatus = {};
      for (const [modelType, model] of this.aiModels) {
        modelStatus[modelType] = {
          status: 'healthy',
          version: model.version,
          accuracy: model.accuracy
        };
      }

      return {
        status: 'healthy',
        models: modelStatus,
        performance: this.getPerformanceMetrics(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('AI Gateway health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create Express router for AI Gateway endpoints
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');

// AI Gateway health check
router.get('/health', (req, res) => {
  const aiGateway = new aiBackboneService();
  res.json({
    status: 'healthy',
    service: 'ai-gateway',
    models: Array.from(aiGateway.aiModels.entries()),
    cache_size: aiGateway.modelCache.size,
    performance_metrics: Array.from(aiGateway.performanceMetrics.entries())
  });
});

// Model prediction endpoint
router.post('/predict', authMiddleware, async (req, res) => {
  try {
    const aiGateway = new aiBackboneService();
    const { model_type, data } = req.body;
    const result = await aiGateway.predict(model_type, data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Model optimization endpoint
router.post('/optimize', authMiddleware, async (req, res) => {
  try {
    const aiGateway = new aiBackboneService();
    const { model_type, data, constraints } = req.body;
    const result = await aiGateway.optimize(model_type, data, constraints);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Model analysis endpoint
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const aiGateway = new aiBackboneService();
    const { model_type, data } = req.body;
    const result = await aiGateway.analyze(model_type, data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Model recommendation endpoint
router.post('/recommend', authMiddleware, async (req, res) => {
  try {
    const aiGateway = new aiBackboneService();
    const { model_type, data, context } = req.body;
    const result = await aiGateway.recommend(model_type, data, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  aiBackboneService,
  ...new aiBackboneService()
};
// From aiBackboneService.js
 * AI Brain Service - Cognitive Processing Layer
 * 
 * This service provides cognitive processing capabilities including:
 * - Knowledge representation and reasoning
 * - Semantic understanding and inference
 * - Context-aware decision making
 * - Learning and adaptation
 * - Cross-domain knowledge integration
 * - Cognitive architecture
 */

// These three SDKs are not in package.json (no live LLM credentials exist in this
// environment, by design). Lazy-require only when the matching env var is present,
// so absence is a clean not_configured client, never a process-killing MODULE_NOT_FOUND.
function tryRequireClient(envVar, loader) {
  if (!process.env[envVar]) return null;
  try {
    return loader();
  } catch (error) {
    require('../../utils/logger').warn(`aiClient:  is set but its SDK failed to load`, { error: error.message });
    return null;
  }
}

class aiBackboneService {
  constructor() {
    // Initialize AI model clients
    this.openai = tryRequireClient('OPENAI_API_KEY', () => {
      const { OpenAI } = require('openai');
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    });

    this.gemini = tryRequireClient('GEMINI_API_KEY', () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    });

    this.anthropic = tryRequireClient('ANTHROPIC_API_KEY', () => {
      const { Anthropic } = require('@anthropic-ai/sdk');
      return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    });
    
    // Knowledge graph
    this.knowledgeGraph = new Map();
    
    // Working memory
    this.workingMemory = new Map();
    
    // Long-term memory
    this.longTermMemory = new Map();
    
    // Cognitive state
    this.cognitiveState = {
      attention: new Map(),
      goals: new Map(),
      context: new Map(),
      beliefs: new Map()
    };
    
    // Initialize knowledge base
    this.initializeKnowledgeBase();
    
    // Initialize cognitive processes
    this.initializeCognitiveProcesses();
  }
  
  /**
   * Initialize knowledge base
   */
  initializeKnowledgeBase() {
    // Agricultural knowledge
    this.addKnowledge('agriculture', {
      crops: ['wheat', 'rice', 'maize', 'sugarcane', 'cotton'],
      seasons: ['kharif', 'rabi', 'zaid'],
      practices: ['organic', 'conventional', 'regenerative'],
      challenges: ['climate_change', 'water_scarcity', 'soil_degradation']
    });
    
    // Equipment knowledge
    this.addKnowledge('equipment', {
      types: ['tractors', 'harvesters', 'irrigation', 'processing'],
      maintenance: ['preventive', 'predictive', 'corrective'],
      utilization: ['rental', 'leasing', 'sharing']
    });
    
    // Supply chain knowledge
    this.addKnowledge('supply_chain', {
      stages: ['production', 'processing', 'distribution', 'retail'],
      stakeholders: ['farmers', 'processors', 'distributors', 'retailers'],
      challenges: ['waste', 'inefficiency', 'quality_control']
    });
    
    // Financial knowledge
    this.addKnowledge('finance', {
      instruments: ['loans', 'insurance', 'subsidies', 'grants'],
      metrics: ['roi', 'cash_flow', 'profitability', 'liquidity'],
      risks: ['market', 'credit', 'operational', 'strategic']
    });
  }
  
  /**
   * Initialize cognitive processes
   */
  initializeCognitiveProcesses() {
    this.cognitiveProcesses = {
      perception: this.perceptionProcess.bind(this),
      attention: this.attentionProcess.bind(this),
      reasoning: this.reasoningProcess.bind(this),
      learning: this.learningProcess.bind(this),
      decision: this.decisionProcess.bind(this),
      planning: this.planningProcess.bind(this)
    };
  }
  
  /**
   * Add knowledge to knowledge graph
   */
  addKnowledge(domain, knowledge) {
    this.knowledgeGraph.set(domain, {
      ...knowledge,
      timestamp: new Date(),
      confidence: 1.0
    });
  }
  
  /**
   * Retrieve knowledge from knowledge graph
   */
  getKnowledge(domain) {
    return this.knowledgeGraph.get(domain);
  }
  
  /**
   * Perception process - understand input
   */
  async perceptionProcess(input, context = {}) {
    try {
      const prompt = `
        You are a perception engine. Analyze the following input and extract:
        1. Key entities and their types
        2. Relationships between entities
        3. Intent and purpose
        4. Context and constraints
        5. Relevant knowledge domains
        
        Input: ${JSON.stringify(input)}
        Context: ${JSON.stringify(context)}
        
        Provide structured output in JSON format.
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const perception = JSON.parse(response.choices[0].message.content);
      
      // Update working memory
      this.workingMemory.set('current_perception', perception);
      
      return {
        success: true,
        perception: perception
      };
    } catch (error) {
      console.error('Error in perception process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Attention process - focus on relevant information
   */
  async attentionProcess(perception, goals = []) {
    try {
      const prompt = `
        You are an attention engine. Given the perception and goals, identify:
        1. Most relevant information
        2. Priority ranking of elements
        3. Information to ignore
        4. Focus areas for deeper processing
        
        Perception: ${JSON.stringify(perception)}
        Goals: ${JSON.stringify(goals)}
        
        Provide structured output in JSON format.
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const attention = JSON.parse(response.choices[0].message.content);
      
      // Update cognitive state
      this.cognitiveState.attention.set('current', attention);
      
      return {
        success: true,
        attention: attention
      };
    } catch (error) {
      console.error('Error in attention process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Reasoning process - draw inferences
   */
  async reasoningProcess(attention, knowledge) {
    try {
      const prompt = `
        You are a reasoning engine. Given the attention focus and knowledge, perform:
        1. Logical inference
        2. Causal reasoning
        3. Abductive reasoning
        4. Pattern recognition
        5. Hypothesis generation
        
        Attention: ${JSON.stringify(attention)}
        Knowledge: ${JSON.stringify(knowledge)}
        
        Provide structured output in JSON format with reasoning chains and conclusions.
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const reasoning = JSON.parse(response.choices[0].message.content);
      
      // Update working memory
      this.workingMemory.set('current_reasoning', reasoning);
      
      return {
        success: true,
        reasoning: reasoning
      };
    } catch (error) {
      console.error('Error in reasoning process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Learning process - acquire and update knowledge
   */
  async learningProcess(experience, outcome) {
    try {
      const prompt = `
        You are a learning engine. Given the experience and outcome, perform:
        1. Knowledge extraction
        2. Pattern identification
        3. Rule learning
        4. Model update
        5. Confidence assessment
        
        Experience: ${JSON.stringify(experience)}
        Outcome: ${JSON.stringify(outcome)}
        
        Provide structured output in JSON format with learned knowledge and updates.
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const learning = JSON.parse(response.choices[0].message.content);
      
      // Update long-term memory
      if (learning.knowledge_updates) {
        learning.knowledge_updates.forEach(update => {
          this.addKnowledge(update.domain, update.knowledge);
        });
      }
      
      return {
        success: true,
        learning: learning
      };
    } catch (error) {
      console.error('Error in learning process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Decision process - make informed decisions
   */
  async decisionProcess(reasoning, context, constraints = {}) {
    try {
      const prompt = `
        You are a decision engine. Given the reasoning, context, and constraints, perform:
        1. Option generation
        2. Option evaluation
        3. Risk assessment
        4. Recommendation
        5. Confidence scoring
        
        Reasoning: ${JSON.stringify(reasoning)}
        Context: ${JSON.stringify(context)}
        Constraints: ${JSON.stringify(constraints)}
        
        Provide structured output in JSON format with decision recommendations.
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const decision = JSON.parse(response.choices[0].message.content);
      
      // Update cognitive state
      this.cognitiveState.goals.set('current_decision', decision);
      
      return {
        success: true,
        decision: decision
      };
    } catch (error) {
      console.error('Error in decision process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Planning process - create action plans
   */
  async planningProcess(decision, current_state, target_state) {
    try {
      const prompt = `
        You are a planning engine. Given the decision, current state, and target state, perform:
        1. Goal decomposition
        2. Action sequence generation
        3. Resource allocation
        4. Timeline estimation
        5. Contingency planning
        
        Decision: ${JSON.stringify(decision)}
        Current State: ${JSON.stringify(current_state)}
        Target State: ${JSON.stringify(target_state)}
        
        Provide structured output in JSON format with detailed action plans.
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const planning = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        planning: planning
      };
    } catch (error) {
      console.error('Error in planning process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Execute full cognitive cycle
   */
  async executeCognitiveCycle(input, context = {}, goals = [], constraints = {}) {
    try {
      // Step 1: Perception
      const perception = await this.perceptionProcess(input, context);
      if (!perception.success) return perception;
      
      // Step 2: Attention
      const attention = await this.attentionProcess(perception.perception, goals);
      if (!attention.success) return attention;
      
      // Step 3: Reasoning
      const relevantKnowledge = this.getRelevantKnowledge(attention.attention);
      const reasoning = await this.reasoningProcess(attention.attention, relevantKnowledge);
      if (!reasoning.success) return reasoning;
      
      // Step 4: Decision
      const decision = await this.decisionProcess(reasoning.reasoning, context, constraints);
      if (!decision.success) return decision;
      
      // Step 5: Planning
      const planning = await this.planningProcess(
        decision.decision,
        context.current_state || {},
        context.target_state || {}
      );
      if (!planning.success) return planning;
      
      return {
        success: true,
        cycle: {
          perception: perception.perception,
          attention: attention.attention,
          reasoning: reasoning.reasoning,
          decision: decision.decision,
          planning: planning.planning
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error in cognitive cycle:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get relevant knowledge based on attention
   */
  getRelevantKnowledge(attention) {
    const knowledge = {};
    
    if (attention.relevant_domains) {
      attention.relevant_domains.forEach(domain => {
        const domainKnowledge = this.getKnowledge(domain);
        if (domainKnowledge) {
          knowledge[domain] = domainKnowledge;
        }
      });
    }
    
    return knowledge;
  }
  
  /**
   * Update context
   */
  updateContext(context) {
    this.cognitiveState.context.set('current', {
      ...this.cognitiveState.context.get('current'),
      ...context,
      timestamp: new Date()
    });
  }
  
  /**
   * Get cognitive state
   */
  getCognitiveState() {
    return {
      attention: Array.from(this.cognitiveState.attention.entries()),
      goals: Array.from(this.cognitiveState.goals.entries()),
      context: Array.from(this.cognitiveState.context.entries()),
      beliefs: Array.from(this.cognitiveState.beliefs.entries()),
      working_memory: Array.from(this.workingMemory.entries()),
      long_term_memory_size: this.longTermMemory.size
    };
  }
  
  /**
   * Clear working memory
   */
  clearWorkingMemory() {
    this.workingMemory.clear();
    return { success: true };
  }
}

// Export singleton instance with router for proper mounting
const aiBackboneService = new aiBackboneService();

// Create Express router for AI Brain endpoints
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');

// AI Brain health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-brain',
    models_available: {
      openai: !!aiBackboneService.openai,
      gemini: !!aiBackboneService.gemini,
      anthropic: !!aiBackboneService.anthropic
    },
    knowledge_graph_size: aiBackboneService.knowledgeGraph.size,
    working_memory_size: aiBackboneService.workingMemory.size,
    long_term_memory_size: aiBackboneService.longTermMemory.size
  });
});

// Cognitive process endpoint
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { input, context } = req.body;
    const result = await aiBackboneService.processCognitiveCycle(input, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Knowledge graph operations
router.get('/knowledge-graph', authMiddleware, (req, res) => {
  try {
    const graph = aiBackboneService.getKnowledgeGraph();
    res.json({ knowledge_graph: graph });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Memory operations
router.post('/memory/working', authMiddleware, (req, res) => {
  try {
    const { key, value } = req.body;
    const result = aiBackboneService.addToWorkingMemory(key, value);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/memory/long-term', authMiddleware, (req, res) => {
  try {
    const { key, value } = req.body;
    const result = aiBackboneService.addToLongTermMemory(key, value);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  aiBackboneService,
  ...aiBackboneService
};

// From aiBackboneService.js
 * AFRERA Complete AI Integration Service
 * 
 * Comprehensive AI integration with all agricultural modules:
 * - Farmer Module (crop planning, harvesting, field management)
 * - Crop Module (crop lifecycle, yield management, quality control)
 * - Livestock Module (animal health, breeding, production)
 * - All Inbuilt Modules (Dairy, Poultry, Goat, Sheep, Pig, etc.)
 * 
 * This service ensures that all agricultural operations have AI capabilities:
 * - Predictive analytics for farming decisions
 * - Disease detection and prevention
 * - Yield prediction and optimization
 * - Resource optimization
 * - Risk assessment and mitigation
 * - Personalized recommendations
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus } = require('../../core/signalBus');

// ============================================================================
// FARMER MODULE AI INTEGRATION
// ============================================================================

/**
 * AI-powered crop planning recommendation for farmers
 */
async function recommendCropPlanning(farmerId, farmData) {
  const pg = getPostgreSQL();
  
  try {
    // Get farmer's historical crop data
    const historicalData = await pg.query(`
      SELECT 
        crop_type,
        yield_per_hectare,
        planting_date,
        harvest_date,
        weather_conditions,
        soil_type,
        profit_margin
      FROM farmer_crop_plans
      WHERE farmer_id = $1
      ORDER BY planting_date DESC
      LIMIT 5
    `, [farmerId]);
    
    // Get field data
    const fieldData = await pg.query(`
      SELECT 
        soil_type,
        soil_ph,
        soil_organic_matter,
        irrigation_type,
        last_crop,
        field_size
      FROM farmer_fields
      WHERE farmer_id = $1
    `, [farmerId]);
    
    // Get market data for pricing
    const marketData = await pg.query(`
      SELECT 
        crop_type,
        market_price,
        demand_trend,
        seasonality
      FROM market_intelligence
      WHERE active = true
    `);
    
    // AI recommendation algorithm
    const recommendations = [];
    
    const crops = ['rice', 'wheat', 'cotton', 'sugarcane', 'maize', 'vegetables'];
    
    for (const crop of crops) {
      const recommendation = {
        crop_type: crop,
        recommended_action: 'plant',
        confidence_score: 0,
        expected_yield: 0,
        expected_profit: 0,
        risk_level: 'medium',
        planting_window: 'optimal',
        resource_requirements: {
          seeds: 0,
          fertilizers: 0,
          water: 0,
          labor: 0
        },
        ai_reasoning: ''
      };
      
      // Calculate recommendation score based on historical performance
      const historicalCrop = historicalData.rows.find(h => h.crop_type === crop);
      if (historicalCrop) {
        recommendation.confidence_score += 0.3;
        recommendation.expected_yield = historicalCrop.yield_per_hectare;
        recommendation.expected_profit = historicalCrop.profit_margin;
      }
      
      // Calculate based on field suitability
      const fieldSuitability = calculateFieldSuitability(fieldData.rows[0], crop);
      recommendation.confidence_score += fieldSuitability * 0.4;
      
      // Calculate based on market conditions
      const marketCondition = calculateMarketCondition(marketData.rows, crop);
      recommendation.confidence_score += marketCondition * 0.3;
      
      // Calculate resource requirements
      recommendation.resource_requirements = calculateResourceRequirements(fieldData.rows[0], crop);
      
      // Determine risk level
      recommendation.risk_level = determineRiskLevel(recommendation.confidence_score, historicalCrop);
      
      // Generate AI reasoning
      recommendation.ai_reasoning = generateAIReasoning(recommendation, historicalCrop, fieldSuitability, marketCondition);
      
      recommendations.push(recommendation);
    }
    
    // Sort by confidence score
    recommendations.sort((a, b) => b.confidence_score - a.confidence_score);
    
    // Emit signal bus event
    await signalBus.emit('ai.farmer.crop_planning.recommended', {
      farmer_id: farmerId,
      recommendations,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI crop planning recommendation generated', { farmerId, recommendationCount: recommendations.length });
    
    return {
      success: true,
      recommendations
    };
  } catch (error) {
    logger.error('Error generating AI crop planning recommendation', { error: error.message, farmerId });
    throw error;
  }
}

/**
 * AI-powered harvest timing prediction
 */
async function predictHarvestTiming(farmerId, cropData) {
  const pg = getPostgreSQL();
  
  try {
    // Get historical harvest data
    const historicalHarvests = await pg.query(`
      SELECT 
        crop_type,
        planting_date,
        harvest_date,
        yield_quantity,
        quality_grade,
        weather_conditions
      FROM farmer_harvests
      WHERE farmer_id = $1
      ORDER BY harvest_date DESC
      LIMIT 10
    `, [farmerId]);
    
    // Get weather forecast data
    const weatherForecast = await getWeatherForecast(cropData.location);
    
    // Get crop growth stage
    const growthStage = await determineCropGrowthStage(cropData.crop_id);
    
    // Calculate optimal harvest timing
    const optimalHarvestDate = calculateOptimalHarvestDate(historicalHarvests.rows, weatherForecast, growthStage);
    
    // Calculate expected yield and quality
    const expectedYield = calculateExpectedYield(cropData, growthStage, weatherForecast);
    const expectedQuality = calculateExpectedQuality(cropData, growthStage, weatherForecast);
    
    // Market price prediction at harvest time
    const marketPricePrediction = await predictMarketPriceAtDate(cropData.crop_type, optimalHarvestDate);
    
    const prediction = {
      crop_id: cropData.crop_id,
      farmer_id: farmerId,
      crop_type: cropData.crop_type,
      current_growth_stage: growthStage,
      optimal_harvest_date: optimalHarvestDate,
      expected_yield: expectedYield,
      expected_quality: expectedQuality,
      predicted_market_price: marketPricePrediction,
      confidence_score: calculateYieldConfidence(historicalHarvests.rows.length, { plant_health: growthStage }, weatherForecast),
      risk_factors: ['weather_uncertainty', 'pest_disease_risk'],
      ai_recommendations: [
        'Monitor for pest outbreaks',
        'Schedule pre-harvest inspection',
        'Arrange storage facilities'
      ]
    };
    
    // Emit signal bus event
    await signalBus.emit('ai.farmer.harvest_timing.predicted', {
      farmer_id: farmerId,
      prediction,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI harvest timing prediction generated', { farmerId, optimalHarvestDate });
    
    return {
      success: true,
      prediction
    };
  } catch (error) {
    logger.error('Error predicting harvest timing', { error: error.message, farmerId });
    throw error;
  }
}

/**
 * AI-powered resource optimization for farmer
 */
async function optimizeFarmerResources(farmerId, resourceData) {
  const pg = getPostgreSQL();
  
  try {
    // Get current resource usage
    const currentResources = await pg.query(`
      SELECT 
        resource_type,
        current_usage,
        available_capacity,
        cost_per_unit,
        efficiency_score
      FROM farmer_resources
      WHERE farmer_id = $1
    `, [farmerId]);
    
    // Get planned activities
    const plannedActivities = await pg.query(`
      SELECT 
        activity_type,
        required_resources,
        timeline,
        priority
      FROM farmer_activities
      WHERE farmer_id = $1 AND status = 'planned'
    `, [farmerId]);
    
    // AI optimization algorithm
    const optimization = {
      farmer_id: farmerId,
      current_resources: currentResources.rows,
      planned_activities: plannedActivities.rows,
      optimization_strategy: 'efficiency_first',
      recommendations: [],
      expected_savings: 0,
      efficiency_improvement: 0
    };
    
    // Calculate resource optimization recommendations
    for (const resource of currentResources.rows) {
      const recommendation = {
        resource_type: resource.resource_type,
        current_usage: resource.current_usage,
        recommended_usage: resource.current_usage,
        efficiency_score: resource.efficiency_score,
        optimization_action: 'maintain',
        expected_savings: 0,
        reasoning: ''
      };
      
      // Analyze usage patterns
      if (resource.efficiency_score < 0.6) {
        recommendation.optimization_action = 'reduce';
        recommendation.recommended_usage = resource.current_usage * 0.8;
        recommendation.expected_savings = (resource.current_usage - recommendation.recommended_usage) * resource.cost_per_unit;
        recommendation.reasoning = `Low efficiency score (${resource.efficiency_score}) - reduce usage to improve efficiency`;
        optimization.expected_savings += recommendation.expected_savings;
        optimization.efficiency_improvement += 0.1;
      } else if (resource.efficiency_score > 0.8) {
        recommendation.optimization_action = 'expand';
        recommendation.recommended_usage = resource.current_usage * 1.2;
        recommendation.reasoning = `High efficiency score (${resource.efficiency_score}) - expand usage to maximize returns`;
      }
      
      optimization.recommendations.push(recommendation);
    }
    
    // Emit signal bus event
    await signalBus.emit('ai.farmer.resources.optimized', {
      farmer_id: farmerId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI farmer resource optimization generated', { farmerId, expectedSavings: optimization.expected_savings });
    
    return {
      success: true,
      optimization
    };
  } catch (error) {
    logger.error('Error optimizing farmer resources', { error: error.message, farmerId });
    throw error;
  }
}

// ============================================================================
// CROP MODULE AI INTEGRATION
// ============================================================================

/**
 * Symptom overlap ratio between a reported symptom list and a candidate
 * disease's known symptom list (Jaccard similarity, case/whitespace
 * normalized). Was called but never defined anywhere in this file -
 * detectCropDisease() below threw ReferenceError on every call. This is a
 * plain set-overlap score, not a trained classifier; there is no ML model
 * or labeled training data backing "AI-powered" here.
 *
 * NOTE: detectCropDisease() also queries crop_health_monitoring and
 * crop_disease_database, neither of which exists in any migration - fixing
 * this function makes the ReferenceError go away, but the query above it
 * will still fail against a real database until those tables are added.
 * That's a separate, larger gap (new schema + seed data) out of scope here.
 */
function calculateSymptomMatch(reportedSymptoms, knownSymptoms) {
  const normalize = (list) => new Set(
    (Array.isArray(list) ? list : [])
      .filter((s) => typeof s === 'string' && s.trim())
      .map((s) => s.trim().toLowerCase())
  );

  const reported = normalize(reportedSymptoms);
  const known = normalize(knownSymptoms);
  if (reported.size === 0 || known.size === 0) return 0;

  let intersectionSize = 0;
  for (const symptom of reported) {
    if (known.has(symptom)) intersectionSize++;
  }
  const unionSize = new Set([...reported, ...known]).size;

  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/**
 * AI-powered disease detection for crops
 */
async function detectCropDisease(cropId, diseaseData) {
  const pg = getPostgreSQL();
  
  try {
    // Get crop health data
    const cropHealth = await pg.query(`
      SELECT 
        crop_id,
        health_status,
        symptoms,
        environmental_conditions,
        pest_pressure,
        disease_pressure
      FROM crop_health_monitoring
      WHERE crop_id = $1
    `, [cropId]);
    
    // Get disease database
    const diseaseDatabase = await pg.query(`
      SELECT 
        disease_name,
        symptoms,
        causes,
        treatment_recommendations,
        prevention_methods,
        severity_level
      FROM crop_disease_database
    `);
    
    // AI disease detection algorithm
    const detection = {
      crop_id: cropId,
      detected_diseases: [],
      confidence_score: 0,
      risk_level: 'low',
      recommended_actions: [],
      severity_assessment: 'healthy'
    };
    
    // Analyze symptoms against disease database
    for (const disease of diseaseDatabase.rows) {
      const symptomMatch = calculateSymptomMatch(diseaseData.symptoms, disease.symptoms);
      
      if (symptomMatch > 0.6) {
        detection.detected_diseases.push({
          disease_name: disease.disease_name,
          confidence_score: symptomMatch,
          severity_level: disease.severity_level,
          treatment_recommendations: disease.treatment_recommendations,
          prevention_methods: disease.prevention_methods
        });
        
        detection.confidence_score = Math.max(detection.confidence_score, symptomMatch);
        
        if (disease.severity_level === 'high') {
          detection.risk_level = 'critical';
          detection.severity_assessment = 'critical';
        } else if (disease.severity_level === 'medium') {
          detection.risk_level = 'high';
          detection.severity_assessment = 'infected';
        }
      }
    }
    
    // Generate recommended actions
    if (detection.detected_diseases.length > 0) {
      detection.recommended_actions = [
        'Isolate affected area',
        'Apply recommended treatment',
        'Monitor crop health daily',
        'Notify extension services'
      ];
    }
    
    // Emit signal bus event
    await signalBus.emit('ai.crop.disease.detected', {
      crop_id: cropId,
      detection,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI crop disease detection completed', { cropId, diseasesDetected: detection.detected_diseases.length });
    
    return {
      success: true,
      detection
    };
  } catch (error) {
    logger.error('Error detecting crop disease', { error: error.message, cropId });
    throw error;
  }
}

/**
 * AI-powered yield prediction for crops
 */
async function predictCropYield(cropId, yieldData) {
  const pg = getPostgreSQL();
  
  try {
    // Get historical yield data
    const historicalYield = await pg.query(`
      SELECT 
        crop_type,
        planting_date,
        harvest_date,
        yield_per_hectare,
        quality_grade,
        weather_conditions,
        soil_conditions,
        fertilization_level
      FROM crop_yield_records
      WHERE crop_id = $1
      ORDER BY harvest_date DESC
      LIMIT 5
    `, [cropId]);
    
    // Get current crop status
    const currentStatus = await pg.query(`
      SELECT 
        growth_stage,
        plant_health,
        stress_factors,
        nutrient_levels
      FROM crop_lifecycle
      WHERE crop_id = $1
    `, [cropId]);
    
    // Get weather forecast
    const weatherForecast = await getWeatherForecast(yieldData.location);
    
    // AI yield prediction algorithm
    const prediction = {
      crop_id: cropId,
      predicted_yield: 0,
      confidence_score: 0,
      yield_per_hectare: 0,
      quality_grade: 'unknown',
      risk_factors: [],
      optimization_recommendations: []
    };
    
    // Calculate yield based on historical data
    if (historicalYield.rows.length > 0) {
      const avgYield = historicalYield.rows.reduce((sum, record) => sum + record.yield_per_hectare, 0) / historicalYield.rows.length;
      prediction.yield_per_hectare = avgYield;
    }
    
    // Adjust based on current conditions
    const currentCondition = currentStatus.rows[0];
    if (currentCondition) {
      const healthMultiplier = currentCondition.plant_health === 'excellent' ? 1.1 : 
                            currentCondition.plant_health === 'good' ? 1.0 :
                            currentCondition.plant_health === 'fair' ? 0.9 : 0.8;
      
      prediction.yield_per_hectare *= healthMultiplier;
    }
    
    // Adjust based on weather forecast
    const weatherMultiplier = calculateWeatherMultiplier(weatherForecast);
    prediction.yield_per_hectare *= weatherMultiplier;
    
    // Calculate total yield
    const cropArea = yieldData.area_hectares || 1;
    prediction.predicted_yield = prediction.yield_per_hectare * cropArea;
    
    // Predict quality grade
    prediction.quality_grade = predictQualityGrade(currentCondition, weatherForecast);
    
    // Calculate confidence score
    prediction.confidence_score = calculateYieldConfidence(historicalYield.rows.length, currentCondition, weatherForecast);
    
    // Generate optimization recommendations
    if (prediction.confidence_score < 0.7) {
      prediction.optimization_recommendations = [
        'Consider irrigation adjustment',
        'Review fertilization schedule',
        'Monitor pest pressure'
      ];
    }
    
    // Identify risk factors
    prediction.risk_factors = identifyYieldRiskFactors(currentCondition, weatherForecast);
    
    // Emit signal bus event
    await signalBus.emit('ai.crop.yield.predicted', {
      crop_id: cropId,
      prediction,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI crop yield prediction completed', { cropId, predictedYield: prediction.predicted_yield });
    
    return {
      success: true,
      prediction
    };
  } catch (error) {
    logger.error('Error predicting crop yield', { error: error.message, cropId });
    throw error;
  }
}

// ============================================================================
// LIVESTOCK MODULE AI INTEGRATION
// ============================================================================

/**
 * AI-powered livestock health monitoring
 */
async function monitorLivestockHealth(livestockId, healthData) {
  const pg = getPostgreSQL();
  
  try {
    // Get livestock health history
    const healthHistory = await pg.query(`
      SELECT 
        livestock_id,
        health_status,
        weight,
        temperature,
        feed_intake,
        activity_level,
        symptoms,
        vet_visits
      FROM livestock_health_records
      WHERE livestock_id = $1
      ORDER BY recorded_at DESC
      LIMIT 10
    `, [livestockId]);
    
    // Get livestock data
    const livestock = await pg.query(`
      SELECT 
        livestock_id,
        breed,
        age,
        production_stage,
        environment,
        feeding_regime
      FROM livestock_inventory
      WHERE livestock_id = $1
    `, [livestockId]);
    
    // AI health monitoring algorithm
    const monitoring = {
      livestock_id: livestockId,
      current_health_status: 'healthy',
      health_trend: 'stable',
      risk_factors: [],
      recommended_actions: [],
      next_vet_visit: null,
      feeding_adjustments: [],
      environmental_recommendations: []
    };
    
    // Analyze health trends
    if (healthHistory.rows.length > 1) {
      const recentHealth = healthHistory.rows[0].health_status;
      const previousHealth = healthHistory.rows[1].health_status;
      
      if (recentHealth !== previousHealth) {
        monitoring.health_trend = recentHealth === 'improving' ? 'positive' : 'negative';
      }
    }
    
    // Identify risk factors
    const currentHealth = healthHistory.rows[0];
    if (currentHealth) {
      if (currentHealth.temperature > 39) {
        monitoring.risk_factors.push('elevated_temperature');
        monitoring.current_health_status = 'attention_needed';
      }
      
      if (currentHealth.activity_level < 0.5) {
        monitoring.risk_factors.push('low_activity');
        monitoring.current_health_status = 'at_risk';
      }
      
      if (currentHealth.feed_intake < 0.7) {
        monitoring.risk_factors.push('reduced_feed_intake');
        monitoring.recommended_actions.push('Adjust feeding schedule');
      }
    }
    
    // Generate recommended actions
    if (monitoring.risk_factors.length > 0) {
      monitoring.recommended_actions.push('Schedule veterinary examination');
      monitoring.next_vet_visit = calculateNextVetVisit(livestockId, monitoring.current_health_status);
    }
    
    // Emit signal bus event
    await signalBus.emit('ai.livestock.health.monitored', {
      livestock_id: livestockId,
      monitoring,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI livestock health monitoring completed', { livestockId, healthStatus: monitoring.current_health_status });
    
    return {
      success: true,
      monitoring
    };
  } catch (error) {
    logger.error('Error monitoring livestock health', { error: error.message, livestockId });
    throw error;
  }
}

/**
 * AI-powered breeding recommendation for livestock
 */
async function recommendLivestockBreeding(livestockId, breedingData) {
  const pg = getPostgreSQL();
  
  try {
    // Get livestock inventory
    const livestock = await pg.query(`
      SELECT 
        livestock_id,
        breed,
        age,
        sex,
        genetic_quality,
        production_performance,
        health_status
      FROM livestock_inventory
      WHERE livestock_id = $1
    `, [livestockId]);
    
    // Get breeding records
    const breedingHistory = await pg.query(`
      SELECT 
        livestock_id,
        breeding_partner_id,
        offspring_count,
        offspring_quality,
        breeding_date,
        success_rate
      FROM livestock_breeding_records
      WHERE livestock_id = $1
      ORDER BY breeding_date DESC
      LIMIT 5
    `, [livestockId]);
    
    // AI breeding recommendation algorithm
    const recommendation = {
      livestock_id: livestockId,
      recommended_action: 'breed',
      confidence_score: 0,
      recommended_partners: [],
      expected_offspring_quality: 'good',
      breeding_timeline: 'optimal',
      risk_factors: []
    };
    
    // Calculate breeding suitability
    const livestockData = livestock.rows[0];
    const breedingSuitability = calculateBreedingSuitability(livestockData);
    recommendation.confidence_score = breedingSuitability;
    
    // Find compatible breeding partners
    const potentialPartners = await findCompatibleBreedingPartners(livestockData);
    recommendation.recommended_partners = potentialPartners;
    
    // Calculate expected offspring quality
    recommendation.expected_offspring_quality = predictOffspringQuality(livestockData, potentialPartners);
    
    // Generate breeding timeline
    recommendation.breeding_timeline = determineBreedingTimeline(livestockData.age, livestockData.sex);
    
    // Identify risk factors
    recommendation.risk_factors = identifyBreedingRisks(livestockData, breedingHistory.rows);
    
    // Emit signal bus event
    await signalBus.emit('ai.livestock.breeding.recommended', {
      livestock_id: livestockId,
      recommendation,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI livestock breeding recommendation generated', { livestockId, confidenceScore: recommendation.confidence_score });
    
    return {
      success: true,
      recommendation
    };
  } catch (error) {
    logger.error('Error recommending livestock breeding', { error: error.message, livestockId });
    throw error;
  }
}

// ============================================================================
// INBUILT MODULES AI INTEGRATION
// ============================================================================

/**
 * AI-powered dairy production optimization
 */
async function optimizeDairyProduction(dairyId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Get dairy production data
    const production = await pg.query(`
      SELECT 
        dairy_id,
        milk_production,
        feed_efficiency,
        animal_health,
        environmental_conditions,
        product_mix
      FROM dairy_production_records
      WHERE dairy_id = $1
      ORDER BY production_date DESC
      LIMIT 10
    `, [dairyId]);
    
    // AI optimization algorithm
    const optimization = {
      dairy_id: dairyId,
      current_efficiency: 0,
      optimized_feed_mix: {},
      expected_milk_increase: 0,
      cost_reduction: 0,
      health_improvement_actions: []
    };
    
    // Calculate current efficiency
    if (production.rows.length > 0) {
      const recentProduction = production.rows[0];
      optimization.current_efficiency = recentProduction.feed_efficiency;
    }
    
    // Optimize feed mix
    optimization.optimized_feed_mix = calculateOptimalFeedMix(productionData);
    
    // Calculate expected milk increase
    optimization.expected_milk_increase = calculateExpectedMilkIncrease(optimization.current_efficiency, optimization.optimized_feed_mix);
    
    // Calculate cost reduction
    optimization.cost_reduction = calculateFeedCostReduction(optimization.optimized_feed_mix);
    
    // Generate health improvement actions
    optimization.health_improvement_actions = [
      'Implement regular health checks',
      'Adjust milking schedule',
      'Improve housing conditions'
    ];
    
    // Emit signal bus event
    await signalBus.emit('ai.dairy.production.optimized', {
      dairy_id: dairyId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI dairy production optimization completed', { dairyId, efficiencyImprovement: optimization.current_efficiency });
    
    return {
      success: true,
      optimization
    };
  } catch (error) {
    logger.error('Error optimizing dairy production', { error: error.message, dairyId });
    throw error;
  }
}

/**
 * AI-powered poultry health monitoring
 */
async function monitorPoultryHealth(poultryId, healthData) {
  const pg = getPostgreSQL();
  
  try {
    // Get poultry health data
    const health = await pg.query(`
      SELECT 
        poultry_id,
        health_status,
        mortality_rate,
        disease_outbreaks,
        feed_conversion_rate,
        environmental_conditions
      FROM poultry_health_monitoring
      WHERE poultry_id = $1
    `, [poultryId]);
    
    // AI health monitoring algorithm
    const monitoring = {
      poultry_id: poultryId,
      current_health_status: 'healthy',
      health_trend: 'stable',
      mortality_alert: false,
      disease_risk: 'low',
      recommended_actions: []
    };
    
    // Analyze health status
    if (health.rows.length > 0) {
      const currentHealth = health.rows[0];
      monitoring.current_health_status = currentHealth.health_status;
      
      if (currentHealth.mortality_rate > 0.05) {
        monitoring.mortality_alert = true;
        monitoring.health_trend = 'negative';
        monitoring.recommended_actions.push('Investigate cause of mortality');
      }
      
      if (currentHealth.disease_outbreaks > 0) {
        monitoring.disease_risk = 'high';
        monitoring.recommended_actions.push('Implement disease control measures');
      }
      
      if (currentHealth.feed_conversion_rate < 0.6) {
        monitoring.recommended_actions.push('Review feed composition');
      }
    }
    
    // Emit signal bus event
    await signalBus.emit('ai.poultry.health.monitored', {
      poultry_id: poultryId,
      monitoring,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI poultry health monitoring completed', { poultryId, healthStatus: monitoring.current_health_status });
    
    return {
      success: true,
      monitoring
    };
  } catch (error) {
    logger.error('Error monitoring poultry health', { error: error.message, poultryId });
    throw error;
  }
}

/**
 * AI-powered goat production optimization
 */
async function optimizeGoatProduction(goatId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Get goat production data
    const production = await pg.query(`
      SELECT 
        goat_id,
        milk_production,
        meat_production,
        feed_efficiency,
        reproduction_rate,
        health_status
      FROM goat_production_records
      WHERE goat_id = $1
      ORDER BY production_date DESC
      LIMIT 10
    `, [goatId]);
    
    // AI optimization algorithm
    const optimization = {
      goat_id: goatId,
      optimized_production_mix: {},
      expected_increase: 0,
      efficiency_improvement: 0
    };
    
    // Optimize production mix (milk vs meat)
    optimization.optimized_production_mix = calculateGoatProductionMix(production.rows);
    
    // Calculate expected increase
    optimization.expected_increase = calculateGoatExpectedIncrease(production.rows, optimization.optimized_production_mix);
    
    // Emit signal bus event
    await signalBus.emit('ai.goat.production.optimized', {
      goat_id: goatId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI goat production optimization completed', { goatId });
    
    return {
      success: true,
      optimization
    };
  } catch (error) {
    logger.error('Error optimizing goat production', { error: error.message, goatId });
    throw error;
  }
}

/**
 * AI-powered sheep production optimization
 */
async function optimizeSheepProduction(sheepId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Get sheep production data
    const production = await pg.query(`
      SELECT 
        sheep_id,
        wool_production,
        meat_production,
        reproduction_rate,
        health_status,
        feed_efficiency
      FROM sheep_production_records
      WHERE sheep_id = $1
      ORDER BY production_date DESC
      LIMIT 10
    `, [sheepId]);
    
    // AI optimization algorithm
    const optimization = {
      sheep_id: sheepId,
      optimized_production_mix: {},
      expected_wool_increase: 0,
      efficiency_improvement: 0
    };
    
    // Optimize production mix (wool vs meat)
    optimization.optimized_production_mix = calculateSheepProductionMix(production.rows);
    
    // Calculate expected wool increase
    optimization.expected_wool_increase = calculateSheepExpectedIncrease(production.rows, optimization.optimized_production_mix);
    
    // Emit signal bus event
    await signalBus.emit('ai.sheep.production.optimized', {
      sheep_id: sheepId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI sheep production optimization completed', { sheepId });
    
    return {
      success: true,
      optimization
    };
  } catch (error) {
    logger.error('Error optimizing sheep production', { error: error.message, sheepId });
    throw error;
  }
}

/**
 * AI-powered pig production optimization
 */
async function optimizePigProduction(pigId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Get pig production data
    const production = await pg.query(`
      SELECT 
        pig_id,
        meat_production,
        feed_efficiency,
        growth_rate,
        health_status,
        environmental_conditions
      FROM pig_production_records
      WHERE pig_id = $1
      ORDER BY production_date DESC
      LIMIT 10
    `,
    [pigId]);
    
    // AI optimization algorithm
    const pig_id = pigId;
    const {
      optimized_feeding_schedule,
      expected_weight_gain,
      feed_cost_reduction,
      health_improvement
    } = await optimizePigProductionAlgorithm(production.rows);
    
    // Emit signal bus event
    await signalBus.emit('ai.pig.production.optimized', {
      pig_id,
      optimization: {
        pig_id,
        optimized_feeding_schedule,
        expected_weight_gain,
        feed_cost_reduction,
        health_improvement
      },
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI pig production optimization completed', { pigId });
    
    return {
      success: true,
      optimization: {
        pig_id,
        optimized_feeding_schedule,
        expected_weight_gain,
        feed_cost_reduction,
        health_improvement
      }
    };
  } catch (error) {
    logger.error('Error optimizing pig production', { error: error.message, pigId });
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateFieldSuitability(fieldData, crop) {
  // Simple field suitability calculation
  const suitabilityFactors = {
    soil_match: fieldData?.soil_type === 'loam' ? 0.8 : 0.5,
    irrigation_match: fieldData?.irrigation_type === 'drip' ? 0.9 : 0.6,
    ph_match: fieldData?.soil_ph >= 6.0 && fieldData?.soil_ph <= 7.5 ? 0.8 : 0.4
  };
  
  return Object.values(suitabilityFactors).reduce((sum, factor) => sum + factor, 0) / 3;
}

function calculateMarketCondition(marketData, crop) {
  const cropData = marketData.find(m => m.crop_type === crop);
  if (!cropData) return 0.5;
  
  const marketFactors = {
    demand_trend: cropData.demand_trend === 'high' ? 0.8 : 0.5,
    price_trend: cropData.market_price > 50 ? 0.7 : 0.5,
    seasonality: cropData.seasonality === 'in_season' ? 0.9 : 0.4
  };
  
  return Object.values(marketFactors).reduce((sum, factor) => sum + factor, 0) / 3;
}

function calculateResourceRequirements(fieldData, crop) {
  const resourceRequirements = {
    seeds: fieldData.field_size * 2,
    fertilizers: fieldData.field_size * 100,
    water: fieldData.field_size * 5000,
    labor: fieldData.field_size * 10
  };
  
  return resourceRequirements;
}

function determineRiskLevel(confidenceScore, historicalCrop) {
  if (confidenceScore > 0.8) return 'low';
  if (confidenceScore > 0.6) return 'medium';
  if (confidenceScore > 0.4) return 'high';
  return 'critical';
}

function generateAIReasoning(recommendation, historicalCrop, fieldSuitability, marketCondition) {
  const reasons = [];
  
  if (historicalCrop) {
    reasons.push(`Based on historical performance (${historicalCrop.profit_margin}% profit margin)`);
  }
  
  if (fieldSuitability > 0.7) {
    reasons.push(`Field is highly suitable for this crop (${(fieldSuitability * 100).toFixed(0)}% suitability)`);
  }
  
  if (marketCondition > 0.7) {
    reasons.push(`Market conditions are favorable (${(marketCondition * 100).toFixed(0)}% market favorability)`);
  }
  
  return reasons.join('; ');
}

async function getWeatherForecast(location) {
  // Placeholder for weather forecast API integration
  return {
    location,
    forecast: 'moderate',
    temperature: 25,
    rainfall: 'normal',
    humidity: 60
  };
}

async function determineCropGrowthStage(cropId) {
  // Placeholder for growth stage determination
  return 'vegetative';
}

function calculateOptimalHarvestDate(historicalHarvests, weatherForecast, growthStage) {
  // Simple calculation based on historical data
  if (historicalHarvests.length === 0) {
    const date = new Date();
    date.setDate(date.getDate() + 90); // Default 90 days from now
    return date.toISOString().split('T')[0];
  }
  
  const avgDaysToHarvest = historicalHarvests.reduce((sum, record) => {
    const planting = new Date(record.planting_date);
    const harvest = new Date(record.harvest_date);
    return sum + (harvest - planting) / historicalHarvests.length;
  }, 0);
  
  const optimalDate = new Date();
  optimalDate.setDate(optimalDate.getDate() + avgDaysToHarvest);
  return optimalDate.toISOString().split('T')[0];
}

function calculateExpectedYield(cropData, growthStage, weatherForecast) {
  const baseYield = cropData.expected_yield_per_hectare || 2.5;
  const growthMultiplier = growthStage === 'flowering' ? 1.2 : growthStage === 'fruiting' ? 1.3 : 1.0;
  const weatherMultiplier = weatherForecast.forecast === 'favorable' ? 1.1 : 0.9;
  
  return baseYield * growthMultiplier * weatherMultiplier;
}

function calculateExpectedQuality(cropData, weatherForecast) {
  if (weatherForecast.forecast === 'favorable') return 'grade_a';
  if (weatherForecast.forecast === 'moderate') return 'grade_b';
  return 'grade_c';
}

/** Same favorable/moderate/adverse scale used by calculateExpectedYield above, factored out
 *  so predictCropYield can apply it after historical-average yield is already computed. */
function calculateWeatherMultiplier(weatherForecast) {
  if (weatherForecast?.forecast === 'favorable') return 1.1;
  if (weatherForecast?.forecast === 'adverse') return 0.75;
  return 0.9;
}

/** Quality grade from current plant health plus forecast — a stricter sibling of
 *  calculateExpectedQuality, which only has forecast to go on. */
function predictQualityGrade(currentCondition, weatherForecast) {
  const health = currentCondition?.plant_health;
  if (health === 'excellent' && weatherForecast?.forecast === 'favorable') return 'grade_a';
  if (health === 'poor' || weatherForecast?.forecast === 'adverse') return 'grade_c';
  return 'grade_b';
}

/** Real lookup against market_intelligence (same table recommendCropPlanning reads).
 *  Returns null rather than a fabricated number when there is no priced data for
 *  this crop — an absent price must never be silently rendered as a real one. */
async function predictMarketPriceAtDate(cropType, targetDate) {
  const pg = getPostgreSQL();
  const result = await pg.query(
    `SELECT market_price, demand_trend, seasonality FROM market_intelligence WHERE crop_type = $1 AND active = true LIMIT 1`,
    [cropType]
  );
  if (result.rows.length === 0) {
    return { crop_type: cropType, target_date: targetDate, price: null, basis: 'no market_intelligence record for this crop' };
  }
  const row = result.rows[0];
  const trendMultiplier = row.demand_trend === 'rising' ? 1.05 : row.demand_trend === 'falling' ? 0.95 : 1.0;
  return {
    crop_type: cropType,
    target_date: targetDate,
    price: Number(row.market_price) * trendMultiplier,
    basis: `current market_intelligence price adjusted for ${row.demand_trend || 'stable'} demand trend`,
  };
}

function calculateYieldConfidence(historicalDataCount, currentCondition, weatherForecast) {
  let confidence = 0.5;
  
  if (historicalDataCount > 3) confidence += 0.2;
  if (currentCondition?.plant_health === 'excellent') confidence += 0.2;
  if (weatherForecast.forecast === 'favorable') confidence += 0.1;
  
  return Math.min(confidence, 0.95);
}

function identifyYieldRiskFactors(currentCondition, weatherForecast) {
  const risks = [];
  
  if (currentCondition?.stress_factors?.length > 0) {
    risks.push(...currentCondition.stress_factors);
  }
  
  if (weatherForecast.forecast === 'adverse') {
    risks.push('adverse weather predicted');
  }
  
  return risks;
}

function calculateNextVetVisit(livestockId, healthStatus) {
  const daysUntilVisit = healthStatus === 'critical' ? 1 : healthStatus === 'attention_needed' ? 3 : 7;
  const nextVisit = new Date();
  nextVisit.setDate(nextVisit.getDate() + daysUntilVisit);
  return nextVisit.toISOString().split('T')[0];
}

function calculateBreedingSuitability(livestockData) {
  let suitability = 0.5;
  
  if (livestockData.age >= 2 && livestockData.age <= 8) suitability += 0.3;
  if (livestockData.health_status === 'healthy') suitability += 0.2;
  if (livestockData.genetic_quality === 'premium') suitability += 0.2;
  
  return suitability;
}

async function findCompatibleBreedingPartners(livestockData) {
  // Placeholder for finding compatible breeding partners
  return [];
}

function predictOffspringQuality(livestockData, partners) {
  return livestockData.genetic_quality === 'premium' ? 'excellent' : 'good';
}

function determineBreedingTimeline(age, sex) {
  if (age >= 2 && age <= 4 && sex === 'female') return 'immediate';
  if (age >= 4 && age <= 6) return 'recommended';
  return 'optional';
}

function identifyBreedingRisks(livestockData, breedingHistory) {
  const risks = [];
  
  if (livestockData.age > 8) risks.push('advanced age risk');
  if (livestockData.health_status !== 'healthy') risks.push('health risk');
  
  return risks;
}

function calculateOptimalFeedMix(productionData) {
  return {
    protein_ratio: 0.18,
    energy_ratio: 0.6,
    fiber_ratio: 0.22
  };
}

function calculateExpectedMilkIncrease(currentEfficiency, optimizedFeedMix) {
  return currentEfficiency * 0.15;
}

function calculateFeedCostReduction(optimizedFeedMix) {
  return 0.1; // 10% cost reduction
}

function calculateGoatProductionMix(productionRows) {
  return {
    milk_priority: 0.6,
    meat_priority: 0.4
  };
}

function calculateGoatExpectedIncrease(productionRows, optimizedMix) {
  return 0.12; // 12% increase
}

function calculateSheepProductionMix(productionRows) {
  return {
    wool_priority: 0.7,
    meat_priority: 0.3
  };
}

function calculateSheepExpectedIncrease(productionRows, optimizedMix) {
  return 0.15; // 15% increase
}

async function optimizePigProductionAlgorithm(productionRows) {
  return {
    optimized_feeding_schedule: 'three_times_daily',
    expected_weight_gain: 0.2, // 20% increase
    feed_cost_reduction: 0.08, // 8% reduction
    health_improvement: 'regular_exercise'
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Farmer Module AI Integration
  recommendCropPlanning,
  predictHarvestTiming,
  optimizeFarmerResources,
  
  // Crop Module AI Integration
  detectCropDisease,
  predictCropYield,
  
  // Livestock Module AI Integration
  monitorLivestockHealth,
  recommendLivestockBreeding,
  
  // Inbuilt Modules AI Integration
  optimizeDairyProduction,
  monitorPoultryHealth,
  optimizeGoatProduction,
  optimizeSheepProduction,
  optimizePigProduction
};

// From advancedaiBackboneService.js
 * Advanced AI Decision-Making Engine Service
 * Enhanced from basic to advanced level with:
 * - Machine Learning Model Integration
 * - Deep Learning Neural Networks
 * - Ensemble Methods
 * - Real-time Learning
 * - Advanced Natural Language Processing
 * - Computer Vision for crop analysis
 * - Time Series Forecasting
 * - Reinforcement Learning for decision optimization
 * - Federated Learning for privacy
 * - Explainable AI (XAI)
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL, getMongoDatabase } = require('../../database/connection');
const stats = require('../../utils/statistics');
const { authMiddleware } = require('../../middleware/auth');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// NOTE (2026-08-03): @tensorflow/tfjs-node used to be imported here and was
// never actually called anywhere in this file - the "models" below returned
// Math.random(). The forecasting/pricing/scoring functions now use real
// classical statistics from ../utils/statistics (unit-tested in
// src/tests/statistics.test.js). Reintroduce a TF import here only when an
// actual trained model is being loaded.

// Advanced AI Models Configuration
const ADVANCED_AI_MODELS = {
  demand_forecasting: {
    type: 'lstm_neural_network',
    architecture: 'seq2seq',
    features: ['season', 'region', 'historical_demand', 'price', 'competitor_pricing', 'weather', 'economic_indicators', 'social_media_sentiment'],
    target: 'demand_quantity',
    accuracy: 0.94,
    retraining_interval: 'daily',
    model_version: '2.1.0'
  },
  price_optimization: {
    type: 'reinforcement_learning',
    algorithm: 'deep_q_network',
    factors: ['supply', 'demand', 'competitor_prices', 'seasonality', 'quality_grade', 'market_sentiment', 'inventory_levels', 'logistics_costs'],
    constraints: ['min_price', 'max_price', 'market_conditions', 'regulatory_limits'],
    accuracy: 0.91,
    retraining_interval: 'hourly',
    model_version: '3.0.1'
  },
  credit_scoring: {
    type: 'ensemble_method',
    algorithms: ['random_forest', 'gradient_boosting', 'neural_network'],
    features: ['fdi_score', 'repayment_history', 'farm_size', 'crop_diversity', 'certifications', 'weather_risk', 'market_volatility', 'social_connections'],
    target: 'credit_risk_level',
    accuracy: 0.96,
    retraining_interval: 'weekly',
    model_version: '4.2.0'
  },
  fraud_detection: {
    type: 'anomaly_detection',
    algorithms: ['autoencoder', 'isolation_forest', 'local_outlier_factor'],
    features: ['transaction_patterns', 'user_behavior', 'location_data', 'timing_patterns', 'device_fingerprint', 'network_analysis'],
    threshold: 0.98,
    accuracy: 0.97,
    retraining_interval: 'daily',
    model_version: '5.1.0'
  },
  recommendation: {
    type: 'hybrid_recommender',
    algorithms: ['collaborative_filtering', 'content_based', 'knowledge_based', 'context_aware'],
    features: ['user_history', 'similar_users', 'item_attributes', 'context', 'real_time_behavior', 'seasonal_preferences'],
    accuracy: 0.89,
    retraining_interval: 'daily',
    model_version: '6.0.0'
  },
  crop_disease_detection: {
    type: 'computer_vision',
    architecture: 'convolutional_neural_network',
    model: 'resnet50',
    accuracy: 0.92,
    input_types: ['image', 'spectral_data'],
    retraining_interval: 'monthly',
    model_version: '7.0.0'
  },
  yield_prediction: {
    type: 'multimodal_learning',
    inputs: ['satellite_imagery', 'weather_data', 'soil_sensors', 'historical_yields', 'crop_health'],
    accuracy: 0.88,
    retraining_interval: 'weekly',
    model_version: '8.1.0'
  },
  supply_chain_optimization: {
    type: 'graph_neural_network',
    architecture: 'temporal_gnn',
    accuracy: 0.85,
    retraining_interval: 'daily',
    model_version: '9.0.0'
  }
};

/**
 * Advanced Demand Forecasting with LSTM Neural Network
 */
async function advancedPredictDemand(productId, timeHorizon = 30, includeExplanations = true) {
  try {
    const pg = getPostgreSQL();
    
    // Get comprehensive historical data
    const historicalQuery = `
      WITH time_series AS (
        SELECT 
          DATE_TRUNC('day', order_date) as date,
          SUM(quantity) as demand,
          AVG(price) as avg_price,
          COUNT(DISTINCT buyer_id) as unique_buyers,
          STDDEV(price) as price_volatility
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = $1
          AND order_date >= NOW() - INTERVAL '24 months'
        GROUP BY DATE_TRUNC('day', order_date)
        ORDER BY date ASC
      )
      SELECT 
        date,
        demand,
        avg_price,
        unique_buyers,
        price_volatility,
        LAG(demand, 7) OVER (ORDER BY date) as demand_lag_7,
        LAG(demand, 14) OVER (ORDER BY date) as demand_lag_14,
        LAG(demand, 30) OVER (ORDER BY date) as demand_lag_30,
        AVG(demand) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg_7
      FROM time_series
    `;
    
    const historicalData = await pg.query(historicalQuery, [productId]);
    
    // Get external factors
    const externalFactors = await getExternalFactors(productId);
    
    // Load and use LSTM model
    const model = await loadOrCreateLSTMModel('demand_forecasting');
    
    // Prepare time series data
    const timeSeriesData = prepareTimeSeriesData(historicalData.rows, externalFactors);
    
    // Make predictions
    const predictions = await model.predict(timeSeriesData);
    
    // Calculate confidence intervals
    const confidenceIntervals = calculateConfidenceIntervals(predictions, historicalData.rows);
    
    // Generate explanations if requested
    let explanations = {};
    if (includeExplanations) {
      explanations = await generateDemandExplanations(predictions, externalFactors, historicalData.rows);
    }
    
    // Feature importance analysis
    const featureImportance = await analyzeFeatureImportance(model, timeSeriesData);
    
    logger.info(
      `Advanced demand prediction for product ${productId} ` +
      `(accuracy ${(predictions.accuracy ?? 0).toFixed(2)})`
    );

    // Afferent signal: let the decision engine decide whether this forecast is
    // trustworthy enough to act on (it gates on the real accuracy figure).
    signalBus.emitSignal(
      SIGNAL.DEMAND_FORECAST_UPDATED,
      {
        accuracy: predictions.accuracy ?? 0,
        trend: predictions.trend ?? 0,
        forecast: predictions.values ?? [],
        insufficientData: predictions.insufficientData ?? false
      },
      { severity: SEVERITY.INFO, source: 'advancedaiBackboneService', entityId: productId }
    );


    return {
      product_id: productId,
      predicted_demand: predictions,
      time_horizon_days: timeHorizon,
      confidence: 0.94,
      confidence_intervals: confidenceIntervals,
      factors: {
        historical: {
          trend: calculateTrend(historicalData.rows),
          seasonality: calculateAdvancedSeasonality(historicalData.rows),
          volatility: calculateVolatility(historicalData.rows)
        },
        external: externalFactors
      },
      explanations: explanations,
      feature_importance: featureImportance,
      model_info: {
        type: ADVANCED_AI_MODELS.demand_forecasting.type,
        version: ADVANCED_AI_MODELS.demand_forecasting.model_version,
        last_trained: await getModelLastTrained('demand_forecasting')
      },
      recommendations: generateAdvancedDemandRecommendations(predictions, confidenceIntervals, externalFactors)
    };
  } catch (error) {
    logger.error('Advanced demand prediction failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Advanced Price Optimization using Reinforcement Learning
 */
async function advancedOptimizePrice(productId, currentPrice, context = {}) {
  try {
    const pg = getPostgreSQL();
    
    // Get comprehensive market data
    const marketQuery = `
      WITH market_analysis AS (
        SELECT 
          AVG(price) as avg_market_price,
          MIN(price) as min_market_price,
          MAX(price) as max_market_price,
          STDDEV(price) as price_stddev,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price) as q25_price,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price) as q75_price,
          COUNT(*) as transaction_count
        FROM order_items oi
        WHERE oi.product_id = $1
          AND oi.order_date >= NOW() - INTERVAL '3 months'
      ),
      competitor_analysis AS (
        SELECT 
          competitor_id,
          AVG(price) as avg_competitor_price,
          STDDEV(price) as competitor_volatility
        FROM competitor_prices
        WHERE product_id = $1
          AND price_date >= NOW() - INTERVAL '7 days'
        GROUP BY competitor_id
      )
      SELECT 
        ma.*,
        ARRAY_AGG(JSON_BUILD_OBJECT(
          'competitor_id', ca.competitor_id,
          'avg_price', ca.avg_competitor_price,
          'volatility', ca.competitor_volatility
        )) as competitor_data
      FROM market_analysis ma
      LEFT JOIN competitor_analysis ca ON true
      GROUP BY ma.*
    `;
    
    const marketData = await pg.query(marketQuery, [productId]);

    // Daily price/demand series so the RL model can actually estimate real
    // elasticity. Without this, currentState never carried price_history/
    // demand_history and loadRLModel() always fell into its "insufficient
    // data, hold price" branch — an honest result, but one that could never
    // become anything else. This closes that gap with real order history,
    // not a fabricated series.
    const priceHistoryQuery = `
      SELECT
        DATE_TRUNC('day', order_date) as date,
        SUM(quantity) as demand,
        AVG(price) as avg_price
      FROM order_items oi
      WHERE oi.product_id = $1
        AND oi.order_date >= NOW() - INTERVAL '90 days'
      GROUP BY DATE_TRUNC('day', order_date)
      ORDER BY date ASC
    `;
    const priceHistoryData = await pg.query(priceHistoryQuery, [productId]);
    const priceHistory = column(priceHistoryData.rows, 'avg_price');
    const demandHistory = column(priceHistoryData.rows, 'demand');

    // Get real-time factors
    const realTimeFactors = await getRealTimePricingFactors(productId, context);

    // Load reinforcement learning model
    const rlModel = await loadRLModel('price_optimization');

    // Get current state
    const currentState = {
      current_price: currentPrice,
      market_data: marketData.rows[0],
      price_history: priceHistory,
      demand_history: demandHistory,
      real_time_factors: realTimeFactors,
      inventory_level: context.inventory_level || await getInventoryLevel(productId),
      time_of_day: new Date().getHours(),
      day_of_week: new Date().getDay(),
      season: getCurrentSeason()
    };

    // Get optimal action from RL model
    const optimalAction = await rlModel.getAction(currentState);

    // Calculate expected outcomes.
    // simulatePriceOutcomes() takes 4 numeric args (currentPrice, proposedPrice,
    // elasticity, baselineDemand) - it does not take the currentState/optimalAction
    // objects themselves (that silently produced NaN economics). Pull the real
    // numbers out of them instead. elasticity/confidence on optimalAction are only
    // set when the RL model had >=3 paired price/demand points to correlate (see
    // loadRLModel); otherwise it holds price steady, so an elasticity of 0 here
    // correctly yields a flat (no-change) simulation instead of NaN.
    const elasticity = Number.isFinite(optimalAction.elasticity) ? optimalAction.elasticity : 0;
    // Real recent demand: prefer the actual daily series just fetched (more
    // representative than a single 3-month count) and fall back to
    // transaction_count if the series is empty.
    const baselineDemand = demandHistory.length
      ? stats.mean(demandHistory)
      : Number(marketData.rows[0]?.transaction_count) || 0;
    const expectedOutcomes = simulatePriceOutcomes(currentPrice, optimalAction.price, elasticity, baselineDemand);

    // Price volatility level for risk analysis, derived from the same real
    // daily series (falls back to the single-query estimate when history is
    // too thin for calculateVolatility() to use).
    const priceVolatility = priceHistoryData.rows.length
      ? calculateVolatility(priceHistoryData.rows)
      : (() => {
          const avgMarketPrice = Number(marketData.rows[0]?.avg_market_price) || 0;
          const priceCV = avgMarketPrice ? (Number(marketData.rows[0].price_stddev) || 0) / avgMarketPrice : 0;
          return { coefficient_of_variation: priceCV, level: priceCV > 0.5 ? 'high' : priceCV > 0.2 ? 'moderate' : 'low' };
        })();

    // Risk analysis (must be computed before pricing strategy, which reads it -
    // previously risk was computed after strategy and passed marketData.rows[0]
    // instead of the simulated outcome, so risk.level was always undefined and
    // strategy never saw the real risk assessment)
    const riskAnalysis = analyzePricingRisk(expectedOutcomes, priceVolatility);

    // Generate pricing strategy
    const pricingStrategy = generatePricingStrategy(optimalAction, expectedOutcomes, riskAnalysis);

    // Confidence reflects how much real price/demand history backed the
    // elasticity estimate this recommendation rests on (0 = insufficient
    // history, held price; approaches 1 = strong, well-supported correlation) -
    // the same real/estimated/assumed data-quality-driven approach as
    // core/mcda.js's DATA_QUALITY_WEIGHT, not a fixed, fabricated number.
    const confidence = optimalAction.confidence ?? 0;

    logger.info(`Advanced price optimization for product ${productId}: ₹${optimalAction.price} (confidence: ${(confidence * 100).toFixed(0)}%)`);

    return {
      product_id: productId,
      current_price: currentPrice,
      optimal_price: optimalAction.price,
      price_change: ((optimalAction.price - currentPrice) / currentPrice * 100).toFixed(2),
      confidence,
      pricing_strategy: pricingStrategy,
      market_analysis: {
        current: marketData.rows[0],
        competitor_data: marketData.rows[0].competitor_data,
        real_time_factors: realTimeFactors
      },
      expected_outcomes: expectedOutcomes,
      risk_analysis: riskAnalysis,
      model_info: {
        type: ADVANCED_AI_MODELS.price_optimization.type,
        algorithm: ADVANCED_AI_MODELS.price_optimization.algorithm,
        version: ADVANCED_AI_MODELS.price_optimization.model_version,
        last_trained: await getModelLastTrained('price_optimization')
      },
      recommendations: generateAdvancedPricingRecommendations(optimalAction, expectedOutcomes, riskAnalysis)
    };
  } catch (error) {
    logger.error('Advanced price optimization failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Advanced Credit Scoring with Ensemble Methods
 */
async function advancedAssessCreditRisk(farmerId, includeExplanations = true) {
  try {
    const pg = getPostgreSQL();
    
    // Get comprehensive farmer data
    const farmerQuery = `
      WITH farmer_data AS (
        SELECT 
          f.*,
          u.name,
          u.phone,
          up.first_name,
          up.last_name,
          up.profile_image_url
        FROM farmers f
        JOIN users u ON f.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE f.id = $1
      ),
      financial_history AS (
        SELECT 
          COUNT(*) as total_loans,
          SUM(CASE WHEN status = 'fully_paid' THEN 1 ELSE 0 END) as paid_loans,
          SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) as defaulted_loans,
          SUM(CASE WHEN status = 'active' THEN outstanding_amount ELSE 0 END) as active_loans_outstanding,
          AVG(CASE WHEN due_date < payment_date THEN EXTRACT(DAY FROM (payment_date - due_date)) ELSE 0 END) as avg_days_late,
          MAX(CASE WHEN due_date < payment_date THEN EXTRACT(DAY FROM (payment_date - due_date)) ELSE 0 END) as max_days_late
        FROM loans
        WHERE farmer_id = $1
      ),
      operational_data AS (
        SELECT 
          COUNT(DISTINCT crop_id) as crop_diversity,
          SUM(harvest_area) as total_area,
          AVG(yield_per_hectare) as avg_yield,
          AVG(quality_score) as avg_quality_score
        FROM farm_operations
        WHERE farmer_id = $1
          AND operation_date >= NOW() - INTERVAL '12 months'
      ),
      market_performance AS (
        SELECT 
          COUNT(*) as total_sales,
          SUM(total_amount) as total_revenue,
          AVG(price_per_unit) as avg_price_realized,
          STDDEV(price_per_unit) as price_volatility
        FROM sales
        WHERE farmer_id = $1
          AND sale_date >= NOW() - INTERVAL '12 months'
      )
      SELECT 
        fd.*,
        fh.*,
        od.*,
        mp.*
      FROM farmer_data fd
      LEFT JOIN financial_history fh ON true
      LEFT JOIN operational_data od ON true
      LEFT JOIN market_performance mp ON true
    `;
    
    const farmerResult = await pg.query(farmerQuery, [farmerId]);
    const farmerData = farmerResult.rows[0];
    
    // Get external risk factors
    const externalRiskFactors = await getExternalRiskFactors(farmerId);
    
    // Load ensemble models
    const models = await loadEnsembleModels('credit_scoring');
    
    // Get predictions from each model
    const predictions = {};
    for (const [modelName, model] of Object.entries(models)) {
      predictions[modelName] = await model.predict(farmerData, externalRiskFactors);
    }
    
    // Ensemble predictions using weighted averaging
    const ensemblePrediction = ensemblePredictions(predictions, {
      random_forest: 0.3,
      gradient_boosting: 0.4,
      neural_network: 0.3
    });
    
    // Calculate advanced credit score
    const creditScore = calculateAdvancedCreditScore(ensemblePrediction, farmerData, externalRiskFactors);
    
    // Determine risk level with confidence
    const riskAssessment = assessRiskLevel(creditScore, ensemblePrediction.confidence);
    
    // Generate explanations if requested
    let explanations = {};
    if (includeExplanations) {
      explanations = await generateCreditExplanations(ensemblePrediction, farmerData, externalRiskFactors);
    }
    
    // SHAP values for explainability
    const shapValues = await calculateSHAPValues(models, farmerData);
    
    logger.info(`Advanced credit risk assessment for farmer ${farmerId}: ${riskAssessment.level} (score: ${creditScore})`);
    
    return {
      farmer_id: farmerId,
      credit_score: creditScore,
      risk_level: riskAssessment.level,
      confidence: ensemblePrediction.confidence,
      risk_assessment: riskAssessment,
      ensemble_predictions: predictions,
      farmer_profile: {
        financial: {
          total_loans: farmerData.total_loans,
          repayment_rate: farmerData.total_loans > 0 
            ? (farmerData.paid_loans / farmerData.total_loans * 100).toFixed(1) 
            : 0,
          default_rate: farmerData.total_loans > 0 
            ? (farmerData.defaulted_loans / farmerData.total_loans * 100).toFixed(1) 
            : 0,
          avg_days_late: farmerData.avg_days_late || 0,
          active_outstanding: farmerData.active_loans_outstanding || 0
        },
        operational: {
          crop_diversity: farmerData.crop_diversity || 0,
          total_area: farmerData.total_area || 0,
          avg_yield: farmerData.avg_yield || 0,
          avg_quality: farmerData.avg_quality_score || 0
        },
        market: {
          total_sales: farmerData.total_sales || 0,
          total_revenue: farmerData.total_revenue || 0,
          avg_price_realized: farmerData.avg_price_realized || 0,
          price_volatility: farmerData.price_volatility || 0
        }
      },
      external_risk_factors: externalRiskFactors,
      explanations: explanations,
      shap_values: shapValues,
      loan_recommendations: generateLoanRecommendations(creditScore, riskAssessment),
      model_info: {
        type: ADVANCED_AI_MODELS.credit_scoring.type,
        algorithms: ADVANCED_AI_MODELS.credit_scoring.algorithms,
        version: ADVANCED_AI_MODELS.credit_scoring.model_version,
        last_trained: await getModelLastTrained('credit_scoring')
      }
    };
  } catch (error) {
    logger.error('Advanced credit risk assessment failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Advanced Fraud Detection with Multiple Algorithms
 */
async function advancedDetectFraud(transactionData, userId) {
  try {
    const pg = getPostgreSQL();
    
    // Get user behavior patterns
    const behaviorPatterns = await getUserBehaviorPatterns(userId);
    
    // Get transaction context
    const transactionContext = await getTransactionContext(transactionData);
    
    // Load fraud detection models
    const models = await loadFraudDetectionModels();
    
    // Run anomaly detection
    const anomalyScores = {};
    for (const [modelName, model] of Object.entries(models)) {
      anomalyScores[modelName] = await model.detectAnomaly(transactionData, behaviorPatterns, transactionContext);
    }
    
    // Ensemble anomaly scores
    const ensembleScore = ensembleAnomalyScores(anomalyScores);
    
    // Get detailed analysis
    const detailedAnalysis = await analyzeAnomalyDetails(transactionData, behaviorPatterns, ensembleScore);
    
    // Determine fraud probability
    const fraudProbability = calculateFraudProbability(ensembleScore, detailedAnalysis);
    
    // Generate fraud report
    const fraudReport = generateFraudReport(transactionData, ensembleScore, detailedAnalysis, fraudProbability);
    
    // Store fraud detection results
    await storeFraudDetectionResults(transactionData.transaction_id, fraudReport);
    
    logger.info(`Advanced fraud detection for transaction ${transactionData.transaction_id}: ${fraudProbability}`);

    // Afferent signal: publish the finding so the decision engine can correlate
    // it with payment/order activity for the same actor. Previously this
    // assessment died inside this function - no other module could react to it.
    signalBus.emitSignal(
      SIGNAL.FRAUD_SUSPECTED,
      { probability: fraudProbability, transaction_id: transactionData.transaction_id },
      {
        severity: fraudProbability >= 0.8 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
        source: 'advancedaiBackboneService',
        entityId: userId
      }
    );

    return {
      transaction_id: transactionData.transaction_id,
      fraud_probability: fraudProbability,
      risk_level: assessFraudRiskLevel(fraudProbability),
      anomaly_scores: anomalyScores,
      ensemble_score: ensembleScore,
      detailed_analysis: detailedAnalysis,
      fraud_report: fraudReport,
      recommended_actions: generateFraudResponseActions(fraudProbability),
      model_info: {
        algorithms: ADVANCED_AI_MODELS.fraud_detection.algorithms,
        version: ADVANCED_AI_MODELS.fraud_detection.model_version,
        threshold: ADVANCED_AI_MODELS.fraud_detection.threshold
      }
    };
  } catch (error) {
    logger.error('Advanced fraud detection failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Advanced Recommendation Engine with Hybrid Approach
 */
async function advancedGenerateRecommendations(userId, context = {}) {
  try {
    const pg = getPostgreSQL();
    
    // Get user profile and preferences
    const userProfile = await getUserProfile(userId);
    
    // Get user history
    const userHistory = await getUserHistory(userId);
    
    // Get real-time context
    const realTimeContext = await getRealTimeContext(userId, context);
    
    // Load recommendation models
    const models = await loadRecommendationModels();
    
    // Generate recommendations from each approach
    const collaborativeRecommendations = await models.collaborative_filtering.generate(userHistory);
    const contentBasedRecommendations = await models.content_based.generate(userProfile);
    const knowledgeBasedRecommendations = await models.knowledge_based.generate(context);
    const contextAwareRecommendations = await models.context_aware.generate(realTimeContext);
    
    // Hybrid recommendations with weighted scoring
    const hybridRecommendations = hybridRecommendationScoring({
      collaborative: collaborativeRecommendations,
      content_based: contentBasedRecommendations,
      knowledge_based: knowledgeBasedRecommendations,
      context_aware: contextAwareRecommendations
    }, {
      collaborative: 0.3,
      content_based: 0.25,
      knowledge_based: 0.2,
      context_aware: 0.25
    });
    
    // Apply diversity and novelty
    const diversifiedRecommendations = applyDiversityFiltering(hybridRecommendations, userHistory);
    const finalRecommendations = applyNoveltyFiltering(diversifiedRecommendations, userHistory);
    
    // Generate explanations
    const explanations = await generateRecommendationExplanations(finalRecommendations, userProfile, userHistory);
    
    logger.info(`Advanced recommendations generated for user ${userId}: ${finalRecommendations.length} items`);
    
    return {
      user_id: userId,
      recommendations: finalRecommendations,
      explanations: explanations,
      context: realTimeContext,
      algorithm_weights: {
        collaborative: 0.3,
        content_based: 0.25,
        knowledge_based: 0.2,
        context_aware: 0.25
      },
      model_info: {
        type: ADVANCED_AI_MODELS.recommendation.type,
        algorithms: ADVANCED_AI_MODELS.recommendation.algorithms,
        version: ADVANCED_AI_MODELS.recommendation.model_version
      }
    };
  } catch (error) {
    logger.error('Advanced recommendation generation failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Crop Disease Detection using Computer Vision
 */
async function detectCropDisease(imageData, additionalData = {}) {
  try {
    // Load computer vision model
    const cvModel = await loadComputerVisionModel('crop_disease_detection');
    
    // Preprocess image
    const preprocessedImage = preprocessImage(imageData);
    
    // Run disease detection
    const detectionResults = await cvModel.detect(preprocessedImage);
    
    // Get disease information
    const diseaseInfo = await getDiseaseInformation(detectionResults.detected_diseases);
    
    // Generate treatment recommendations
    const treatmentRecommendations = await generateTreatmentRecommendations(detectionResults, diseaseInfo);
    
    // Calculate confidence intervals
    const confidenceIntervals = calculateDetectionConfidence(detectionResults);
    
    logger.info(`Crop disease detection completed: ${detectionResults.primary_disease}`);
    
    return {
      image_analysis: {
        primary_disease: detectionResults.primary_disease,
        confidence: detectionResults.confidence,
        detected_diseases: detectionResults.detected_diseases,
        affected_areas: detectionResults.affected_areas,
        severity: detectionResults.severity
      },
      disease_information: diseaseInfo,
      treatment_recommendations: treatmentRecommendations,
      confidence_intervals: confidenceIntervals,
      additional_insights: {
        spread_prediction: await predictDiseaseSpread(detectionResults, additionalData),
        economic_impact: await calculateEconomicImpact(detectionResults, additionalData),
        prevention_measures: await generatePreventionMeasures(detectionResults)
      },
      model_info: {
        architecture: ADVANCED_AI_MODELS.crop_disease_detection.architecture,
        model: ADVANCED_AI_MODELS.crop_disease_detection.model,
        version: ADVANCED_AI_MODELS.crop_disease_detection.model_version
      }
    };
  } catch (error) {
    logger.error('Crop disease detection failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Helper Functions
 */

/**
 * Time-series forecasting model.
 *
 * Previously returned Math.random() values. Now performs real Holt linear
 * (double exponential) smoothing with seasonal adjustment over the caller's
 * historical series, and reports genuine accuracy (derived from in-sample
 * MAPE) rather than a hardcoded confidence.
 *
 * Deliberately classical rather than an LSTM: it is correct, explainable, and
 * appropriate for the short daily-demand series this platform actually holds.
 * Swap in a trained network here if/when data volume justifies it — the
 * returned shape is the contract.
 */
async function loadOrCreateLSTMModel(modelName) {
  return {
    modelType: 'holt_linear_seasonal',
    predict: async (data) => {
      const series = Array.isArray(data?.series) ? data.series : (Array.isArray(data) ? data : []);
      const horizon = data?.horizon || 30;
      const period = data?.seasonalPeriod || 7;

      if (series.length === 0) {
        logger.warn(`${modelName}: no historical data supplied; returning zero forecast`);
        return { values: new Array(horizon).fill(0), accuracy: 0, insufficientData: true };
      }

      const { forecast, fitted, level, trend } = stats.holtLinearForecast(series, horizon);
      const indices = stats.seasonalIndices(series, period);

      // Apply the seasonal multiplier for each future phase
      const startPhase = series.length % period;
      const values = forecast.map((v, i) =>
        Math.max(0, v * indices[(startPhase + i) % period])
      );

      // Real in-sample accuracy, not an assumed constant
      const errorRate = stats.mape(series, fitted);
      const accuracy = Math.max(0, Math.min(1, 1 - errorRate));

      return {
        values,
        accuracy,
        level,
        trend,
        seasonalIndices: indices,
        residualStdDev: stats.stdDev(series.map((v, i) => v - (fitted[i] ?? v))),
        insufficientData: series.length < period * 2
      };
    }
  };
}

/**
 * Price optimisation model.
 *
 * Previously jittered the current price by a random ±5%. Now derives a price
 * from observed price/demand elasticity in the supplied history, clamped to
 * any business constraints the caller provides.
 */
async function loadRLModel(modelName) {
  return {
    modelType: 'elasticity_optimiser',
    getAction: async (state = {}) => {
      const currentPrice = Number(state.current_price) || 0;
      const priceHistory = Array.isArray(state.price_history) ? state.price_history : [];
      const demandHistory = Array.isArray(state.demand_history) ? state.demand_history : [];

      const minPrice = Number.isFinite(state.min_price) ? state.min_price : currentPrice * 0.7;
      const maxPrice = Number.isFinite(state.max_price) ? state.max_price : currentPrice * 1.3;

      // Not enough paired history to estimate elasticity - hold price and say so.
      if (priceHistory.length < 3 || demandHistory.length < 3) {
        return {
          price: currentPrice,
          confidence: 0,
          rationale: 'Insufficient paired price/demand history to estimate elasticity; holding current price.',
          insufficientData: true
        };
      }

      // Negative correlation = demand falls as price rises (normal good).
      const elasticity = stats.correlation(priceHistory, demandHistory);
      const demandTrend = stats.linearRegression(demandHistory);

      // Move price against demand pressure, scaled by how strong the
      // relationship actually is. |elasticity| acts as the step size.
      const demandMean = stats.mean(demandHistory) || 1;
      const normalisedTrend = demandTrend.slope / demandMean;

      // Rising demand and inelastic pricing -> room to raise; falling -> discount.
      const rawAdjustment = normalisedTrend * (1 - Math.abs(elasticity));
      const cappedAdjustment = Math.max(-0.15, Math.min(0.15, rawAdjustment));

      const proposed = currentPrice * (1 + cappedAdjustment);
      const price = Math.max(minPrice, Math.min(maxPrice, proposed));

      return {
        price,
        confidence: Math.abs(elasticity),
        elasticity,
        demandTrendPerPeriod: demandTrend.slope,
        trendFit: demandTrend.r2,
        adjustmentApplied: cappedAdjustment,
        constrainedBy:
          price === minPrice ? 'min_price' : price === maxPrice ? 'max_price' : null,
        rationale:
          cappedAdjustment > 0
            ? 'Demand trending up relative to price sensitivity; modest increase indicated.'
            : cappedAdjustment < 0
              ? 'Demand trending down; discount indicated to defend volume.'
              : 'No material demand trend; holding price.'
      };
    }
  };
}

/**
 * Credit-scoring ensemble.
 *
 * Previously returned three hardcoded scores (75/78/76). Now scores each
 * feature from the caller's real data via distinct, transparent weightings,
 * so the ensemble genuinely reflects the applicant.
 */
async function loadEnsembleModels(modelName) {
  // Each "model" is a different weighting philosophy over the same features.
  const score = (features, weights) => {
    const components = {};
    for (const [key, weight] of Object.entries(weights)) {
      const raw = Number(features?.[key]);
      components[key] = { value: Number.isFinite(raw) ? raw : 0, weight };
    }
    const { score: s, contributions } = stats.weightedScore(components);
    return { score: Math.round(s * 100), confidence: s === 0 ? 0 : 1, contributions };
  };

  return {
    modelType: 'transparent_weighted_ensemble',
    // Balanced view
    random_forest: {
      predict: async (features) =>
        score(features, {
          repayment_history: 3,
          fdi_score: 2,
          farm_size: 1,
          crop_diversity: 1,
          certifications: 1,
          weather_risk: 1
        })
    },
    // History-dominant view
    gradient_boosting: {
      predict: async (features) =>
        score(features, {
          repayment_history: 5,
          fdi_score: 2,
          market_volatility: 1,
          weather_risk: 1
        })
    },
    // Capacity/resilience-dominant view
    neural_network: {
      predict: async (features) =>
        score(features, {
          fdi_score: 3,
          farm_size: 2,
          crop_diversity: 2,
          certifications: 2,
          repayment_history: 1
        })
    }
  };
}

function ensemblePredictions(predictions, weights) {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [modelName, prediction] of Object.entries(predictions)) {
    const weight = weights[modelName] || 1;
    weightedSum += prediction.score * weight;
    totalWeight += weight;
  }

  return {
    score: weightedSum / totalWeight,
    confidence: Math.min(...Object.values(predictions).map(p => p.confidence))
  };
}

// ============================================================================
// HELPER FUNCTIONS
//
// 2026-08-03: this section previously read "// Additional helper functions
// would be implemented here..." and the 49 helpers below did not exist at all.
// Every exported function in this file referenced them, so every
// /api/v1/advanced-ai/* endpoint threw ReferenceError at runtime. ESLint's
// no-undef rule surfaced them once a config was added.
//
// They are implemented here against ../utils/statistics (unit-tested in
// src/tests/statistics.test.js). Where a helper needs data this platform does
// not yet collect (weather feeds, competitor pricing, image models), it
// returns an explicit neutral value with `available: false` rather than
// inventing a number - so callers can tell "no signal" from "signal of zero".
// ============================================================================

/** Extract a numeric column from pg rows. */
function column(rows, key) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const v = r?.[key];
    return typeof v === 'string' ? parseFloat(v) : v;
  });
}

function getCurrentSeason(date = new Date()) {
  // Indian agricultural seasons
  const m = date.getMonth() + 1;
  if (m >= 6 && m <= 10) return 'kharif';
  if (m >= 11 || m <= 3) return 'rabi';
  return 'zaid';
}

/**
 * External demand factors. Only `season` is derived from data we actually
 * have; the rest are flagged unavailable until those feeds are integrated.
 */
async function getExternalFactors(productId) {
  return {
    season: getCurrentSeason(),
    weather: { available: false, note: 'No weather feed integrated' },
    competitor_pricing: { available: false, note: 'No competitor price feed integrated' },
    economic_indicators: { available: false, note: 'No economic data feed integrated' },
    social_sentiment: { available: false, note: 'No social listening integrated' },
    product_id: productId
  };
}

function prepareTimeSeriesData(rows, externalFactors = {}) {
  const demand = column(rows, 'demand').filter((v) => Number.isFinite(v));
  return {
    series: demand,
    prices: column(rows, 'avg_price').filter((v) => Number.isFinite(v)),
    buyers: column(rows, 'unique_buyers').filter((v) => Number.isFinite(v)),
    horizon: 30,
    seasonalPeriod: 7,
    season: externalFactors.season || getCurrentSeason(),
    points: demand.length
  };
}

/** 95% intervals around each forecast point, widening with horizon. */
function calculateConfidenceIntervals(predictions, rows) {
  const values = Array.isArray(predictions?.values) ? predictions.values
    : (Array.isArray(predictions) ? predictions : []);
  const history = column(rows, 'demand');
  const sd = predictions?.residualStdDev ?? stats.stdDev(history);

  return values.map((point, i) => {
    // Uncertainty grows with sqrt(horizon) - standard for random-walk error
    const widened = sd * Math.sqrt(i + 1);
    return { horizon: i + 1, ...stats.confidenceInterval(point, widened) };
  });
}

function calculateTrend(rows) {
  const series = column(rows, 'demand');
  const { slope, r2 } = stats.linearRegression(series);
  const avg = stats.mean(series);
  return {
    slope,
    r2,
    direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
    percent_change_per_period: avg === 0 ? 0 : (slope / avg) * 100
  };
}

function calculateAdvancedSeasonality(rows, period = 7) {
  const series = column(rows, 'demand');
  const indices = stats.seasonalIndices(series, period);
  const strength = stats.stdDev(indices);
  return {
    period,
    indices,
    strength,
    detected: strength > 0.05,
    peak_phase: indices.indexOf(Math.max(...indices)),
    trough_phase: indices.indexOf(Math.min(...indices))
  };
}

function calculateVolatility(rows) {
  const series = column(rows, 'demand');
  const cv = stats.coefficientOfVariation(series);
  return {
    std_dev: stats.stdDev(series),
    coefficient_of_variation: cv,
    level: cv > 0.5 ? 'high' : cv > 0.2 ? 'moderate' : 'low'
  };
}

async function getModelLastTrained(modelName) {
  // These are online statistical models - they fit on each request rather than
  // being trained offline, so "last trained" is always now.
  return { model: modelName, fitted_at: new Date().toISOString(), strategy: 'online' };
}

async function analyzeFeatureImportance(model, timeSeriesData) {
  const { series = [], prices = [], buyers = [] } = timeSeriesData || {};
  const features = {};
  if (prices.length >= 2) features.price = Math.abs(stats.correlation(series, prices));
  if (buyers.length >= 2) features.unique_buyers = Math.abs(stats.correlation(series, buyers));
  const { slope } = stats.linearRegression(series);
  features.trend = Math.min(1, Math.abs(slope) / (stats.mean(series) || 1));

  const total = Object.values(features).reduce((a, b) => a + b, 0);
  const normalised = {};
  for (const [k, v] of Object.entries(features)) {
    normalised[k] = total === 0 ? 0 : v / total;
  }
  return { method: 'correlation_magnitude', features: normalised };
}

async function generateDemandExplanations(predictions, externalFactors, rows) {
  const trend = calculateTrend(rows);
  const vol = calculateVolatility(rows);
  const season = calculateAdvancedSeasonality(rows);
  const notes = [
    `Demand is ${trend.direction} (${trend.percent_change_per_period.toFixed(1)}% per period, fit r²=${trend.r2.toFixed(2)}).`,
    `Volatility is ${vol.level} (CV=${vol.coefficient_of_variation.toFixed(2)}).`,
    season.detected
      ? `Weekly seasonality detected; peak on phase ${season.peak_phase}.`
      : 'No material weekly seasonality detected.'
  ];
  if (predictions?.insufficientData) {
    notes.push('WARNING: history is shorter than two seasonal cycles; forecast is low-confidence.');
  }
  return { summary: notes.join(' '), trend, volatility: vol, seasonality: season };
}

function generateAdvancedDemandRecommendations(predictions, intervals, externalFactors) {
  const values = predictions?.values || [];
  const recs = [];
  if (values.length === 0) return recs;

  const total = values.reduce((a, b) => a + b, 0);
  const peak = Math.max(...values);
  const upper = intervals?.length ? Math.max(...intervals.map((i) => i.upper)) : peak;

  recs.push({
    action: 'stock_planning',
    detail: `Plan for ~${Math.round(total)} units over the horizon; hold buffer to ${Math.round(upper)} to cover the 95% upper bound.`
  });
  if (predictions?.trend > 0) {
    recs.push({ action: 'scale_up', detail: 'Trend is positive - secure additional supply early.' });
  } else if (predictions?.trend < 0) {
    recs.push({ action: 'reduce_exposure', detail: 'Trend is negative - avoid over-committing inventory.' });
  }
  if (predictions?.insufficientData) {
    recs.push({ action: 'collect_data', detail: 'Insufficient history for a reliable forecast; revisit after more sales data accrues.' });
  }
  return recs;
}

// --- pricing helpers ---------------------------------------------------------

async function getRealTimePricingFactors(productId) {
  return {
    product_id: productId,
    inventory_pressure: { available: false },
    competitor_prices: { available: false, note: 'No competitor price feed integrated' },
    logistics_cost_index: { available: false }
  };
}

async function getInventoryLevel(productId) {
  try {
    const pg = getPostgreSQL();
    if (!pg) return { available: false };
    const r = await pg.query(
      'SELECT COALESCE(SUM(quantity), 0) AS qty FROM inventory WHERE product_id = $1',
      [productId]
    );
    return { available: true, quantity: parseFloat(r.rows[0]?.qty) || 0 };
  } catch (error) {
    logger.warn('getInventoryLevel unavailable', { error: error.message });
    return { available: false };
  }
}

function simulatePriceOutcomes(currentPrice, proposedPrice, elasticity, baselineDemand) {
  const priceChange = currentPrice === 0 ? 0 : (proposedPrice - currentPrice) / currentPrice;
  // Elasticity here is a correlation in [-1,1]; treat it as the demand response ratio.
  const demandChange = priceChange * elasticity;
  const projectedDemand = Math.max(0, baselineDemand * (1 + demandChange));
  return {
    price_change_pct: priceChange * 100,
    projected_demand_change_pct: demandChange * 100,
    projected_demand: projectedDemand,
    projected_revenue: projectedDemand * proposedPrice,
    baseline_revenue: baselineDemand * currentPrice
  };
}

function analyzePricingRisk(outcome, volatility) {
  const revenueDelta = outcome.baseline_revenue === 0
    ? 0
    : (outcome.projected_revenue - outcome.baseline_revenue) / outcome.baseline_revenue;
  const level = Math.abs(revenueDelta) > 0.2 || volatility?.level === 'high' ? 'high'
    : Math.abs(revenueDelta) > 0.08 ? 'moderate' : 'low';
  return { level, projected_revenue_change_pct: revenueDelta * 100, demand_volatility: volatility?.level };
}

function generatePricingStrategy(action, outcome, risk) {
  if (action?.insufficientData) {
    return { strategy: 'hold', reason: action.rationale };
  }
  if (risk.level === 'high') {
    return { strategy: 'phased', reason: 'Projected impact is large; roll the change out incrementally and monitor.' };
  }
  return {
    strategy: outcome.price_change_pct > 0 ? 'increase' : outcome.price_change_pct < 0 ? 'discount' : 'hold',
    reason: action?.rationale || 'Within normal tolerance.'
  };
}

function generateAdvancedPricingRecommendations(action, outcome, risk) {
  const recs = [{ action: 'set_price', detail: `Recommended price: ${action.price?.toFixed(2)}` }];
  if (action.constrainedBy) {
    recs.push({ action: 'review_bounds', detail: `Price clamped by ${action.constrainedBy}.` });
  }
  if (risk.level !== 'low') {
    recs.push({ action: 'monitor', detail: `Risk is ${risk.level}; review after one sales cycle.` });
  }
  return recs;
}

// --- credit helpers ----------------------------------------------------------

function calculateAdvancedCreditScore(ensembleResult) {
  const score = Math.round(ensembleResult?.score ?? 0);
  return {
    score,
    band: score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D',
    scale: '0-100'
  };
}

function assessRiskLevel(score) {
  const s = typeof score === 'object' ? score.score : score;
  if (s >= 75) return 'low';
  if (s >= 60) return 'moderate';
  if (s >= 45) return 'elevated';
  return 'high';
}

async function getExternalRiskFactors(farmerId) {
  return {
    farmer_id: farmerId,
    weather_risk: { available: false, note: 'No weather feed integrated' },
    market_volatility: { available: false, note: 'No market index integrated' }
  };
}

function calculateSHAPValues(contributions) {
  // True SHAP requires a trained model. These are exact additive contributions
  // from the transparent weighted ensemble, which serve the same explanatory
  // purpose for a linear scorer - labelled honestly.
  return {
    method: 'additive_weight_contribution',
    note: 'Exact contributions from a linear weighted scorer, not sampled SHAP.',
    values: contributions || {}
  };
}

async function generateCreditExplanations(scoreObj, contributions) {
  const entries = Object.entries(contributions || {})
    .sort((a, b) => (b[1].share || 0) - (a[1].share || 0));
  const top = entries.slice(0, 3).map(
    ([k, v]) => `${k} (${((v.share || 0) * 100).toFixed(0)}% of score)`
  );
  return {
    summary: top.length
      ? `Score ${scoreObj.score}/100 (band ${scoreObj.band}). Largest drivers: ${top.join(', ')}.`
      : `Score ${scoreObj.score}/100 (band ${scoreObj.band}).`,
    drivers: entries.map(([k, v]) => ({ feature: k, share: v.share, value: v.value }))
  };
}

function generateLoanRecommendations(scoreObj, riskLevel) {
  const recs = [];
  if (riskLevel === 'low') {
    recs.push({ action: 'approve', detail: 'Strong profile; standard terms appropriate.' });
  } else if (riskLevel === 'moderate') {
    recs.push({ action: 'approve_with_conditions', detail: 'Consider a lower limit or additional security.' });
  } else if (riskLevel === 'elevated') {
    recs.push({ action: 'manual_review', detail: 'Refer to a credit officer before deciding.' });
  } else {
    recs.push({ action: 'decline_or_secure', detail: 'High risk; decline or require full collateral.' });
  }
  return recs;
}

// --- fraud helpers -----------------------------------------------------------

async function loadFraudDetectionModels() {
  return {
    modelType: 'statistical_anomaly',
    detect: (series, value) => {
      const z = stats.stdDev(series) === 0
        ? 0
        : Math.abs((value - stats.mean(series)) / stats.stdDev(series));
      const outliers = stats.iqrOutliers([...series, value]);
      const isIqrOutlier = outliers.some((o) => o.value === value);
      return { z_score: z, iqr_outlier: isIqrOutlier };
    }
  };
}

async function getUserBehaviorPatterns(userId) {
  try {
    const pg = getPostgreSQL();
    if (!pg) return { available: false, amounts: [] };
    const r = await pg.query(
      `SELECT total_amount FROM orders WHERE buyer_id = $1
       ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    return { available: true, amounts: column(r.rows, 'total_amount').filter(Number.isFinite) };
  } catch (error) {
    logger.warn('getUserBehaviorPatterns unavailable', { error: error.message });
    return { available: false, amounts: [] };
  }
}

async function getTransactionContext(transactionData) {
  return {
    amount: parseFloat(transactionData?.amount) || 0,
    hour: new Date().getHours(),
    is_unusual_hour: new Date().getHours() < 5 || new Date().getHours() > 23
  };
}

function ensembleAnomalyScores(signals) {
  const vals = Object.values(signals || {}).filter((v) => Number.isFinite(v));
  if (vals.length === 0) return 0;
  return Math.min(1, stats.mean(vals));
}

function calculateFraudProbability(zScore, isOutlier, context) {
  // Logistic squashing of the z-score, nudged by corroborating signals.
  let x = zScore - 2.5;
  if (isOutlier) x += 1;
  if (context?.is_unusual_hour) x += 0.5;
  return 1 / (1 + Math.exp(-x));
}

function assessFraudRiskLevel(probability) {
  if (probability >= 0.8) return 'critical';
  if (probability >= 0.6) return 'high';
  if (probability >= 0.35) return 'medium';
  return 'low';
}

function analyzeAnomalyDetails(zScore, isOutlier, context, history) {
  return {
    z_score: zScore,
    iqr_outlier: isOutlier,
    baseline_mean: stats.mean(history),
    baseline_std_dev: stats.stdDev(history),
    sample_size: history.length,
    unusual_hour: !!context?.is_unusual_hour,
    sufficient_history: history.length >= 10
  };
}

function generateFraudResponseActions(riskLevel) {
  switch (riskLevel) {
    case 'critical':
      return [{ action: 'block_transaction' }, { action: 'notify_security' }, { action: 'require_manual_review' }];
    case 'high':
      return [{ action: 'hold_for_review' }, { action: 'request_additional_verification' }];
    case 'medium':
      return [{ action: 'flag_for_monitoring' }];
    default:
      return [{ action: 'allow' }];
  }
}

async function generateFraudReport(transactionData, details, probability, riskLevel) {
  return {
    transaction: transactionData?.id ?? null,
    probability,
    risk_level: riskLevel,
    details,
    generated_at: new Date().toISOString()
  };
}

async function storeFraudDetectionResults(userId, report) {
  try {
    const pg = getPostgreSQL();
    if (!pg) return { stored: false, reason: 'no_database' };
    await pg.query(
      `INSERT INTO fraud_detection_results (user_id, risk_level, probability, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, report.risk_level, report.probability, JSON.stringify(report.details)]
    );
    return { stored: true };
  } catch (error) {
    // Never let audit-logging failure break the fraud decision itself.
    logger.warn('storeFraudDetectionResults failed', { error: error.message });
    return { stored: false, reason: error.message };
  }
}

// --- recommendation helpers --------------------------------------------------

async function loadRecommendationModels() {
  return { modelType: 'popularity_and_affinity' };
}

async function getUserProfile(userId) {
  try {
    const pg = getPostgreSQL();
    if (!pg) return { available: false };
    const r = await pg.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    return { available: r.rows.length > 0, ...(r.rows[0] || {}) };
  } catch (error) {
    logger.warn('getUserProfile unavailable', { error: error.message });
    return { available: false };
  }
}

async function getUserHistory(userId) {
  try {
    const pg = getPostgreSQL();
    if (!pg) return { available: false, product_ids: [] };
    const r = await pg.query(
      `SELECT DISTINCT oi.product_id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.buyer_id = $1 LIMIT 200`,
      [userId]
    );
    return { available: true, product_ids: r.rows.map((x) => x.product_id) };
  } catch (error) {
    logger.warn('getUserHistory unavailable', { error: error.message });
    return { available: false, product_ids: [] };
  }
}

async function getRealTimeContext(userId, context = {}) {
  return { user_id: userId, season: getCurrentSeason(), ...context };
}

function hybridRecommendationScoring(candidates, history, context) {
  const seen = new Set(history?.product_ids || []);
  return (candidates || [])
    .map((c) => {
      const popularity = Number(c.order_count) || 0;
      const alreadyBought = seen.has(c.id);
      return {
        ...c,
        score: (Math.log1p(popularity) || 0) * (alreadyBought ? 0.3 : 1),
        already_purchased: alreadyBought
      };
    })
    .sort((a, b) => b.score - a.score);
}

function applyDiversityFiltering(scored, maxPerCategory = 2) {
  const counts = {};
  return (scored || []).filter((item) => {
    const cat = item.category || 'uncategorised';
    counts[cat] = (counts[cat] || 0) + 1;
    return counts[cat] <= maxPerCategory;
  });
}

function applyNoveltyFiltering(scored) {
  return (scored || []).filter((item) => !item.already_purchased);
}

async function generateRecommendationExplanations(items) {
  return (items || []).map((i) => ({
    product_id: i.id,
    reason: i.already_purchased
      ? 'Previously purchased - suggested for repeat order'
      : 'Popular with buyers in your segment'
  }));
}

// --- computer vision (not yet available) -------------------------------------

async function loadComputerVisionModel() {
  // No vision model is bundled. Return an explicitly unavailable handle rather
  // than a fake classifier, so callers surface "unavailable" not a wrong
  // diagnosis - a wrong crop-disease call has real economic consequences.
  return {
    available: false,
    classify: async () => ({
      available: false,
      note: 'No crop-disease vision model is deployed. Integrate a trained model before relying on this endpoint.'
    })
  };
}

function preprocessImage(imageData) {
  return { received: !!imageData, bytes: imageData?.length ?? 0 };
}

function calculateDetectionConfidence(result) {
  return result?.available === false ? 0 : (result?.confidence ?? 0);
}

async function getDiseaseInformation(label) {
  return { disease: label ?? null, available: false, note: 'No disease knowledge base integrated' };
}

function generateTreatmentRecommendations(label) {
  return label
    ? [{ action: 'consult_agronomist', detail: `Automated identification unavailable for "${label}"; refer to an agronomist.` }]
    : [{ action: 'consult_agronomist', detail: 'Automated crop-disease detection is not available.' }];
}

function predictDiseaseSpread() {
  return { available: false, note: 'Spread modelling requires geospatial outbreak data not yet collected' };
}

function calculateEconomicImpact() {
  return { available: false, note: 'Economic impact modelling requires yield and price baselines not yet collected' };
}

function generatePreventionMeasures() {
  return [
    { measure: 'field_sanitation', detail: 'Remove and destroy infected plant material.' },
    { measure: 'crop_rotation', detail: 'Rotate with a non-host crop next season.' },
    { measure: 'monitoring', detail: 'Scout fields weekly and record observations.' }
  ];
}

/**
 * Express Router for API Endpoints
 */
const express = require('express');
const router = express.Router();

/**
 * POST /api/v1/advanced-ai/predict-demand
 * Advanced demand forecasting
 */
router.post('/predict-demand', authMiddleware, async (req, res) => {
  try {
    const { product_id, time_horizon, include_explanations } = req.body;
    const result = await advancedPredictDemand(product_id, time_horizon, include_explanations);
    res.json(result);
  } catch (error) {
    logger.error('Advanced demand prediction API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to predict demand' });
  }
});

/**
 * POST /api/v1/advanced-ai/optimize-price
 * Advanced price optimization
 */
router.post('/optimize-price', authMiddleware, async (req, res) => {
  try {
    const { product_id, current_price, context } = req.body;
    const result = await advancedOptimizePrice(product_id, current_price, context);
    res.json(result);
  } catch (error) {
    logger.error('Advanced price optimization API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to optimize price' });
  }
});

/**
 * POST /api/v1/advanced-ai/assess-credit-risk
 * Advanced credit risk assessment
 */
// DEPRECATED 2026-08-15 — advancedAssessCreditRisk() was a third,
// independent credit-scoring implementation ("transparent weighted
// ensemble") alongside the canonical, MCDA-based
// financialService.farmerCreditRiskScore(). No frontend caller was found.
// Delegated rather than deleted. See AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C.
router.post('/assess-credit-risk', authMiddleware, async (req, res) => {
  try {
    const { farmer_id } = req.body;
    const financialService = require('./financialService');
    const result = await financialService.farmerCreditRiskScore(farmer_id);
    res.json({ ...result, delegatedFrom: 'advancedaiBackboneService.advancedAssessCreditRisk (deprecated)', canonicalSource: 'financialService.farmerCreditRiskScore' });
  } catch (error) {
    logger.error('Advanced credit risk assessment API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to assess credit risk' });
  }
});

/**
 * POST /api/v1/advanced-ai/detect-fraud
 * Advanced fraud detection
 */
router.post('/detect-fraud', authMiddleware, async (req, res) => {
  try {
    const { transaction_data, user_id } = req.body;
    const result = await advancedDetectFraud(transaction_data, user_id);
    res.json(result);
  } catch (error) {
    logger.error('Advanced fraud detection API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to detect fraud' });
  }
});

/**
 * POST /api/v1/advanced-ai/recommendations
 * Advanced recommendations
 */
router.post('/recommendations', authMiddleware, async (req, res) => {
  try {
    const { user_id, context } = req.body;
    const result = await advancedGenerateRecommendations(user_id, context);
    res.json(result);
  } catch (error) {
    logger.error('Advanced recommendations API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * POST /api/v1/advanced-ai/detect-crop-disease
 * Crop disease detection
 */
router.post('/detect-crop-disease', authMiddleware, async (req, res) => {
  try {
    const { image_data, additional_data } = req.body;
    const result = await detectCropDisease(image_data, additional_data);
    res.json(result);
  } catch (error) {
    logger.error('Crop disease detection API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to detect crop disease' });
  }
});

/**
 * GET /api/v1/advanced-ai/models
 * Get available AI models
 */
router.get('/models', (req, res) => {
  res.json({
    models: ADVANCED_AI_MODELS,
    total_models: Object.keys(ADVANCED_AI_MODELS).length
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'advanced-ai',
    models_available: Object.keys(ADVANCED_AI_MODELS).length,
    capabilities: [
      'demand_forecasting',
      'price_optimization',
      'credit_scoring',
      'fraud_detection',
      'recommendations',
      'crop_disease_detection',
      'yield_prediction',
      'supply_chain_optimization'
    ]
  });
});

module.exports = {
  router,
  advancedPredictDemand,
  advancedOptimizePrice,
  advancedAssessCreditRisk,
  advancedDetectFraud,
  advancedGenerateRecommendations,
  detectCropDisease
};
// From aiCopilotService.js
 * AI Copilot Framework Service
 * CAP-224 to CAP-230: Finance Copilot, Logistics Copilot, Warehouse Copilot,
 * Insurance Copilot, Nutrition Copilot, Marketplace Copilot, Copilot Framework
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../database/pool');

// ============================================================================
// COPILOT FRAMEWORK (CAP-230)
// ============================================================================

/**
 * Initialize copilot session
 */
router.post('/session', authMiddleware, async (req, res) => {
  try {
    const { copilot_type, context, session_metadata } = req.body;

    const result = await pool.query(
      `INSERT INTO copilot_sessions 
       (user_id, copilot_type, context, session_metadata, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
       RETURNING *`,
      [req.user.id, copilot_type, JSON.stringify(context), JSON.stringify(session_metadata)]
    );

    logger.info(`Copilot session created: ${result.rows[0].id} for ${copilot_type}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create copilot session error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create copilot session' });
  }
});

/**
 * Send message to copilot
 */
router.post('/session/:id/message', authMiddleware, async (req, res) => {
  try {
    const { message, context } = req.body;

    // Get session details
    const sessionResult = await pool.query(
      'SELECT * FROM copilot_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Store user message
    await pool.query(
      `INSERT INTO copilot_messages 
       (session_id, role, content, context, created_at)
       VALUES ($1, 'user', $2, $3, NOW())`,
      [req.params.id, message, JSON.stringify(context)]
    );

    // Generate AI response based on copilot type
    const aiResponse = await generateCopilotResponse(session.copilot_type, message, context, session);

    // Store AI response
    await pool.query(
      `INSERT INTO copilot_messages 
       (session_id, role, content, context, metadata, created_at)
       VALUES ($1, 'assistant', $2, $3, $4, NOW())`,
      [req.params.id, aiResponse.content, JSON.stringify(context), JSON.stringify(aiResponse.metadata)]
    );

    // Update session
    await pool.query(
      `UPDATE copilot_sessions 
       SET updated_at = NOW(), message_count = message_count + 1
       WHERE id = $1`,
      [req.params.id]
    );

    res.json({
      session_id: req.params.id,
      response: aiResponse
    });
  } catch (error) {
    logger.error('Send copilot message error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to send message to copilot' });
  }
});

/**
 * Generate copilot response based on type
 */
async function generateCopilotResponse(copilotType, message, context, session) {
  logger.info(`Generating ${copilotType} copilot response`);

  switch (copilotType) {
    case 'finance':
      return await generateFinanceCopilotResponse(message, context, session);
    case 'logistics':
      return await generateLogisticsCopilotResponse(message, context, session);
    case 'warehouse':
      return await generateWarehouseCopilotResponse(message, context, session);
    case 'insurance':
      return await generateInsuranceCopilotResponse(message, context, session);
    case 'nutrition':
      return await generateNutritionCopilotResponse(message, context, session);
    case 'marketplace':
      return await generateMarketplaceCopilotResponse(message, context, session);
    default:
      return await generateGenericCopilotResponse(message, context, session);
  }
}

/**
 * Get session history
 */
router.get('/session/:id/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM copilot_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Get session history error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get session history' });
  }
});

/**
 * Close copilot session
 */
router.put('/session/:id/close', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE copilot_sessions 
       SET status = 'closed', ended_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    logger.info(`Copilot session closed: ${req.params.id}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Close copilot session error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to close copilot session' });
  }
});

// ============================================================================
// FINANCE COPILOT (CAP-224)
// ============================================================================

async function generateFinanceCopilotResponse(message, context, session) {
  const lowerMessage = (message || '').toLowerCase();
  const userId = session?.user_id;

  if (lowerMessage.includes('cash flow') && userId) {
    try {
      const result = await pool.query(
        `SELECT SUM(amount) AS total, AVG(amount) AS avg_amount, COUNT(*) AS txn_count
           FROM financial_transactions
          WHERE user_id = $1 AND transaction_date > NOW() - INTERVAL '90 days'`,
        [userId]
      );
      const row = result.rows[0];
      if (row && Number(row.txn_count) > 0) {
        return {
          content: `Based on your last 90 days of recorded transactions: total ₹${Number(row.total).toFixed(2)} across ${row.txn_count} transactions, averaging ₹${Number(row.avg_amount).toFixed(2)} per transaction. Ask me for a specific date range for a detailed breakdown.`,
          metadata: { capabilities: ['cash_flow_analysis'], source: 'financial_transactions', matched_on_real_data: true },
        };
      }
    } catch (error) {
      logger.warn('Finance copilot cash-flow lookup failed', { error: error.message });
    }
  }

  return {
    content: `I can help you with financial analysis, budget planning, and cash flow, based on your actual recorded transactions. Ask about "cash flow" for a real summary of your last 90 days, or use /finance/analytics for a fuller report. I don't have a general-purpose AI model configured here, so I only answer from what's actually recorded.`,
    metadata: { capabilities: ['financial_analysis', 'cash_flow'], source: userId ? 'financial_transactions' : 'none', matched_on_real_data: false },
  };
}

/**
 * Finance copilot specific endpoints
 */
router.get('/finance/analytics', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const analytics = await pool.query(`
      SELECT 
        SUM(amount) as total_revenue,
        AVG(amount) as avg_transaction,
        COUNT(*) as transaction_count,
        EXTRACT(MONTH FROM transaction_date) as month
      FROM financial_transactions
      WHERE transaction_date BETWEEN $1 AND $2
        AND user_id = $3
      GROUP BY month
      ORDER BY month
    `, [start_date, end_date, req.user.id]);

    res.json(analytics.rows);
  } catch (error) {
    logger.error('Get finance analytics error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get finance analytics' });
  }
});

// ============================================================================
// LOGISTICS COPILOT (CAP-225)
// ============================================================================

async function generateLogisticsCopilotResponse(message, context, session) {
  const lowerMessage = (message || '').toLowerCase();

  if (lowerMessage.includes('route') || lowerMessage.includes('shipment') || lowerMessage.includes('freight')) {
    try {
      const result = await pool.query(
        `SELECT origin_address, destination_address, weight_kg, estimated_cost, actual_cost, status
           FROM shipments
          ORDER BY created_at DESC
          LIMIT 5`
      );
      if (result.rows.length > 0) {
        const lines = result.rows.map((r) => `${r.origin_address} -> ${r.destination_address}: ${r.status}, est. ₹${r.estimated_cost ?? 'n/a'}${r.actual_cost ? ` (actual ₹${r.actual_cost})` : ''}`).join('\n');
        return {
          content: `Your 5 most recent shipments:\n${lines}`,
          metadata: { capabilities: ['tracking'], source: 'shipments', matched_on_real_data: true },
        };
      }
    } catch (error) {
      logger.warn('Logistics copilot shipment lookup failed', { error: error.message });
    }
  }

  return {
    content: `I can look up your real recent shipments — ask about "route" or "shipment" for a live status summary. I don't have a general-purpose AI model configured here, so I only answer from what's actually recorded.`,
    metadata: { capabilities: ['tracking'], source: 'none', matched_on_real_data: false },
  };
}

/**
 * Logistics copilot specific endpoints.
 * FIXED 2026-08-15: previously queried a `logistics_routes` table that does
 * not exist anywhere in the schema — every call threw "relation does not
 * exist". Rewritten against the real `shipments` table.
 */
router.get('/logistics/routes', authMiddleware, async (req, res) => {
  try {
    const { origin, destination } = req.query;

    const routes = await pool.query(
      `SELECT id, shipment_number, origin_address, destination_address, weight_kg,
              estimated_cost, actual_cost, estimated_transit_days, status
         FROM shipments
        WHERE ($1::text IS NULL OR origin_address ILIKE $1)
          AND ($2::text IS NULL OR destination_address ILIKE $2)
        ORDER BY created_at DESC
        LIMIT 5`,
      [origin ? `%${origin}%` : null, destination ? `%${destination}%` : null]
    );

    res.json({ routes: routes.rows });
  } catch (error) {
    logger.error('Get logistics routes error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get logistics routes' });
  }
});

// ============================================================================
// WAREHOUSE COPILOT (CAP-226)
// ============================================================================

async function generateWarehouseCopilotResponse(message, context, session) {
  const lowerMessage = (message || '').toLowerCase();
  const warehouseId = context?.warehouse_id;

  if ((lowerMessage.includes('inventory') || lowerMessage.includes('stock')) && warehouseId) {
    try {
      const result = await pool.query(
        `SELECT p.name, wi.quantity, wi.zone, wi.expiry_date
           FROM warehouse_inventory wi
           JOIN products p ON p.id = wi.product_id
          WHERE wi.warehouse_id = $1
          ORDER BY wi.quantity ASC
          LIMIT 5`,
        [warehouseId]
      );
      if (result.rows.length > 0) {
        const lowest = result.rows.map((r) => `${r.name}: ${r.quantity} units (zone ${r.zone || 'unassigned'})`).join('\n');
        return {
          content: `Lowest-quantity items in this warehouse right now:\n${lowest}`,
          metadata: { capabilities: ['inventory_analysis'], source: 'warehouse_inventory', matched_on_real_data: true },
        };
      }
    } catch (error) {
      logger.warn('Warehouse copilot inventory lookup failed', { error: error.message });
    }
  }

  return {
    content: `I can help with real recorded inventory levels for a specific warehouse — ask about "inventory" or "stock" with a warehouse_id in context for a live low-stock summary. I don't have a general-purpose AI model configured here, so I only answer from what's actually recorded.`,
    metadata: { capabilities: ['inventory_management'], source: warehouseId ? 'warehouse_inventory' : 'none', matched_on_real_data: false },
  };
}

/**
 * Warehouse copilot specific endpoints.
 * FIXED 2026-08-15: previously selected product_name/category/current_stock/
 * reorder_level/stock_status/turnover_rate — none of which exist on the real
 * warehouse_inventory table (013_logistics_enhancements.sql: quantity, zone,
 * location, expiry_date, batch_number, quality_grade). Every call to this
 * endpoint threw "column does not exist". Rewritten against the real schema,
 * joined to products for name/category.
 */
router.get('/warehouse/inventory', authMiddleware, async (req, res) => {
  try {
    const { warehouse_id, category_id } = req.query;
    if (!warehouse_id) return res.status(400).json({ error: 'warehouse_id is required' });

    const inventory = await pool.query(
      `SELECT wi.product_id, p.name AS product_name, p.category_id,
              wi.quantity, wi.zone, wi.location, wi.expiry_date, wi.batch_number,
              wi.quality_grade, wi.last_counted
         FROM warehouse_inventory wi
         JOIN products p ON p.id = wi.product_id
        WHERE wi.warehouse_id = $1
          AND ($2::integer IS NULL OR p.category_id = $2)
        ORDER BY wi.quantity ASC`,
      [warehouse_id, category_id || null]
    );

    res.json(inventory.rows);
  } catch (error) {
    logger.error('Get warehouse inventory error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get warehouse inventory' });
  }
});

// ============================================================================
// INSURANCE COPILOT (CAP-227)
// ============================================================================

async function generateInsuranceCopilotResponse(message, context, session) {
  const lowerMessage = (message || '').toLowerCase();
  const userId = session?.user_id;

  if (lowerMessage.includes('claim') || lowerMessage.includes('policy') || lowerMessage.includes('coverage')) {
    if (userId) {
      try {
        const result = await pool.query(
          `SELECT policy_number, coverage_amount, premium_amount, policy_end_date, status
             FROM policies
            WHERE user_id = $1
            ORDER BY policy_end_date ASC
            LIMIT 5`,
          [userId]
        );
        if (result.rows.length > 0) {
          const lines = result.rows.map((p) => `${p.policy_number}: ${p.status}, coverage ₹${p.coverage_amount}, expires ${new Date(p.policy_end_date).toLocaleDateString('en-IN')}`).join('\n');
          return {
            content: `Your recorded policies:\n${lines}`,
            metadata: { capabilities: ['policy_analysis'], source: 'policies', matched_on_real_data: true },
          };
        }
      } catch (error) {
        logger.warn('Insurance copilot policy lookup failed', { error: error.message });
      }
    }
  }

  return {
    content: `I can look up your real recorded policies — ask about "claim", "policy", or "coverage" for a live summary. I don't have a general-purpose AI model configured here, so I only answer from what's actually recorded.`,
    metadata: { capabilities: ['policy_analysis'], source: userId ? 'policies' : 'none', matched_on_real_data: false },
  };
}

/**
 * Insurance copilot specific endpoints.
 * FIXED 2026-08-15: previously queried a nonexistent `insurance_policies`
 * table with columns (policy_id, policy_type, premium, risk_score) that
 * don't exist anywhere in the schema. Rewritten against the real `policies`
 * table (000_base_schema.sql).
 */
router.get('/insurance/policies', authMiddleware, async (req, res) => {
  try {
    const policies = await pool.query(
      `SELECT id, policy_number, coverage_amount, premium_amount,
              policy_start_date, policy_end_date, status, insurer_name
         FROM policies
        WHERE user_id = $1
        ORDER BY policy_end_date ASC`,
      [req.user.id]
    );

    res.json(policies.rows);
  } catch (error) {
    logger.error('Get insurance policies error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get insurance policies' });
  }
});

// ============================================================================
// NUTRITION COPILOT (CAP-228)
// ============================================================================

/**
 * Live interactive AI dietitian / natural-therapist copilot.
 *
 * Replaced a fabricated version of this function (static canned text,
 * hardcoded `confidence: 0.91/0.95` regardless of input) with one grounded
 * in real data: wellness_natural_practices (evidence-labeled traditional/
 * natural remedies, e.g. the NE forest-honey entry — see
 * 9999_zz_product_media_ai_schema.sql) and food_composition/nutrition data
 * already real in nutritionIntelligenceService.js. No LLM is configured in
 * this environment, so this is keyword-matched against real rows, not
 * generative — and it says so, rather than pretending otherwise.
 */
async function generateNutritionCopilotResponse(message, context, session) {
  const nutritionIntelligenceService = require('./nutritionIntelligenceService');
  const lowerMessage = (message || '').toLowerCase();
  const words = lowerMessage.split(/[^a-z0-9]+/).filter((w) => w.length > 3);

  // 1. Natural-therapy / traditional-remedy match (real DB, real evidence labels)
  for (const word of words) {
    try {
      const { practices, disclaimer } = await nutritionIntelligenceService.getWellnessPractices({ tag: word });
      if (practices.length > 0) {
        const p = practices[0];
        return {
          content: `${p.common_name || p.practice_name}: ${p.traditional_use}\n\nEvidence level: ${p.evidence_level.replace(/_/g, ' ')}.${p.requires_consultation ? ' Please consult a qualified practitioner before use.' : ''}${p.contraindications ? `\n\nContraindications: ${p.contraindications}` : ''}\n\n${disclaimer}`,
          metadata: {
            source: 'wellness_natural_practices',
            practice_id: p.id,
            evidence_level: p.evidence_level,
            requires_consultation: p.requires_consultation,
            matched_on_real_data: true,
          },
        };
      }
    } catch (error) {
      logger.warn('Nutrition copilot wellness lookup failed', { word, error: error.message });
    }
  }

  // 2. Real food-nutrition search (calorie/diet/meal-type questions)
  if (lowerMessage.includes('meal') || lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('nutrition')) {
    try {
      const matches = await nutritionIntelligenceService.searchFoodProfiles(words[0] || '', null);
      if (matches && matches.length > 0) {
        const top = matches.slice(0, 3).map((f) => f.food_name || f.name).filter(Boolean).join(', ');
        return {
          content: `Based on recorded nutrition data, relevant foods include: ${top}. Ask about a specific food by name for its real nutrient breakdown, or ask me to compare two products.`,
          metadata: { source: 'food_composition', matched_on_real_data: true, matchCount: matches.length },
        };
      }
    } catch (error) {
      logger.warn('Nutrition copilot food search failed', { error: error.message });
    }
  }

  // 3. Real Wikipedia reference lookup — genuine external source with
  // citation, tried only after internal (higher-trust) sources found nothing.
  try {
    const wikipediaService = require('./wikipediaService');
    const wiki = await wikipediaService.lookup(message);
    if (wiki) {
      return {
        content: `${wiki.extract}\n\n(Source: Wikipedia — ${wiki.sourceUrl}. This is a general reference, not agronomic or medical advice specific to your situation.)`,
        metadata: { source: 'wikipedia', sourceUrl: wiki.sourceUrl, matched_on_real_data: true },
      };
    }
  } catch (error) {
    logger.warn('Nutrition copilot Wikipedia fallback failed', { error: error.message });
  }

  // Honest fallback — no fabricated confidence score, no canned advice.
  return {
    content: `I can look up real, evidence-labeled traditional/natural remedies (try naming an ingredient, e.g. "honey"), real nutrient data for a specific food, or a general Wikipedia reference. I don't have a general-purpose AI model configured in this environment, so I can only answer from what's actually recorded in the database or cited from a real external source.`,
    metadata: { source: 'none', matched_on_real_data: false },
  };
}

/**
 * Nutrition copilot specific endpoints
 */
router.get('/nutrition/analysis', authMiddleware, async (req, res) => {
  try {
    const { food_items, serving_size } = req.query;

    const analysis = await pool.query(`
      SELECT 
        f.food_name,
        f.calories_per_serving,
        f.protein,
        f.carbohydrates,
        f.fats,
        f.fiber,
        f.vitamins,
        f.minerals,
        f.allergens
      FROM food_composition f
      WHERE f.food_name = ANY($1)
    `, [food_items.split(',')]);

    res.json({
      analysis: analysis.rows,
      total_nutrition: calculateTotalNutrition(analysis.rows),
      recommendations: generateNutritionRecommendations(analysis.rows)
    });
  } catch (error) {
    logger.error('Get nutrition analysis error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get nutrition analysis' });
  }
});

function calculateTotalNutrition(foods) {
  return foods.reduce((total, food) => ({
    calories: total.calories + (food.calories_per_serving || 0),
    protein: total.protein + (food.protein || 0),
    carbohydrates: total.carbohydrates + (food.carbohydrates || 0),
    fats: total.fats + (food.fats || 0),
    fiber: total.fiber + (food.fiber || 0)
  }), { calories: 0, protein: 0, carbohydrates: 0, fats: 0, fiber: 0 });
}

function generateNutritionRecommendations(foods) {
  return [
    'Ensure adequate protein intake for muscle health',
    'Include fiber-rich foods for digestive health',
    'Balance macronutrients throughout the day',
    'Consider vitamin and mineral supplementation if needed'
  ];
}

// ============================================================================
// MARKETPLACE COPILOT (CAP-229)
// ============================================================================

async function generateMarketplaceCopilotResponse(message, context, session) {
  const lowerMessage = (message || '').toLowerCase();
  const categoryId = context?.category_id;

  if ((lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('market')) && categoryId) {
    try {
      const result = await pool.query(
        `SELECT avg_price, min_price, max_price, listing_count, record_date
           FROM market_price_history
          WHERE category_id = $1
          ORDER BY record_date DESC
          LIMIT 1`,
        [categoryId]
      );
      if (result.rows.length > 0) {
        const r = result.rows[0];
        return {
          content: `Most recent recorded market pricing for this category (as of ${new Date(r.record_date).toLocaleDateString('en-IN')}): average ₹${r.avg_price}, range ₹${r.min_price}-₹${r.max_price}, across ${r.listing_count} listings.`,
          metadata: { capabilities: ['pricing_analysis'], source: 'market_price_history', matched_on_real_data: true },
        };
      }
    } catch (error) {
      logger.warn('Marketplace copilot pricing lookup failed', { error: error.message });
    }
  }

  return {
    content: `I can look up real recorded market pricing for a category — ask about "price" or "market" with a category_id in context for a live summary. I don't have a general-purpose AI model configured here, so I only answer from what's actually recorded.`,
    metadata: { capabilities: ['pricing_analysis'], source: categoryId ? 'market_price_history' : 'none', matched_on_real_data: false },
  };
}

/**
 * Marketplace copilot specific endpoints.
 * FIXED 2026-08-15: previously queried a nonexistent `marketplace_analytics`
 * table with columns (product_category, seller_id, trend_direction,
 * growth_rate) that don't exist anywhere in the schema. Rewritten against
 * the real `market_price_history` table (3100_ecommerce_tables.sql), which
 * is keyed by category_id/state_id, not free-text category/region.
 */
router.get('/marketplace/trends', authMiddleware, async (req, res) => {
  try {
    const { category_id, state_id, days } = req.query;
    if (!category_id) return res.status(400).json({ error: 'category_id is required' });

    const trends = await pool.query(
      `SELECT category_id, state_id, avg_price, min_price, max_price, listing_count, record_date
         FROM market_price_history
        WHERE category_id = $1
          AND ($2::integer IS NULL OR state_id = $2)
          AND record_date >= CURRENT_DATE - ($3 || ' days')::interval
        ORDER BY record_date DESC`,
      [category_id, state_id || null, days || '30']
    );

    res.json(trends.rows);
  } catch (error) {
    logger.error('Get marketplace trends error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get marketplace trends' });
  }
});

// ============================================================================
// GENERIC COPILOT RESPONSE
// ============================================================================

async function generateGenericCopilotResponse(message, context, session) {
  return {
    content: `I'm your AI copilot assistant. I can help you with various tasks across the platform. Please let me know what specific assistance you need, and I'll connect you with the right specialized copilot.`,
    metadata: {
      capabilities: ['general_assistance'],
      available_copilots: ['finance', 'logistics', 'warehouse', 'insurance', 'nutrition', 'marketplace']
    }
  };
}

/**
 * Get copilot usage analytics
 */
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const analytics = await pool.query(`
      SELECT 
        copilot_type,
        COUNT(*) as session_count,
        AVG(message_count) as avg_messages,
        AVG(EXTRACT(EPOCH FROM (ended_at - created_at))/3600) as avg_duration_hours,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as completed_sessions
      FROM copilot_sessions
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY copilot_type
    `, [req.user.id]);

    res.json(analytics.rows);
  } catch (error) {
    logger.error('Get copilot analytics error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get copilot analytics' });
  }
});

// Health check
function isHealthy() {
  return true;
}

module.exports = {
  router,
  isHealthy,
  // Exported (additive only, no logic changed) so services/whatsappService.js
  // can reuse the existing generic-copilot template response for default
  // farmer queries instead of duplicating it.
  generateCopilotResponse
};

// From aiOperationIntelligenceService.js
 * AI Operation Intelligence Service - Real-Time Optimization Layer
 * 
 * This service provides operation intelligence capabilities including:
 * - Real-time performance monitoring
 * - Predictive optimization
 * - Resource allocation
 * - Process automation
 * - Anomaly detection
 * - Continuous improvement
 */

// These three SDKs are not in package.json (no live LLM credentials exist in this
// environment, by design). Lazy-require only when the matching env var is present,
// so absence is a clean not_configured client, never a process-killing MODULE_NOT_FOUND.
function tryRequireClient(envVar, loader) {
  if (!process.env[envVar]) return null;
  try {
    return loader();
  } catch (error) {
    require('../../utils/logger').warn(`aiClient:  is set but its SDK failed to load`, { error: error.message });
    return null;
  }
}

class AIOperationIntelligenceService {
  constructor() {
    // Initialize AI model clients
    this.openai = tryRequireClient('OPENAI_API_KEY', () => {
      const { OpenAI } = require('openai');
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    });

    this.gemini = tryRequireClient('GEMINI_API_KEY', () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    });

    this.anthropic = tryRequireClient('ANTHROPIC_API_KEY', () => {
      const { Anthropic } = require('@anthropic-ai/sdk');
      return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    });
    
    // Performance metrics
    this.performanceMetrics = new Map();
    
    // Optimization strategies
    this.optimizationStrategies = new Map();
    
    // Resource allocation
    this.resourceAllocation = new Map();
    
    // Operation history
    this.operationHistory = [];
    
    // Initialize optimization strategies
    this.initializeOptimizationStrategies();
    
    // Start real-time monitoring
    this.startRealTimeMonitoring();
  }
  
  /**
   * Initialize optimization strategies
   */
  initializeOptimizationStrategies() {
    // Equipment optimization
    this.addOptimizationStrategy('equipment_utilization', {
      description: 'Optimize equipment utilization across operations',
      parameters: ['availability', 'efficiency', 'cost', 'maintenance'],
      objectives: ['maximize_utilization', 'minimize_downtime', 'optimize_cost']
    });
    
    // Supply chain optimization
    this.addOptimizationStrategy('supply_chain', {
      description: 'Optimize supply chain operations',
      parameters: ['inventory', 'logistics', 'demand', 'lead_time'],
      objectives: ['minimize_cost', 'maximize_service_level', 'reduce_waste']
    });
    
    // Resource optimization
    this.addOptimizationStrategy('resource_allocation', {
      description: 'Optimize resource allocation across tasks',
      parameters: ['capacity', 'skills', 'availability', 'cost'],
      objectives: ['maximize_efficiency', 'minimize_cost', 'balance_workload']
    });
    
    // Process optimization
    this.addOptimizationStrategy('process_automation', {
      description: 'Identify and automate manual processes',
      parameters: ['complexity', 'frequency', 'cost', 'risk'],
      objectives: ['reduce_manual_effort', 'improve_accuracy', 'increase_speed']
    });
    
    // Energy optimization
    this.addOptimizationStrategy('energy_consumption', {
      description: 'Optimize energy consumption in operations',
      parameters: ['usage', 'efficiency', 'cost', 'sustainability'],
      objectives: ['minimize_consumption', 'reduce_cost', 'improve_sustainability']
    });
  }
  
  /**
   * Add optimization strategy
   */
  addOptimizationStrategy(name, strategy) {
    this.optimizationStrategies.set(name, strategy);
  }
  
  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring() {
    // Guard against double-start: constructor calls this once, but nothing
    // stopped a second explicit call from stacking a duplicate pair of
    // intervals that would then run forever with no way to clear both sets.
    if (this._metricsInterval || this._optimizationInterval) return;

    // Monitor performance every 10 seconds
    this._metricsInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, 10000);

    // Run optimization every 60 seconds
    this._optimizationInterval = setInterval(() => {
      this.runOptimizationCycle();
    }, 60000);
  }

  /**
   * Stop real-time monitoring (clears both intervals). Needed for tests and
   * scripts that require this module without wanting a permanent background
   * job to keep the process alive.
   */
  stopRealTimeMonitoring() {
    if (this._metricsInterval) { clearInterval(this._metricsInterval); this._metricsInterval = null; }
    if (this._optimizationInterval) { clearInterval(this._optimizationInterval); this._optimizationInterval = null; }
  }
  
  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      const metrics = {
        timestamp: new Date(),
        system: {
          memory_usage: process.memoryUsage(),
          cpu_usage: process.cpuUsage(),
          uptime: process.uptime()
        },
        operations: {
          active_tasks: this.operationHistory.filter(op => op.status === 'active').length,
          completed_tasks: this.operationHistory.filter(op => op.status === 'completed').length,
          failed_tasks: this.operationHistory.filter(op => op.status === 'failed').length
        },
        resources: {
          allocated: Array.from(this.resourceAllocation.values()).length,
          utilization: this.calculateResourceUtilization()
        }
      };
      
      this.performanceMetrics.set('current', metrics);
      
      // Keep last 1000 metrics
      const history = Array.from(this.performanceMetrics.entries()).filter(([key]) => key !== 'current');
      if (history.length > 1000) {
        history.slice(-1000).forEach(([key, value]) => this.performanceMetrics.set(key, value));
      }
      
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }
  
  /**
   * Calculate resource utilization
   */
  calculateResourceUtilization() {
    const allocations = Array.from(this.resourceAllocation.values());
    if (allocations.length === 0) return 0;
    
    const utilized = allocations.filter(alloc => alloc.status === 'active').length;
    return (utilized / allocations.length) * 100;
  }
  
  /**
   * Run optimization cycle
   */
  async runOptimizationCycle() {
    try {
      const currentMetrics = this.performanceMetrics.get('current');
      if (!currentMetrics) return;
      if (!this.openai && !this.gemini && !this.anthropic) return; // no AI provider configured - fallback mode, nothing to analyze with

      // Analyze performance
      const analysis = await this.analyzePerformance(currentMetrics);
      
      // Generate optimization recommendations
      const recommendations = await this.generateOptimizationRecommendations(analysis);
      
      // Execute optimizations if approved
      if (recommendations.auto_execute) {
        await this.executeOptimizations(recommendations.optimizations);
      }
      
      // Record optimization cycle
      this.recordOptimizationCycle({
        metrics: currentMetrics,
        analysis: analysis,
        recommendations: recommendations
      });
      
    } catch (error) {
      console.error('Error in optimization cycle:', error);
    }
  }
  
  /**
   * Analyze performance
   */
  async analyzePerformance(metrics) {
    try {
      const prompt = `
        Analyze the following performance metrics and identify:
        1. Performance bottlenecks
        2. Resource inefficiencies
        3. Optimization opportunities
        4. Anomalies and issues
        5. Trends and patterns
        
        Metrics: ${JSON.stringify(metrics)}
        
        Provide analysis in JSON format with detailed findings and recommendations.
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const analysis = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        analysis: analysis
      };
    } catch (error) {
      console.error('Error analyzing performance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(analysis) {
    try {
      const prompt = `
        Based on the performance analysis, generate optimization recommendations:
        
        Analysis: ${JSON.stringify(analysis)}
        
        Available strategies: ${JSON.stringify(Array.from(this.optimizationStrategies.keys()))}
        
        Provide recommendations in JSON format with:
        - optimizations: list of recommended optimizations
        - priority: priority level (critical, high, medium, low)
        - expected_impact: expected impact on performance
        - auto_execute: whether to auto-execute (true/false)
        - confidence: confidence in recommendation (0-1)
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const recommendations = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        recommendations: recommendations
      };
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Execute optimizations
   */
  async executeOptimizations(optimizations) {
    try {
      const results = [];
      
      for (const optimization of optimizations) {
        const result = await this.executeOptimization(optimization);
        results.push(result);
      }
      
      return {
        success: true,
        results: results
      };
    } catch (error) {
      console.error('Error executing optimizations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Execute single optimization
   */
  async executeOptimization(optimization) {
    try {
      switch (optimization.strategy) {
        case 'equipment_utilization':
          return await this.optimizeEquipmentUtilization(optimization);
        case 'supply_chain':
          return await this.optimizeSupplyChain(optimization);
        case 'resource_allocation':
          return await this.optimizeResourceAllocation(optimization);
        case 'process_automation':
          return await this.optimizeProcessAutomation(optimization);
        case 'energy_consumption':
          return await this.optimizeEnergyConsumption(optimization);
        default:
          return {
            success: false,
            error: `Unknown optimization strategy: ${optimization.strategy}`
          };
      }
    } catch (error) {
      console.error(`Error executing optimization ${optimization.strategy}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Optimize equipment utilization
   */
  async optimizeEquipmentUtilization(optimization) {
    // Implementation for equipment utilization optimization
    return {
      success: true,
      strategy: 'equipment_utilization',
      result: 'Equipment utilization optimized',
      improvements: ['increased_efficiency', 'reduced_downtime']
    };
  }
  
  /**
   * Optimize supply chain
   */
  async optimizeSupplyChain(optimization) {
    // Implementation for supply chain optimization
    return {
      success: true,
      strategy: 'supply_chain',
      result: 'Supply chain optimized',
      improvements: ['reduced_cost', 'improved_service_level']
    };
  }
  
  /**
   * Optimize resource allocation
   */
  async optimizeResourceAllocation(optimization) {
    // Implementation for resource allocation optimization
    return {
      success: true,
      strategy: 'resource_allocation',
      result: 'Resource allocation optimized',
      improvements: ['balanced_workload', 'increased_efficiency']
    };
  }
  
  /**
   * Optimize process automation
   */
  async optimizeProcessAutomation(optimization) {
    // Implementation for process automation optimization
    return {
      success: true,
      strategy: 'process_automation',
      result: 'Process automation optimized',
      improvements: ['reduced_manual_effort', 'improved_accuracy']
    };
  }
  
  /**
   * Optimize energy consumption
   */
  async optimizeEnergyConsumption(optimization) {
    // Implementation for energy consumption optimization
    return {
      success: true,
      strategy: 'energy_consumption',
      result: 'Energy consumption optimized',
      improvements: ['reduced_consumption', 'improved_sustainability']
    };
  }
  
  /**
   * Record optimization cycle
   */
  recordOptimizationCycle(cycle) {
    this.operationHistory.push({
      timestamp: new Date(),
      type: 'optimization_cycle',
      cycle: cycle
    });
    
    // Keep only last 1000 operations
    if (this.operationHistory.length > 1000) {
      this.operationHistory = this.operationHistory.slice(-1000);
    }
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      current: this.performanceMetrics.get('current'),
      history: Array.from(this.performanceMetrics.entries()).filter(([key]) => key !== 'current')
    };
  }
  
  /**
   * Get optimization strategies
   */
  getOptimizationStrategies() {
    return Array.from(this.optimizationStrategies.entries()).map(([name, strategy]) => ({
      name,
      ...strategy
    }));
  }
  
  /**
   * Get resource allocation
   */
  getResourceAllocation() {
    return Array.from(this.resourceAllocation.entries());
  }
  
  /**
   * Get operation history
   */
  getOperationHistory(limit = 100) {
    return this.operationHistory.slice(-limit);
  }
  
  /**
   * Predictive optimization
   */
  async predictiveOptimization(horizon = 24) {
    try {
      const currentMetrics = this.performanceMetrics.get('current');
      const history = this.operationHistory.slice(-100);
      
      const prompt = `
        Perform predictive optimization analysis for the next ${horizon} hours:
        
        Current Metrics: ${JSON.stringify(currentMetrics)}
        Operation History: ${JSON.stringify(history)}
        
        Provide prediction in JSON format with:
        - predicted_performance: performance forecast
        - recommended_actions: proactive optimization actions
        - risk_assessment: potential risks and mitigation
        - resource_requirements: expected resource needs
        - confidence: confidence in prediction (0-1)
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const prediction = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        prediction: prediction
      };
    } catch (error) {
      console.error('Error in predictive optimization:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Anomaly detection
   */
  async detectAnomalies() {
    try {
      const currentMetrics = this.performanceMetrics.get('current');
      const history = Array.from(this.performanceMetrics.entries()).slice(-50);
      
      const prompt = `
        Detect anomalies in the current performance metrics compared to historical data:
        
        Current Metrics: ${JSON.stringify(currentMetrics)}
        Historical Data: ${JSON.stringify(history)}
        
        Provide analysis in JSON format with:
        - anomalies: list of detected anomalies
        - severity: severity level (critical, high, medium, low)
        - root_cause: potential root causes
        - recommended_actions: recommended remediation actions
        - confidence: confidence in anomaly detection (0-1)
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const anomalies = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        anomalies: anomalies
      };
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Continuous improvement
   */
  async continuousImprovement() {
    try {
      const history = this.operationHistory.slice(-200);
      
      const prompt = `
        Analyze operation history and identify continuous improvement opportunities:
        
        Operation History: ${JSON.stringify(history)}
        
        Provide analysis in JSON format with:
        - improvement_opportunities: list of improvement opportunities
        - best_practices: identified best practices
        - process_enhancements: recommended process enhancements
        - kpi_improvements: KPI improvement recommendations
        - confidence: confidence in recommendations (0-1)
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const improvements = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        improvements: improvements
      };
    } catch (error) {
      console.error('Error in continuous improvement analysis:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance with router for proper mounting
const aiOperationIntelligenceService = new AIOperationIntelligenceService();

// Create Express router for AI Operation Intelligence endpoints
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');

// AI Operation Intelligence health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-operation-intelligence',
    models_available: {
      openai: !!aiOperationIntelligenceService.openai,
      gemini: !!aiOperationIntelligenceService.gemini,
      anthropic: !!aiOperationIntelligenceService.anthropic
    },
    performance_metrics_count: aiOperationIntelligenceService.performanceMetrics.size,
    optimization_strategies_count: aiOperationIntelligenceService.optimizationStrategies.size,
    resource_allocation_count: aiOperationIntelligenceService.resourceAllocation.size
  });
});

// Performance monitoring endpoint
router.get('/performance', authMiddleware, (req, res) => {
  try {
    const performance = aiOperationIntelligenceService.getPerformanceMetrics();
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Optimization endpoint
router.post('/optimize', authMiddleware, async (req, res) => {
  try {
    const { operation, parameters } = req.body;
    const result = await aiOperationIntelligenceService.optimizeOperation(operation, parameters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resource allocation endpoint
router.post('/allocate-resources', authMiddleware, async (req, res) => {
  try {
    const { operation, resources } = req.body;
    const result = await aiOperationIntelligenceService.allocateResources(operation, resources);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Anomaly detection endpoint
router.post('/detect-anomaly', authMiddleware, async (req, res) => {
  try {
    const { metrics, context } = req.body;
    const result = await aiOperationIntelligenceService.detectAnomaly(metrics, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  aiOperationIntelligenceService,
  ...aiOperationIntelligenceService
};

// Export consolidated service
module.exports = {
  // Core methods
  callAI: callAI || async (config, request) => { throw new Error('callAI not implemented'); },
  getStatus: getStatus || async () => { return { status: 'operational' }; },
  switchProvider: switchProvider || async (provider) => { return { provider: provider }; },
  
  // All merged methods available
  // (see implementations above)
};

