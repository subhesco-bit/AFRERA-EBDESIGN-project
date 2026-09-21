/** Gate engine — blocking requirements evaluation (deterministic). */

'use strict';

const pool = require('../database/pool');

async function listGates(caseId) {
  const { rows } = await pool.query(
    `SELECT * FROM vc_gates WHERE case_id = $1 ORDER BY gate_code`,
    [caseId],
  );
  return rows;
}

/**
 * Evaluate a gate from requirement checklist.
 * requirements: [{ id, label, met: boolean, blocking?: boolean }]
 */
async function evaluateGate(caseId, gateCode, requirements) {
  if (!Array.isArray(requirements)) throw new Error('requirements array required');
  const blockingUnmet = requirements.filter((r) => r.blocking !== false && !r.met);
  const status = blockingUnmet.length ? 'blocked' : 'passed';

  const { rows } = await pool.query(
    `UPDATE vc_gates
        SET status = $3, requirements = $4, evaluated_at = now()
      WHERE case_id = $1 AND gate_code = $2
      RETURNING *`,
    [caseId, gateCode, status, JSON.stringify(requirements)],
  );
  if (!rows[0]) throw new Error(`Gate ${gateCode} not found on case`);
  return {
    gate: rows[0],
    status,
    blockingUnmet: blockingUnmet.map((r) => r.id || r.label),
  };
}

module.exports = {
  listGates,
  evaluateGate,
};
