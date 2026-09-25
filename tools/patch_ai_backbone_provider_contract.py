from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\legacy\aiBackboneService.js')
t=p.read_text(encoding='utf-8')

# express router compatibility
if "const express = require('express');" not in t:
    t=t.replace("const fetch = require('node-fetch');", "const fetch = require('node-fetch');\nconst express = require('express');", 1)

# provider configuration: explicit false disables; otherwise credentials auto-enable
t=t.replace("enabled: process.env.CLAUDE_ENABLED === 'true',\n    apiKey: process.env.CLAUDE_API_KEY,", "enabled: process.env.CLAUDE_ENABLED === 'false' ? false : Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),\n    apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,", 1)
t=t.replace("enabled: process.env.OPENAI_ENABLED === 'true',\n    apiKey: process.env.OPENAI_API_KEY,", "enabled: process.env.OPENAI_ENABLED === 'false' ? false : Boolean(process.env.OPENAI_API_KEY),\n    apiKey: process.env.OPENAI_API_KEY,", 1)
t=t.replace("enabled: process.env.GEMINI_ENABLED === 'true',\n    apiKey: process.env.GEMINI_API_KEY,", "enabled: process.env.GEMINI_ENABLED === 'false' ? false : Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),\n    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,", 1)
t=t.replace("enabled: process.env.AZURE_OPENAI_ENABLED === 'true',\n    apiKey: process.env.AZURE_OPENAI_API_KEY,", "enabled: process.env.AZURE_OPENAI_ENABLED === 'false' ? false : Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT),\n    apiKey: process.env.AZURE_OPENAI_API_KEY,", 1)
t=t.replace("enabled: process.env.HUGGINGFACE_ENABLED === 'true',\n    apiKey: process.env.HUGGINGFACE_API_KEY,", "enabled: process.env.HUGGINGFACE_ENABLED === 'false' ? false : Boolean(process.env.HUGGINGFACE_API_KEY),\n    apiKey: process.env.HUGGINGFACE_API_KEY,", 1)

# replace OpenAI implementation
start=t.index('async function callOpenAI(prompt, options = {}) {')
end=t.index('// ============================================================================\n// GOOGLE GEMINI INTEGRATION', start)
openai=r'''async function callOpenAI(prompt, options = {}) {
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

'''
t=t[:start]+openai+t[end:]

# replace unified routing + preferred provider
start=t.index('async function callAI(prompt, options = {}) {')
end=t.index('// ============================================================================\n// AI FOR ERP MODULES', start)
unified=r'''async function callAI(prompt, options = {}) {
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

'''
t=t[:start]+unified+t[end:]

# compatibility wrappers + router
anchor='const aiAPI = {\n  generateRecommendation,\n  contractVersion: AI_CONTRACT_VERSION,\n};\n\nmodule.exports = {'
if anchor not in t: raise RuntimeError('aiAPI export anchor missing')
compat=r'''const aiAPI = {
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

module.exports = {'''
t=t.replace(anchor,compat,1)

# add compatibility exports before final closing object
export_anchor='  AI_CONTRACT_VERSION,\n};'
replacement='  AI_CONTRACT_VERSION,\n  analyze,\n  optimize,\n  predict,\n  recommend,\n  optimizeSheepProduction,\n  optimizePigProduction,\n  router,\n};'
if export_anchor not in t: raise RuntimeError('final export anchor missing')
t=t.replace(export_anchor,replacement,1)

p.write_text(t,encoding='utf-8')
print('legacy AI backbone provider contract repaired')