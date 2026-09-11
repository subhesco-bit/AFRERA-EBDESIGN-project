const crypto = require('crypto');
const { getPostgreSQL } = require('../database/connection');
const governance = require('./aiGovernanceService');

const DEFAULT_LIMITS = { maxExecutionSeconds: 30, maxRetries: 1, maxItems: 100 };
const SAFE_AUTONOMOUS_ACTIONS = new Set(['inventory.reorder.propose', 'demand.aggregate', 'forecast.refresh', 'alert.create', 'shipment.risk.flag', 'recommendation.create']);

async function propose({ agentName, actionType, payload = {}, scope = {}, actorId, correlationId, limits = {} }) {
  const decision = await governance.authorize({ action: actionType, domain: 'autonomous', actorId, correlationId, autonomous: true, metadata: { agentName, payload, scope } });
  const safe = SAFE_AUTONOMOUS_ACTIONS.has(actionType);
  const approvalRequired = decision.approvalRequired || !safe;
  const actionId = `auto_${crypto.randomUUID()}`;
  const db = getPostgreSQL();
  const bounded = { ...DEFAULT_LIMITS, ...limits };
  const status = decision.decision === 'blocked' ? 'blocked' : approvalRequired ? 'awaiting_approval' : 'proposed';
  if (db) await db.query(`INSERT INTO ai_autonomous_actions
    (id,action_id,correlation_id,requested_by,agent_name,action_type,risk_level,resource_scope,requested_payload,policy_version,max_execution_seconds,max_retries,approval_required,approval_id,status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`, [
    crypto.randomUUID(), actionId, decision.correlationId, actorId || null, agentName, actionType, decision.risk,
    JSON.stringify(scope), JSON.stringify(payload), governance.POLICY_VERSION, bounded.maxExecutionSeconds, bounded.maxRetries,
    approvalRequired, null, status
  ]);
  return { actionId, correlationId: decision.correlationId, status, approvalRequired, risk: decision.risk, limits: bounded, policyVersion: governance.POLICY_VERSION };
}

async function approve(actionId, approvalId) {
  if (!approvalId) throw new Error('approvalId is required');
  const db = getPostgreSQL();
  if (!db) throw new Error('Database is required for autonomous approval');
  const result = await db.query(`UPDATE ai_autonomous_actions SET approval_id=$2,status='approved' WHERE action_id=$1 AND status='awaiting_approval' RETURNING action_id,status,approval_id`, [actionId, approvalId]);
  if (!result.rows[0]) throw new Error('Action is not awaiting approval or does not exist');
  return result.rows[0];
}

async function execute(actionId, executor) {
  if (typeof executor !== 'function') throw new Error('executor is required');
  const db = getPostgreSQL();
  if (!db) throw new Error('Database is required for autonomous execution');
  const { rows } = await db.query(`SELECT * FROM ai_autonomous_actions WHERE action_id=$1`, [actionId]);
  const action = rows[0];
  if (!action) throw new Error('Action not found');
  if (!['proposed','approved'].includes(action.status)) throw new Error(`Action cannot execute from status ${action.status}`);
  if (action.approval_required && !action.approval_id) throw new Error('Human approval required before execution');
  await db.query(`UPDATE ai_autonomous_actions SET status='running',started_at=NOW() WHERE action_id=$1`, [actionId]);
  const timeout = Math.max(1, Math.min(Number(action.max_execution_seconds) || 30, 300)) * 1000;
  try {
    const result = await Promise.race([executor(action), new Promise((_, reject) => setTimeout(() => reject(new Error('Autonomous execution timeout')), timeout))]);
    await db.query(`UPDATE ai_autonomous_actions SET status='completed',result=$2,completed_at=NOW() WHERE action_id=$1`, [actionId, JSON.stringify(result || {})]);
    return { actionId, status: 'completed', result };
  } catch (error) {
    await db.query(`UPDATE ai_autonomous_actions SET status='failed',error=$2,completed_at=NOW() WHERE action_id=$1`, [actionId, error.message]);
    throw error;
  }
}

module.exports = { propose, approve, execute, SAFE_AUTONOMOUS_ACTIONS, DEFAULT_LIMITS };
