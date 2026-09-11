'use strict';

const crypto = require('crypto');
const { getPostgreSQL } = require('../../database/connection');
const brain = require('./aiBrainService');

const agents = new Map();

function registerAgent({ name, description = '', capabilities = [], handler = null, riskLevel = 'low' }) {
  if (!name || !/^[a-z0-9._-]+$/i.test(name)) throw new Error('Invalid agent name');
  agents.set(name, { name, description, capabilities, handler, riskLevel });
  return { name, description, capabilities, riskLevel };
}

function listAgents() {
  return [...agents.values()].map(({ handler, ...agent }) => agent);
}

function getAgent(name) {
  return agents.get(name) || null;
}

async function persistRun(run) {
  const pg = getPostgreSQL();
  if (!pg) return;
  await pg.query(
    `INSERT INTO ai_agent_runs (id,agent_name,objective,context,plan,status,risk_level,requires_approval,created_by)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9)`,
    [run.id, run.agentName, run.objective, JSON.stringify(run.context), JSON.stringify(run.plan), run.status, run.riskLevel, run.requiresApproval, run.createdBy || null],
  );
  for (const step of run.plan.steps) {
    await pg.query(
      `INSERT INTO ai_agent_steps (run_id,step_no,action,target,parameters,status)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6)`,
      [run.id, step.stepNo, step.action, step.target, JSON.stringify(step.parameters || {}), run.requiresApproval ? 'pending' : 'approved'],
    );
  }
}

async function updateRun(id, patch) {
  const pg = getPostgreSQL();
  if (!pg) return;
  const fields = [];
  const values = [];
  Object.entries(patch).forEach(([key, value]) => {
    const column = { status: 'status', result: 'result', error: 'error', approvedBy: 'approved_by', approvedAt: 'approved_at', startedAt: 'started_at', completedAt: 'completed_at' }[key];
    if (!column) return;
    fields.push(`${column} = $${values.length + 1}${['result'].includes(key) ? '::jsonb' : ''}`);
    values.push(['result'].includes(key) ? JSON.stringify(value) : value);
  });
  if (!fields.length) return;
  values.push(id);
  await pg.query(`UPDATE ai_agent_runs SET ${fields.join(', ')} WHERE id = $${values.length}`, values);
}

async function runAgent(name, input = {}, options = {}) {
  const agent = getAgent(name);
  if (!agent) throw new Error(`Unknown AI agent: ${name}`);
  const recommendations = input.recommendations || agent.capabilities.map(action => ({ action }));
  const decision = brain.decide({ objective: input.objective || name, recommendations, context: { ...input.context, mode: 'execute', approvalContext: options.approvalContext } });
  const id = crypto.randomUUID();
  const run = {
    id, agentName: name, objective: input.objective || name, context: input.context || {},
    plan: decision.plan, status: decision.policy.allowed ? 'approved' : 'awaiting_approval',
    riskLevel: decision.plan.maxRisk, requiresApproval: !decision.policy.allowed || decision.plan.requiresApproval,
    createdBy: options.createdBy || null,
  };
  await persistRun(run);
  if (run.requiresApproval && !options.approvalContext) return { ...run, decision };
  await updateRun(id, { status: 'running', startedAt: new Date().toISOString() });
  try {
    const result = agent.handler ? await agent.handler(input, run.plan, options) : { status: 'planned', steps: run.plan.steps };
    await updateRun(id, { status: 'completed', result, completedAt: new Date().toISOString() });
    return { ...run, status: 'completed', result };
  } catch (error) {
    await updateRun(id, { status: 'failed', error: error.message, completedAt: new Date().toISOString() });
    throw error;
  }
}

registerAgent({ name: 'erp-operations', description: 'ERP operational analysis and bounded workflow execution', capabilities: ['optimize_allocation', 'replenish_stock', 'escalate_overdue', 'reconcile_variance'] });
registerAgent({ name: 'village-supply', description: 'Village demand and supply coordination', capabilities: ['increase_supply', 'optimize_allocation'], riskLevel: 'medium' });
registerAgent({ name: 'commercial-control', description: 'Commercial reconciliation and settlement control', capabilities: ['reconcile_variance'], riskLevel: 'high' });

module.exports = { registerAgent, listAgents, getAgent, runAgent };
