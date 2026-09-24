/**
 * AI model registry + governance (baseline P3-13)
 * Hardcoded/random wrappers are not production AI — registry tracks real engines.
 */

'use strict';

const MODELS = [
  {
    id: 'eng.structural',
    name: 'Structural IS-code engine',
    type: 'deterministic_engineering',
    endpoint: '/api/v1/engineering-design/structural',
    policy_version: 'afrera-ai-policy-2026.09',
    advisory: true,
    status: 'verified',
  },
  {
    id: 'eng.solar',
    name: 'Solar yield engine',
    type: 'deterministic_engineering',
    endpoint: '/api/v1/engineering-design/solar',
    policy_version: 'afrera-ai-policy-2026.09',
    advisory: true,
    status: 'verified',
  },
  {
    id: 'eng.mep_thermal',
    name: 'MEP + thermal first-pass',
    type: 'deterministic_engineering',
    endpoint: '/api/v1/research-grade/mep',
    policy_version: 'afrera-ai-policy-2026.09',
    advisory: true,
    status: 'partial',
  },
  {
    id: 'commerce.dynamic_pricing',
    name: 'Geofence + mandi dynamic pricing',
    type: 'rules_plus_reference_data',
    endpoint: '/api/v1/dynamic-pricing',
    policy_version: 'afrera-ai-policy-2026.09',
    advisory: true,
    status: 'partial',
  },
  {
    id: 'agro.subsidy_eligibility',
    name: 'Scheme eligibility rules engine',
    type: 'rules_engine',
    endpoint: '/api/v1/research-grade/subsidy',
    policy_version: 'afrera-ai-policy-2026.09',
    advisory: true,
    status: 'partial',
  },
  {
    id: 'ai.evidence_gateway',
    name: 'AI Backbone evidence gateway',
    type: 'gateway',
    endpoint: '/api/v1/research-grade/ai',
    policy_version: 'afrera-ai-policy-2026.09',
    advisory: false,
    status: 'partial',
  },
];

const invocations = [];

function listModels() {
  return { models: MODELS, count: MODELS.length };
}

function getModel(id) {
  return MODELS.find((m) => m.id === id) || null;
}

function recordInvocation(model_id, meta = {}) {
  const m = getModel(model_id);
  const row = {
    at: new Date().toISOString(),
    model_id,
    found: !!m,
    latency_ms: meta.latency_ms || null,
    success: meta.success !== false,
    confidence: meta.confidence,
    evidence_id: meta.evidence_id || null,
  };
  invocations.push(row);
  if (invocations.length > 2000) invocations.shift();
  return row;
}

function governanceStatus() {
  return {
    policy_version: 'afrera-ai-policy-2026.09',
    rules: [
      'Every consequential output needs evidence passport fields',
      'Hardcoded/random/generic wrapper is not production AI',
      'Advisory engines must set advisory:true and basis',
      'Sensitive attributes never silently inferred for eligibility/price/credit',
    ],
    models_registered: MODELS.length,
    invocations_recorded: invocations.length,
    human_approval_required_for: ['loan_sanction', 'insurance_bind', 'clinical_prescription'],
    fallback: 'Return safe non-AI baseline or degrade with explicit flag',
  };
}

async function operate(data = {}) {
  const action = data.action || 'list';
  if (action === 'list') return listModels();
  if (action === 'get') return { model: getModel(data.model_id) };
  if (action === 'record') return recordInvocation(data.model_id, data);
  if (action === 'governance') return governanceStatus();
  if (action === 'invocations') return { invocations: invocations.slice(-(data.limit || 50)) };
  return { error: 'Unknown action' };
}

module.exports = {
  MODELS,
  listModels,
  getModel,
  recordInvocation,
  governanceStatus,
  operate,
};
