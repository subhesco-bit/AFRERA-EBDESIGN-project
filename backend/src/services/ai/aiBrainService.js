'use strict';

const RISK_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };
const HIGH_IMPACT_ACTIONS = new Set([
  'approve_payment', 'release_payment', 'modify_ledger', 'delete_record',
  'change_contract', 'issue_refund', 'approve_credit', 'change_farmer_price',
]);

function classifyAction(action = '') {
  if (HIGH_IMPACT_ACTIONS.has(action)) return 'high';
  if (/delete|cancel|close|publish|dispatch|allocate|reconcile/i.test(action)) return 'medium';
  return 'low';
}

function buildPlan(objective, recommendations = []) {
  const steps = recommendations.map((r, index) => ({
    stepNo: index + 1,
    action: r.action,
    target: r.target || null,
    parameters: r.parameters || {},
    riskLevel: classifyAction(r.action),
    requiresApproval: classifyAction(r.action) !== 'low' || r.requiresApproval === true,
    reason: r.reason || 'AI recommendation',
  }));
  return { objective, steps, requiresApproval: steps.some(s => s.requiresApproval), maxRisk: steps.reduce((max, s) => RISK_ORDER[s.riskLevel] > RISK_ORDER[max] ? s.riskLevel : max, 'low') };
}

function enforcePolicy(plan, context = {}) {
  const actor = context.actor || null;
  if (!plan || !Array.isArray(plan.steps)) throw new Error('Invalid AI plan');
  const violations = [];
  for (const step of plan.steps) {
    if (step.riskLevel === 'critical') violations.push({ stepNo: step.stepNo, code: 'CRITICAL_ACTION_BLOCKED' });
    if (step.requiresApproval && !context.approvalContext && context.mode === 'execute') {
      violations.push({ stepNo: step.stepNo, code: 'APPROVAL_REQUIRED' });
    }
  }
  return { allowed: violations.length === 0, violations, actor, policyVersion: 'phase13-15-v1' };
}

function decide({ objective, recommendations = [], context = {} } = {}) {
  const plan = buildPlan(objective || 'ERP decision', recommendations);
  const policy = enforcePolicy(plan, context);
  return { plan, policy, decision: policy.allowed ? 'allowed' : 'approval_required' };
}

module.exports = { classifyAction, buildPlan, enforcePolicy, decide };
