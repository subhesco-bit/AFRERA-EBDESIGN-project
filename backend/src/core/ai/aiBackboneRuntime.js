/**
 * AI Backbone Runtime
 *
 * Common control plane for generative, agentic and autonomous AI across the
 * existing EBDESIGN modules. This is intentionally an orchestration layer;
 * domain business logic remains in the existing modules/services.
 */
'use strict';

const crypto = require('crypto');

const AUTONOMY = Object.freeze({
  ASSIST: 0,
  RECOMMEND: 1,
  PLAN: 2,
  EXECUTE_LOW_RISK: 3,
  EXECUTE_APPROVED: 4,
});

const AGENTS = Object.freeze({
  enterprise: { domain: 'enterprise', autonomy: AUTONOMY.RECOMMEND, capabilities: ['analysis','planning','reporting'] },
  finance: { domain: 'finance', autonomy: AUTONOMY.EXECUTE_LOW_RISK, capabilities: ['analysis','reconciliation','forecasting','planning'] },
  supply_chain: { domain: 'supply_chain', autonomy: AUTONOMY.EXECUTE_LOW_RISK, capabilities: ['planning','procurement','inventory','allocation'] },
  rural_economy: { domain: 'rural_economy', autonomy: AUTONOMY.EXECUTE_LOW_RISK, capabilities: ['planning','aggregation','capacity','market'] },
  metro_commerce: { domain: 'metro_commerce', autonomy: AUTONOMY.EXECUTE_LOW_RISK, capabilities: ['catalog','demand','pricing','orders'] },
  logistics: { domain: 'logistics', autonomy: AUTONOMY.EXECUTE_LOW_RISK, capabilities: ['routing','capacity','tracking','exception_management'] },
  quality: { domain: 'quality', autonomy: AUTONOMY.RECOMMEND, capabilities: ['inspection','traceability','risk'] },
  workforce: { domain: 'workforce', autonomy: AUTONOMY.RECOMMEND, capabilities: ['matching','scheduling','compliance'] },
  insurance: { domain: 'insurance', autonomy: AUTONOMY.RECOMMEND, capabilities: ['risk','claims','fraud_detection'] },
  nutrition: { domain: 'nutrition', autonomy: AUTONOMY.RECOMMEND, capabilities: ['nutrient_analysis','diet_planning','education'] },
  medical_biological: { domain: 'medical_biological', autonomy: AUTONOMY.RECOMMEND, capabilities: ['evidence_retrieval','biological_analysis','clinical_support'] },
});

const SENSITIVE_DOMAINS = new Set(['medical_biological', 'nutrition']);
const HIGH_IMPACT_ACTIONS = new Set(['diagnose','prescribe','approve_payment','release_payment','delete','issue_refund','alter_ledger','change_insurance_coverage']);

function id(prefix = 'ai') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
}

function validateAgent(agentId) {
  const agent = AGENTS[agentId];
  if (!agent) {
    const error = new Error(`Unknown AI agent: ${agentId}`);
    error.code = 'UNKNOWN_AI_AGENT';
    throw error;
  }
  return agent;
}

function enforcePolicy(agent, request = {}) {
  const action = request.action || 'recommend';
  const requestedLevel = Number.isInteger(request.autonomyLevel) ? request.autonomyLevel : AUTONOMY.RECOMMEND;

  if (SENSITIVE_DOMAINS.has(agent.domain) && requestedLevel > AUTONOMY.RECOMMEND) {
    return { allowed: false, level: AUTONOMY.RECOMMEND, requiresHumanApproval: true, reason: 'Sensitive medical/biological/nutrition workflows remain recommendation-only unless an explicit human-controlled workflow authorises a specific action.' };
  }

  if (HIGH_IMPACT_ACTIONS.has(action)) {
    return { allowed: false, level: AUTONOMY.RECOMMEND, requiresHumanApproval: true, reason: `High-impact action '${action}' requires explicit human approval.` };
  }

  if (requestedLevel > agent.autonomy) {
    return { allowed: false, level: agent.autonomy, requiresHumanApproval: true, reason: 'Requested autonomy exceeds the registered agent policy.' };
  }

  return { allowed: true, level: requestedLevel, requiresHumanApproval: false, reason: 'Policy permitted.' };
}

function buildPlan(agent, request = {}) {
  const policy = enforcePolicy(agent, request);
  return {
    planId: id('plan'),
    agent: request.agentId,
    domain: agent.domain,
    objective: request.objective || request.query || 'unspecified',
    steps: [
      { step: 1, type: 'observe', status: 'ready' },
      { step: 2, type: 'reason', status: 'ready' },
      { step: 3, type: 'validate', status: 'ready' },
      { step: 4, type: 'recommend', status: policy.requiresHumanApproval ? 'approval_required' : 'ready' },
      { step: 5, type: 'execute', status: policy.allowed && request.execute === true ? 'eligible' : 'human_orchestrated' },
    ],
    policy,
  };
}

async function runAgent(request = {}) {
  const agent = validateAgent(request.agentId);
  const plan = buildPlan(agent, request);

  // Existing orchestrator is loaded lazily to avoid circular initialisation.
  const { orchestrator } = require('./aiOrchestratorCore');
  const taskType = request.taskType || 'module_dispatch';
  const payload = request.payload || {
    query: request.query || request.objective,
    context: request.context || {},
    requiredCapabilities: agent.capabilities,
  };

  let result = null;
  if (plan.policy.allowed && request.execute === true) {
    result = await orchestrator.route(taskType, payload, request.options || {});
  }

  return {
    runId: id('run'),
    agentId: request.agentId,
    domain: agent.domain,
    autonomyLevel: plan.policy.level,
    status: plan.policy.requiresHumanApproval ? 'approval_required' : (result ? 'executed' : 'planned'),
    plan,
    result,
    audit: {
      runId: id('audit'),
      timestamp: new Date().toISOString(),
      actor: request.actorId || 'ai-backbone',
      humanApproval: Boolean(request.humanApproval),
    },
  };
}

function listAgents() {
  return Object.entries(AGENTS).map(([id, value]) => ({ id, ...value, sensitive: SENSITIVE_DOMAINS.has(value.domain) }));
}

module.exports = {
  AUTONOMY,
  AGENTS,
  listAgents,
  enforcePolicy,
  buildPlan,
  runAgent,
};
