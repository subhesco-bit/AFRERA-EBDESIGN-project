'use strict';

const pool = require('../database/pool');
const ADMIN_ROLES = ['admin', 'superadmin'];
const HIGH_IMPACT_DOMAINS = new Set(['finance', 'insurance', 'pricing', 'procurement', 'subsidy', 'operations']);

async function createProposal(data) {
  const { userId, domain, proposalType, subjectType, subjectId, proposedValue, currentValue, rationale, confidence, modelReference } = data;
  if (!domain || !proposalType || !rationale || proposedValue === undefined) {
    throw new Error('domain, proposalType, proposedValue, and rationale are required');
  }
  const result = await pool.query(
    `INSERT INTO ai_proposals
      (proposed_by, domain, proposal_type, subject_type, subject_id, proposed_value, current_value, rationale, confidence, model_reference)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [userId, domain, proposalType, subjectType || null, subjectId || null, JSON.stringify(proposedValue),
      currentValue === undefined ? null : JSON.stringify(currentValue), rationale, confidence ?? null, modelReference || null]
  );
  return result.rows[0];
}

async function listProposals({ user, status, domain }) {
  const values = [];
  const filters = [];
  if (status) { values.push(status); filters.push(`status = $${values.length}`); }
  if (domain) { values.push(domain); filters.push(`domain = $${values.length}`); }
  if (!ADMIN_ROLES.includes(user.role)) {
    values.push(user.id);
    filters.push(`proposed_by = $${values.length}`);
  }
  const result = await pool.query(
    `SELECT * FROM ai_proposals ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 100`, values
  );
  return result.rows;
}

async function decideProposal({ proposalId, user, decision, rejectionReason }) {
  if (!['approved', 'rejected'].includes(decision)) throw new Error('Invalid proposal decision');
  if (decision === 'rejected' && !rejectionReason?.trim()) throw new Error('Rejection reason is required');
  const result = await pool.query(
    `UPDATE ai_proposals SET status = $1,
      approved_by = CASE WHEN $1 = 'approved' THEN $2 ELSE approved_by END,
      approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
      rejected_by = CASE WHEN $1 = 'rejected' THEN $2 ELSE rejected_by END,
      rejected_at = CASE WHEN $1 = 'rejected' THEN NOW() ELSE rejected_at END,
      rejection_reason = CASE WHEN $1 = 'rejected' THEN $3 ELSE rejection_reason END
     WHERE id = $4 AND status = 'proposed' RETURNING *`,
    [decision, user.id, rejectionReason || null, proposalId]
  );
  if (!result.rows.length) throw new Error('Proposal not found or already decided');
  return result.rows[0];
}

async function executeProposal({ proposalId, user }) {
  const result = await pool.query(
    `UPDATE ai_proposals SET status = 'executed', executed_at = NOW()
     WHERE id = $1 AND status = 'approved' AND approved_by IS NOT NULL RETURNING *`, [proposalId]
  );
  if (!result.rows.length) throw new Error('Only approved proposals can be executed');
  if (HIGH_IMPACT_DOMAINS.has(result.rows[0].domain) && !ADMIN_ROLES.includes(user.role)) {
    throw new Error('High-impact proposals require administrator execution');
  }
  return result.rows[0];
}

module.exports = { createProposal, listProposals, decideProposal, executeProposal };
