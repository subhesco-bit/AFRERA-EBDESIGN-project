/**
 * Unified AI Backbone Runtime
 * Governed control plane for generative, agentic and autonomous AI.
 */
'use strict';

const crypto = require('crypto');

const AUTONOMY = Object.freeze({ ASSIST: 0, RECOMMEND: 1, PLAN: 2, EXECUTE_LOW_RISK: 3, EXECUTE_APPROVED: 4 });
const SENSITIVE = new Set(['medical', 'biological', 'nutrition', 'veterinary']);
const HIGH_IMPACT = new Set(['diagnose', 'prescribe', 'approve_payment', 'release_payment', 'alter_ledger', 'change_insurance_coverage', 'delete', 'irreversible']);
const DEFAULT_POLICY = Object.freeze({ maxSteps: 12, maxToolCalls: 24, externalSideEffects: false });

const AGENTS = Object.freeze({
  enterprise: ['analysis', 'planning', 'reporting'], finance: ['reconciliation', 'forecasting', 'planning'],
  supply_chain: ['demand', 'procurement', 'inventory', 'allocation'], rural_economy: ['aggregation', 'capacity', 'market'],
  metro_commerce: ['catalogue', 'demand', 'pricing', 'orders'], logistics: ['routing', 'capacity', 'tracking', 'exceptions'],
  quality: ['inspection', 'traceability', 'risk'], workforce: ['matching', 'scheduling', 'compliance'],
  insurance: ['risk', 'claims', 'fraud_detection'], nutrition: ['nutrient_analysis', 'diet_planning', 'education'],
  medical_biological: ['evidence_retrieval', 'biological_analysis', 'clinical_support'],
});

function trace(prefix = 'ai') { return `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`; }
function policyFor(policy = {}) { return { ...DEFAULT_POLICY, ...policy }; }
function assess({ agentId, action = 'recommend', autonomyLevel = AUTONOMY.RECOMMEND, domains = [], steps = 0, toolCalls = 0, policy = {} }) {
  if (!AGENTS[agentId]) throw new Error(`Unknown AI agent: ${agentId}`);
  const p = policyFor(policy); const sensitive = domains.some((d) => SENSITIVE.has(String(d).toLowerCase()));
  const highImpact = HIGH_IMPACT.has(action); const withinLimits = steps <= p.maxSteps && toolCalls <= p.maxToolCalls;
  const approvalRequired = sensitive || highImpact || autonomyLevel >= AUTONOMY.EXECUTE_APPROVED;
  return { agentId, autonomyLevel, withinLimits, approvalRequired, allowed: withinLimits && !approvalRequired && autonomyLevel <= AUTONOMY.EXECUTE_LOW_RISK && (p.externalSideEffects || autonomyLevel < AUTONOMY.EXECUTE_LOW_RISK), reason: sensitive ? 'sensitive_domain_human_control' : highImpact ? 'high_impact_human_approval' : 'policy_evaluation' };
}
function createPlan(agentId, objective, steps = [], context = {}) {
  const assessment = assess({ agentId, autonomyLevel: AUTONOMY.PLAN, steps: steps.length, domains: context.domains || [], policy: context.policy });
  if (!assessment.withinLimits) throw new Error('Plan exceeds configured execution limits');
  return { planId: trace('plan'), agentId, objective, steps: steps.map((action, i) => ({ index: i + 1, action: String(action), status: 'pending' })), assessment };
}
async function run({ agentId, objective, action = 'recommend', autonomyLevel = AUTONOMY.RECOMMEND, domains = [], steps = [], toolCalls = 0, humanApproved = false, policy = {}, executor = null }) {
  const assessment = assess({ agentId, action, autonomyLevel, domains, steps: steps.length, toolCalls, policy });
  if (assessment.approvalRequired && !humanApproved) return { runId: trace('run'), status: 'approval_required', assessment };
  if (!assessment.withinLimits) return { runId: trace('run'), status: 'limit_exceeded', assessment };
  if (autonomyLevel >= AUTONOMY.EXECUTE_LOW_RISK && !policyFor(policy).externalSideEffects && !humanApproved) return { runId: trace('run'), status: 'execution_disabled', assessment };
  const result = typeof executor === 'function' ? await executor() : null;
  return { runId: trace('run'), status: result === null ? 'planned' : 'executed', assessment, result };
}
module.exports = { AUTONOMY, AGENTS, SENSITIVE, HIGH_IMPACT, DEFAULT_POLICY, trace, policyFor, assess, createPlan, run };
