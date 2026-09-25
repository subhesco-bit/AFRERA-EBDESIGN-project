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
const express = require('express');

// ============================================================================
// AI PROVIDER CONFIGURATIONS
// ============================================================================

const AI_PROVIDERS = {
  claude: {
    enabled: process.env.CLAUDE_ENABLED === 'false' ? false : Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
    baseUrl: 'https://api.anthropic.com/v1',
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096,
  },
  openai: {
    enabled: process.env.OPENAI_ENABLED === 'false' ? false : Boolean(process.env.OPENAI_API_KEY),
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
  },
  gemini: {
    enabled: process.env.GEMINI_ENABLED === 'false' ? false : Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 4096,
  },
  azure: {
    enabled: process.env.AZURE_OPENAI_ENABLED === 'false' ? false : Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT),
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  },
  huggingface: {
    enabled: process.env.HUGGINGFACE_ENABLED === 'false' ? false : Boolean(process.env.HUGGINGFACE_API_KEY),
    apiKey: process.env.HUGGINGFACE_API_KEY,
    baseUrl: 'https://api-inference.huggingface.co',
    defaultModel: process.env.HUGGINGFACE_DEFAULT_MODEL || 'meta-llama/Llama-2-7b-chat-hf',
  },
  ollama: {
    // Local inference server - no API key required, just a reachable host.
    enabled: process.env.OLLAMA_ENABLED === 'true',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1',
    maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS) || 4096,
  },
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
    ollama: { total: 0, success: 0, failed: 0 },
  },
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
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options.model || AI_PROVIDERS.claude.model,
          max_tokens: options.maxTokens || AI_PROVIDERS.claude.maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          ...options,
        }),
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
        tokens: data.usage?.input_tokens + data.usage?.output_tokens,
      });

      return {
        provider: 'claude',
        model: AI_PROVIDERS.claude.model,
        content: data.content[0].text,
        usage: data.usage,
        finishReason: data.stop_reason,
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
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await fetch(`${AI_PROVIDERS.openai.baseUrl}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_PROVIDERS.openai.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model || AI_PROVIDERS.openai.model,
          input: String(prompt),
          max_output_tokens: Number(options.maxTokens || AI_PROVIDERS.openai.maxTokens),
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        if (response.status === 429 && /credit_balance_exhausted|insufficient_quota|quota.{0,30}exhaust/i.test(body)) {
          const error = new Error('OpenAI API quota is exhausted');
          error.nonRetryable = true;
          throw error;
        }
        const error = new Error(`OpenAI API error: ${response.status} - ${body}`);
        error.nonRetryable = response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429;
        throw error;
      }
      const data = await response.json();
      aiRequestTracker.successfulRequests++;
      aiRequestTracker.providerStats.openai.success++;
      return {
        provider: 'openai',
        model: data.model || options.model || AI_PROVIDERS.openai.model,
        content: data.output_text || data.output?.[0]?.content?.[0]?.text || '',
        usage: data.usage || null,
        finishReason: data.status || null,
      };
    } catch (error) {
      attempt++;
      if (error.nonRetryable || attempt >= maxRetries) {
        aiRequestTracker.failedRequests++;
        aiRequestTracker.providerStats.openai.failed++;
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 25 * attempt));
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
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: options.maxTokens || AI_PROVIDERS.gemini.maxTokens,
              temperature: options.temperature || 0.7,
            },
          }),
        },
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
        model: AI_PROVIDERS.gemini.model,
      });

      return {
        provider: 'gemini',
        model: AI_PROVIDERS.gemini.model,
        content: data.candidates[0].content.parts[0].text,
        usage: data.usageMetadata,
        finishReason: data.candidates[0].finishReason,
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
          'api-key': AI_PROVIDERS.azure.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    aiRequestTracker.successfulRequests++;
    aiRequestTracker.providerStats.azure.success++;

    logger.info('Azure OpenAI request successful', {
      deployment: AI_PROVIDERS.azure.deployment,
    });

    return {
      provider: 'azure',
      model: AI_PROVIDERS.azure.deployment,
      content: data.choices[0].message.content,
      usage: data.usage,
      finishReason: data.choices[0].finish_reason,
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
          Authorization: `Bearer ${AI_PROVIDERS.huggingface.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: options.maxTokens || 512,
            temperature: options.temperature || 0.7,
            return_full_text: false,
          },
        }),
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
        model,
        content: Array.isArray(data) ? data[0].generated_text : data.generated_text,
        usage: null,
        finishReason: 'stop',
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || AI_PROVIDERS.ollama.model,
          messages: [
            ...(options.system ? [{ role: 'system', content: options.system }] : []),
            {
              role: 'user',
              content: prompt,
            },
          ],
          stream: false,
          options: {
            num_predict: options.maxTokens || AI_PROVIDERS.ollama.maxTokens,
            temperature: options.temperature || 0.7,
          },
        }),
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
        tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      });

      return {
        provider: 'ollama',
        model: data.model || AI_PROVIDERS.ollama.model,
        content: data.message?.content,
        usage: {
          input_tokens: data.prompt_eval_count,
          output_tokens: data.eval_count,
        },
        finishReason: data.done_reason || (data.done ? 'stop' : null),
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
  const calls = {
    claude: callClaudeAI,
    openai: callOpenAI,
    gemini: callGeminiAI,
    azure: callAzureOpenAI,
    huggingface: callHuggingFace,
    ollama: callOllamaAI,
  };
  const requested = options.provider;
  if (requested && !calls[requested]) throw new Error(`Unknown AI provider: ${requested}`);
  const provider = requested || getPreferredProvider();
  if (!provider) throw new Error('No AI provider is available or configured');
  const cfg = AI_PROVIDERS[provider];
  const configured = provider === 'ollama' ? Boolean(cfg.enabled) : Boolean(cfg.enabled && cfg.apiKey);
  if (!configured) throw new Error(`${provider} is not configured`);
  return calls[provider](prompt, options);
}

