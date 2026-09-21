'use strict';

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  const selected = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(Math.max(selected, min), max);
}

function outputTokenLimit(feature, fallback) {
  const featureKey = `OPENAI_${String(feature).toUpperCase()}_MAX_TOKENS`;
  return boundedInteger(process.env[featureKey] || process.env.OPENAI_MAX_OUTPUT_TOKENS, fallback, 64, 2000);
}

function cacheTtlMs(feature, fallbackMs) {
  const featureKey = `${String(feature).toUpperCase()}_AI_CACHE_TTL_MS`;
  return boundedInteger(process.env[featureKey], fallbackMs, 60000, 86400000);
}

function getAIRuntimePolicy() {
  return {
    default_mode: 'quality_preserving_economy',
    principles: [
      'deterministic calculation before generation',
      'minimum sufficient context',
      'structured output',
      'bounded output tokens',
      'cache repeated requests',
      'parallelize independent work',
      'escalate model depth only when risk or ambiguity requires it',
    ],
    quality_gates: ['schema validation', 'source/evidence labels', 'human approval for regulated actions'],
    secrets: 'OPENAI_API_KEY is read from the environment and never returned to clients or logs',
  };
}

module.exports = { boundedInteger, cacheTtlMs, getAIRuntimePolicy, outputTokenLimit };
