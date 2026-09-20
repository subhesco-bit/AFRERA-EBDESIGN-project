'use strict';

const aiBackbone = require('./legacy/aiBackboneService');
const libraryKnowledge = require('./libraryKnowledgeService');
const { logger } = require('../utils/logger');

const MAX_PROMPT_LENGTH = 10000;
const MAX_CONTEXT_ITEMS = 12;

function normalizeText(value, field) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${field} is required`);
  if (text.length > MAX_PROMPT_LENGTH) throw new Error(`${field} exceeds ${MAX_PROMPT_LENGTH} characters`);
  return text;
}

function buildGovernedPrompt(prompt, moduleId, capability, libraryContext) {
  const matches = (libraryContext.matches || []).slice(0, MAX_CONTEXT_ITEMS).map((item, index) => ({
    source: item.path || item.key,
    type: item.type,
    relevance: item.relevance,
    data: item.data,
  }));

  return [
    `You are the governed EBDESIGN AI for module ${moduleId} and capability ${capability}.`,
    'Use the supplied library context as authoritative project guidance when relevant.',
    'Do not invent database records, prices, medical diagnoses, legal conclusions, or completed actions.',
    'Separate sourced facts, calculations, assumptions, and recommendations.',
    'For health, nutrition, natural therapy, finance, safety, or agriculture risk, recommend qualified human review when uncertainty or harm is possible.',
    `LIBRARY_CONTEXT_JSON: ${JSON.stringify(matches)}`,
    `USER_REQUEST: ${prompt}`,
  ].join('\n\n');
}

async function loadLibraryContext(prompt, moduleId, context = {}) {
  try {
    return await libraryKnowledge.buildAIContext(prompt, {
      ...context,
      moduleId,
      limit: MAX_CONTEXT_ITEMS,
    });
  } catch (error) {
    logger.warn('AI library context unavailable', { moduleId, error: error.message });
    return {
      matches: [],
      guardrails: { sourceAuthority: 'unavailable', noFileMutation: true },
    };
  }
}

async function run({ moduleId, capability, prompt, context = {}, provider, maxTokens, ...options } = {}) {
  const normalizedModuleId = normalizeText(moduleId, 'moduleId');
  const normalizedCapability = normalizeText(capability, 'capability');
  const normalizedPrompt = normalizeText(prompt, 'prompt');
  const libraryContext = await loadLibraryContext(normalizedPrompt, normalizedModuleId, context);
  const governedPrompt = buildGovernedPrompt(
    normalizedPrompt,
    normalizedModuleId,
    normalizedCapability,
    libraryContext,
  );

  try {
    const result = await aiBackbone.callAI(governedPrompt, {
      ...options,
      ...(provider ? { provider } : {}),
      ...(maxTokens ? { maxTokens } : {}),
    });

    return {
      success: true,
      status: 'generated',
      moduleId: normalizedModuleId,
      capability: normalizedCapability,
      content: result.content,
      provider: result.provider,
      model: result.model,
      confidence: {
        score: null,
        basis: 'Provider output was not independently calibrated; human validation may be required.',
      },
      provenance: {
        libraryMatches: (libraryContext.matches || []).slice(0, MAX_CONTEXT_ITEMS).map(item => ({
          key: item.key,
          path: item.path,
          relevance: item.relevance,
        })),
        guardrails: libraryContext.guardrails || {},
      },
      safety: {
        humanReviewRequired: true,
        externalActionsTaken: false,
      },
    };
  } catch (error) {
    const status = /not configured|not available|no ai provider/i.test(error.message) ?
      'not_configured' :
      'provider_error';
    logger.warn('Governed AI request unavailable', { moduleId: normalizedModuleId, capability: normalizedCapability, status });
    return {
      success: false,
      status,
      moduleId: normalizedModuleId,
      capability: normalizedCapability,
      error: 'AI provider unavailable. No generated answer was returned.',
      provenance: {
        libraryMatches: (libraryContext.matches || []).slice(0, MAX_CONTEXT_ITEMS).map(item => item.key),
      },
      safety: { humanReviewRequired: true, externalActionsTaken: false },
    };
  }
}

/**
 * Real health check: reports whether a provider is actually configured, not
 * a fabricated "healthy" status. Used by platformCoreService.getSystemHealth().
 */
async function healthCheck() {
  const hasProvider = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
  return {
    status: hasProvider ? 'configured' : 'not_configured',
    checkedAt: new Date().toISOString(),
  };
}

/**
 * System optimization via the real governed AI gateway. Was called by
 * platformCoreService.optimizeSystem() but did not exist on this module at
 * all (every call threw "aiGateway.optimize is not a function"). Returns
 * the AI's free-text recommendation honestly labeled as such -- it is not
 * parsed into fabricated structured fields, since the underlying model call
 * has no guarantee of returning parseable structured data.
 */
async function optimize(target, parameters = {}, constraints = {}) {
  const result = await run({
    moduleId: 'platform-core',
    capability: `optimize-${target}`,
    prompt: `Analyze these system parameters against the given constraints and suggest concrete optimization actions.\nParameters: ${JSON.stringify(parameters)}\nConstraints: ${JSON.stringify(constraints)}`,
  });
  return {
    ...result,
    recommendations: result.content || null,
  };
}

/**
 * System analysis via the real governed AI gateway. Was called by
 * platformCoreService.analyzeSystemPerformance() but did not exist on this
 * module at all. score/bottlenecks/forecast are left null/empty rather than
 * fabricated -- the AI's free-text response is not reliably parseable into
 * those structured fields without a schema-constrained provider call this
 * gateway does not currently make.
 */
async function analyze(target, data, analysisType) {
  const result = await run({
    moduleId: 'platform-core',
    capability: `analyze-${target}-${analysisType}`,
    prompt: `Analyze this ${analysisType} data for ${target} and describe any bottlenecks and recommendations.\nData: ${JSON.stringify(data)}`,
  });
  return {
    ...result,
    score: null,
    bottlenecks: [],
    recommendations: result.content ? [result.content] : [],
    forecast: {},
  };
}

module.exports = { run, buildGovernedPrompt, loadLibraryContext, MAX_PROMPT_LENGTH, healthCheck, optimize, analyze };