function getPreferredProvider() {
  const order = ['claude', 'openai', 'gemini', 'azure', 'huggingface', 'ollama'];
  for (const name of order) {
    const cfg = AI_PROVIDERS[name];
    const configured = name === 'ollama' ? Boolean(cfg.enabled) : Boolean(cfg.enabled && cfg.apiKey);
    if (configured) return name;
  }
  return null;
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
    timestamp: new Date().toISOString(),
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
    timestamp: new Date().toISOString(),
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
    timestamp: new Date().toISOString(),
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
    timestamp: new Date().toISOString(),
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
    timestamp: new Date().toISOString(),
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
    timestamp: new Date().toISOString(),
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
    timestamp: new Date().toISOString(),
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
    }),
  );

  return {
    providers: redactedProviders,
    statistics: aiRequestTracker,
    availableProviders: Object.entries(AI_PROVIDERS)
      .filter(([name, config]) => config.enabled && (name === 'ollama' || config.apiKey))
      .map(([name, _]) => name),
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

// ============================================================================
// GOVERNED AI FACADE (aiAPI)
// ============================================================================
/**
 * aiAPI — the governed entry point used by module services
 * (`const { aiAPI } = require('.../services/legacy/aiBackboneService')`).
 *
 * Why this exists
 * ---------------
 * 172 call sites across 68 module services call
 * `aiAPI.generateRecommendation({ task, parameters })` and persist the result
 * as JSON (e.g. an `ai_content_analysis` column). The export did not exist, so
 * every one of those call sites was a latent TypeError. Rather than stub it,
 * this facade makes those call sites honest:
 *
 *  - It NEVER fabricates a recommendation. With no provider configured
 *    `callAI()` throws ('… is not configured'); a fabricated or random answer
 *    persisted into a business column would be indistinguishable from a real
 *    one. Instead an envelope with `status:'unavailable'` and `output:null` is
 *    returned, so the platform degrades safely and the gap stays visible.
 *  - `confidence` is only populated when the model itself reports one.
 *    It is never synthesised, because a made-up confidence is worse than none.
 *  - Every result carries provenance so an AI-influenced business record can
 *    later be audited: which task, model, provider, contract version, when,
 *    how long, what assumptions, and whether a human approved it.
 *
 * Envelope contract (stable; additive changes only)
 *   status            'ok' | 'unavailable' | 'error' | 'rejected'
 *   task              echo of the requested task key
 *   output            model result (parsed object when JSON, else raw text) or null
 *   confidence        number 0..1 reported BY THE MODEL, else null
 *   citations         sources the model cited, else []
 *   assumptions       assumptions the model declared, else []
 *   explanation       model rationale, else null
 *   provenance        { provider, model, contractVersion, requestedAt, latencyMs, inputKeys }
 *   actionBoundary    'advisory_only' — this facade never authorises execution
 *   humanApproval     { required, status, approvedBy, approvedAt }
 *   outcome           reserved for benefit-realisation feedback (null until measured)
 *   error             message when status is 'error' | 'rejected'
 */
const AI_CONTRACT_VERSION = '1.0.0';

function buildEnvelope(fields) {
  return {
    status: 'error',
    task: null,
    output: null,
    confidence: null,
    citations: [],
    assumptions: [],
    explanation: null,
    provenance: {
      provider: null,
      model: null,
      contractVersion: AI_CONTRACT_VERSION,
      requestedAt: null,
      latencyMs: null,
      inputKeys: [],
    },
    actionBoundary: 'advisory_only',
    humanApproval: { required: true, status: 'pending', approvedBy: null, approvedAt: null },
    outcome: null,
    error: null,
    ...fields,
  };
}

/** Deterministic prompt construction; asks the model for the governance fields. */
function buildRecommendationPrompt(task, parameters) {
  return [
    `Task: ${task}`,
    '',
    'Input parameters (JSON):',
    JSON.stringify(parameters, null, 2),
    '',
    'Respond with a single JSON object using exactly these keys:',
    '{',
    '  "output": <your recommendation as an object>,',
    '  "confidence": <number between 0 and 1, or null if you cannot judge>,',
    '  "citations": [<sources you relied on>],',
    '  "assumptions": [<assumptions you made>],',
    '  "explanation": "<why you reached this recommendation>"',
    '}',
    '',
    'Do not invent data that is not present in the input parameters.',
    'If the input is insufficient, say so in "explanation" and set "confidence" to null.',
  ].join('\n');
}

/** Extract a JSON object from a model response that may be fenced or prose-wrapped. */
function parseModelJSON(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clampConfidence(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : null;
}

async function generateRecommendation(request = {}) {
  const { task, parameters = {}, options = {} } = request || {};
  const requestedAt = new Date().toISOString();
  const inputKeys = parameters && typeof parameters === 'object' ? Object.keys(parameters) : [];

  if (!task || typeof task !== 'string') {
    return buildEnvelope({
      status: 'rejected',
      error: 'generateRecommendation requires a string "task"',
      provenance: { provider: null, model: null, contractVersion: AI_CONTRACT_VERSION, requestedAt, latencyMs: 0, inputKeys },
    });
  }

  const provider = options.provider || getPreferredProvider();
  const cfg = AI_PROVIDERS[provider];
  const model = (cfg && (options.model || cfg.model)) || null;
  const baseProvenance = { provider, model, contractVersion: AI_CONTRACT_VERSION, requestedAt, latencyMs: null, inputKeys };

  // Safe fallback: no configured provider means no AI. Report it, do not invent it.
  if (!cfg || !cfg.enabled || !cfg.apiKey) {
    return buildEnvelope({
      status: 'unavailable',
      task,
      explanation: `No AI provider is configured (checked '${provider}'). No recommendation was generated.`,
      provenance: { ...baseProvenance, latencyMs: 0 },
      humanApproval: { required: false, status: 'not_applicable', approvedBy: null, approvedAt: null },
    });
  }

  const startedMs = Date.now();
  try {
    const raw = await callAI(buildRecommendationPrompt(task, parameters), options);
    const parsed = parseModelJSON(raw);
    return buildEnvelope({
      status: 'ok',
      task,
      output: parsed && 'output' in parsed ? parsed.output : (parsed ?? raw ?? null),
      confidence: clampConfidence(parsed && parsed.confidence),
      citations: Array.isArray(parsed && parsed.citations) ? parsed.citations : [],
      assumptions: Array.isArray(parsed && parsed.assumptions) ? parsed.assumptions : [],
      explanation: (parsed && typeof parsed.explanation === 'string') ? parsed.explanation : null,
      provenance: { ...baseProvenance, latencyMs: Date.now() - startedMs },
    });
  } catch (error) {
    return buildEnvelope({
      status: 'error',
      task,
      error: error && error.message ? error.message : String(error),
      provenance: { ...baseProvenance, latencyMs: Date.now() - startedMs },
    });
  }
}

const aiAPI = {
  generateRecommendation,
  contractVersion: AI_CONTRACT_VERSION,
};

async function analyze(input = {}) {
  const result = await generateRecommendation({ task: 'analysis', parameters: input });
  return { ...result, source: result.status === 'ok' ? 'ai' : 'fallback' };
}
async function optimize(input = {}) {
  const result = await generateRecommendation({ task: 'optimization', parameters: input });
  return { ...result, source: result.status === 'ok' ? 'ai' : 'fallback' };
}
async function predict(input = {}) {
  const result = await generateRecommendation({ task: 'prediction', parameters: input });
  return { ...result, source: result.status === 'ok' ? 'ai' : 'fallback' };
}
async function recommend(input = {}) {
  const result = await generateRecommendation({ task: 'recommendation', parameters: input });
  return { ...result, source: result.status === 'ok' ? 'ai' : 'fallback' };
}
async function optimizeSheepProduction(input = {}) { return optimizeLivestock({ species: 'sheep', ...input }); }
async function optimizePigProduction(input = {}) { return optimizeLivestock({ species: 'pig', ...input }); }

const router = express.Router();
router.get('/provider-status', (req, res) => res.json({ success: true, data: getAIProviderStatus() }));

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
  aiRequestTracker,

  // Governed AI facade used by module services
  aiAPI,
  generateRecommendation,
  AI_CONTRACT_VERSION,
  analyze,
  optimize,
  predict,
  recommend,
  optimizeSheepProduction,
  optimizePigProduction,
  router,
};

