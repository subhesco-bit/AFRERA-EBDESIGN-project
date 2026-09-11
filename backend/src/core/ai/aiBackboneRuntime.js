/**
 * Unified AI Backbone Runtime
 * Governed control plane for generative, agentic and autonomous AI.
 *
 * The runtime is deliberately provider-neutral. It governs intent, autonomy,
 * tools, approvals and execution; model/provider selection remains in the
 * existing AI provider and engine layers.
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

const SENSITIVE = new Set(['medical', 'biological', 'nutrition', 'veterinary']);
const HIGH_IMPACT = new Set([
  'diagnose', 'prescribe', 'approve_payment', 'release_payment',
  'alter_ledger', 'change_insurance_coverage', 'delete', 'irreversible',
]);

const DEFAULT_POLICY = Object.freeze({
  maxSteps: 12,
  maxToolCalls: 24,
  externalSideEffects: false,
});

const AGENTS = Object.freeze({
  enterprise: { domain: 'enterprise', capabilities: ['analysis', 'planning', 'reporting'] },
  finance: { domain: 'finance', capabilities: ['reconciliation', 'forecasting', 'planning'] },
  supply_chain: { domain: 'supply_chain', capabilities: ['demand', 'procurement', 'inventory', 'allocation'] },
  rural_economy: { domain: 'rural_economy', capabilities: ['aggregation', 'capacity', 'market'] },
  metro_commerce: { domain: 'metro_commerce', capabilities: ['catalogue', 'demand', 'pricing', 'orders'] },
  logistics: { domain: 'logistics', capabilities: ['routing', 'capacity', 'tracking', 'exceptions'] },
  quality: { domain: 'quality', capabilities: ['inspection', 'traceability', 'risk'] },
  workforce: { domain: 'workforce', capabilities: ['matching', 'scheduling', 'compliance'] },
  insurance: { domain: 'insurance', capabilities: ['risk', 'claims', 'fraud_detection'] },
  nutrition: { domain: 'nutrition', capabilities: ['nutrient_analysis', 'diet_planning', 'education'], sensitive: true },
  medical_biological: { domain: 'medical_biological', capabilities: ['evidence_retrieval', 'biological_analysis', 'clinical_support'], sensitive: true },
});

function trace(prefix = 'ai') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

function policyFor(policy = {}) {
  return { ...DEFAULT_POLICY, ...policy };
}

function agentIdOf(agentOrId) {
  if (typeof agentOrId === 'string') return agentOrId;
  if (agentOrId && agentOrId.domain && AGENTS[agentOrId.domain]) return agentOrId.domain;
  return null;
}

function enforcePolicy(agentOrId, {
  action = 'recommend',
  autonomyLevel = AUTONOMY.RECOMMEND,
  domains = [],
  steps = 0,
  toolCalls = 0,
  policy = {},
} = {}) {
  const agentId = agentIdOf(agentOrId);
  if (!agentId) throw new Error('Unknown AI agent');
  const p = policyFor(policy);
  const agent = AGENTS[agentId];
  const sensitive = agent.sensitive || domains.some((d) => SENSITIVE.has(String(d).toLowerCase()));
  const highImpact = HIGH_IMPACT.has(action);
  const withinLimits = steps <= p.maxSteps && toolCalls <= p.maxToolCalls;

  // Sensitive domains never receive autonomous execution from this control plane.
  // High-impact actions require explicit human approval.
  const requiresHumanApproval = sensitive || highImpact || autonomyLevel >= AUTONOMY.EXECUTE_APPROVED;
  const effectiveLevel = sensitive ? Math.min(autonomyLevel, AUTONOMY.RECOMMEND) : autonomyLevel;
  const lowRiskExecution = effectiveLevel === AUTONOMY.EXECUTE_LOW_RISK;
  const allowed = withinLimits
    && !requiresHumanApproval
    && effectiveLevel <= AUTONOMY.EXECUTE_LOW_RISK
    && (p.externalSideEffects || !lowRiskExecution);

  return {
    agentId,
    domain: agent.domain,
    level: effectiveLevel,
    autonomyLevel: effectiveLevel,
    withinLimits,
    requiresHumanApproval,
    approvalRequired: requiresHumanApproval,
    allowed,
    reason: sensitive ? 'sensitive_domain_human_control' : highImpact ? 'high_impact_human_approval' : 'policy_evaluation',
  };
}

function assess(args = {}) {
  return enforcePolicy(args.agentId, args);
}

function buildPlan(agentOrId, context = {}) {
  const agentId = agentIdOf(agentOrId);
  if (!agentId) throw new Error('Unknown AI agent');
  const requestedLevel = context.autonomyLevel ?? AUTONOMY.PLAN;
  const assessment = enforcePolicy(agentId, {
    action: context.action || 'recommend',
    autonomyLevel: requestedLevel,
    domains: context.domains || [],
    steps: 5,
    toolCalls: context.toolCalls || 0,
    policy: context.policy || {},
  });
  const shouldExecute = Boolean(context.execute) && requestedLevel >= AUTONOMY.EXECUTE_LOW_RISK;
  const stepTypes = ['observe', 'reason', 'validate', 'recommend'];
  if (shouldExecute) stepTypes.push('execute');
  return {
    planId: trace('plan'),
    agentId,
    objective: context.objective || 'unspecified',
    steps: stepTypes.map((type, index) => ({ index: index + 1, type, action: type, status: 'pending' })),
    assessment,
  };
}

function createPlan(agentOrId, objective, steps = [], context = {}) {
  const agentId = agentIdOf(agentOrId);
  if (!agentId) throw new Error('Unknown AI agent');
  const assessment = enforcePolicy(agentId, {
    autonomyLevel: AUTONOMY.PLAN,
    steps: steps.length,
    domains: context.domains || [],
    policy: context.policy || {},
  });
  if (!assessment.withinLimits) throw new Error('Plan exceeds configured execution limits');
  return {
    planId: trace('plan'),
    agentId,
    objective,
    steps: steps.map((action, index) => ({ index: index + 1, action: String(action), status: 'pending' })),
    assessment,
  };
}

function listAgents() {
  return Object.entries(AGENTS).map(([id, definition]) => ({ id, ...definition }));
}

async function run({
  agentId,
  objective,
  action = 'recommend',
  autonomyLevel = AUTONOMY.RECOMMEND,
  domains = [],
  steps = [],
  toolCalls = 0,
  humanApproved = false,
  approvalContext = null,
  policy = {},
  executor = null,
}) {
  const assessment = enforcePolicy(agentId, { action, autonomyLevel, domains, steps: steps.length, toolCalls, policy });

  if (assessment.requiresHumanApproval && !humanApproved) {
    return { runId: trace('run'), status: 'approval_required', assessment };
  }
  if (!assessment.withinLimits) {
    return { runId: trace('run'), status: 'limit_exceeded', assessment };
  }
  if (assessment.requiresHumanApproval && humanApproved && !approvalContext) {
    return { runId: trace('run'), status: 'approval_context_required', assessment };
  }
  if (autonomyLevel >= AUTONOMY.EXECUTE_LOW_RISK && !policyFor(policy).externalSideEffects && !humanApproved) {
    return { runId: trace('run'), status: 'execution_disabled', assessment };
  }

  const result = typeof executor === 'function' ? await executor() : null;
  return {
    runId: trace('run'),
    status: result === null ? 'planned' : 'executed',
    assessment,
    approvalContext: humanApproved ? approvalContext : null,
    result,
  };
}

async function runAgent({
  agentId,
  objective,
  action = 'recommend',
  taskType,
  payload = {},
  context = {},
  query,
  execute = false,
  autonomyLevel = AUTONOMY.RECOMMEND,
  options = {},
  actorId,
}) {
  const agent = AGENTS[agentId];
  if (!agent) {
    const error = new Error(`Unknown AI agent: ${agentId}`);
    error.code = 'UNKNOWN_AI_AGENT';
    throw error;
  }
  const plan = buildPlan(agentId, {
    objective: objective || taskType || 'AI task',
    execute,
    autonomyLevel,
    action,
    domains: context.domains || [agent.domain],
    policy: options.policy || {},
  });
  return run({
    agentId,
    objective: objective || taskType,
    action,
    autonomyLevel,
    domains: context.domains || [agent.domain],
    steps: plan.steps,
    toolCalls: options.toolCalls || 0,
    humanApproved: Boolean(options.humanApproved),
    approvalContext: options.approvalContext || null,
    policy: options.policy || {},
    executor: options.executor || null,
  }).then(result => ({
    ...result,
    taskType,
    query: query || payload.query,
    actorId: actorId || null,
    plan,
  }));
}

module.exports = {
  AUTONOMY,
  AGENTS,
  SENSITIVE,
  HIGH_IMPACT,
  DEFAULT_POLICY,
  trace,
  policyFor,
  agentIdOf,
  enforcePolicy,
  assess,
  buildPlan,
  createPlan,
  listAgents,
  run,
  runAgent,
};
