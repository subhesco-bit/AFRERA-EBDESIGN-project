const crypto = require('crypto');
const { randomUUID } = crypto;
const { getPostgreSQL } = require('../database/connection');

const POLICY_VERSION = 'phase16-v1';
const RISK_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };
const APPROVAL_REQUIRED = new Set(['payment.release', 'ledger.adjust', 'contract.change', 'credit.approve', 'farmer.price.override', 'settlement.approve']);

function riskFor(action, requestedRisk) {
  if (requestedRisk && RISK_ORDER[requestedRisk] !== undefined) return requestedRisk;
  if (APPROVAL_REQUIRED.has(action)) return 'high';
  if (/delete|cancel|reverse|writeoff/i.test(action)) return 'high';
  if (/read|forecast|recommend|classify|analy[sz]e/i.test(action)) return 'low';
  return 'medium';
}

function evaluate({ action, domain = 'erp', requestedRisk, approvalId, autonomous = false }) {
  const risk = riskFor(action, requestedRisk);
  const approvalRequired = RISK_ORDER[risk] >= RISK_ORDER.high || APPROVAL_REQUIRED.has(action);
  const approved = !approvalRequired || Boolean(approvalId);
  const decision = risk === 'critical' ? 'blocked' : approved ? 'allowed' : 'approval_required';
  if (autonomous && approvalRequired && !approvalId) return { decision: 'approval_required', risk, approvalRequired: true, reason: 'Human approval required before autonomous execution.' };
  return { decision, risk, approvalRequired, policyVersion: POLICY_VERSION, domain };
}

async function audit(entry) {
  const db = getPostgreSQL();
  const id = randomUUID();
  const correlationId = entry.correlationId || randomUUID();
  const inputHash = crypto.createHash('sha256').update(JSON.stringify(entry.metadata || {})).digest('hex');
  if (!db) return { id, correlationId, inputHash, persisted: false };
  await db.query(`INSERT INTO ai_governance_audit
    (id, correlation_id, actor_id, actor_type, action, domain, risk_level, decision, approval_required, approval_id, policy_version, input_hash, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
    id, correlationId, entry.actorId || null, entry.actorType || 'system', entry.action, entry.domain || 'erp',
    entry.risk, entry.decision, entry.approvalRequired, entry.approvalId || null, POLICY_VERSION, inputHash, JSON.stringify(entry.metadata || {})
  ]);
  return { id, correlationId, inputHash, persisted: true };
}

async function authorize(entry) {
  const result = evaluate(entry);
  const auditRecord = await audit({ ...entry, ...result });
  return { ...result, ...auditRecord };
}

module.exports = { POLICY_VERSION, evaluate, authorize, audit, riskFor };
