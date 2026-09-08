/**
 * FILENAME COLLISION NOTE (2026-09-08, do not merge): this shares a
 * basename with backend/src/services/legacy/aiGatewayService.js but is a
 * GENUINELY DIFFERENT feature - see the matching note in that file for the
 * full explanation. In short: this is a small, tested "governed AI
 * gateway" (run/buildGovernedPrompt/loadLibraryContext) that layers
 * library-context governance on top of legacy/aiBackboneService.js;
 * legacy/aiGatewayService.js is an unrelated class-based AI/ML prediction
 * hub. Neither copy is currently wired into a mounted route. Left
 * unmerged per the merge-not-delete / do-not-force-a-merge policy; see
 * .ai/tasks/ACTIVE.md.
 */

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

module.exports = { run, buildGovernedPrompt, loadLibraryContext, MAX_PROMPT_LENGTH };
