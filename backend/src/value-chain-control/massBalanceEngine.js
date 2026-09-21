/**
 * Mass-balance engine — physical reconciliation.
 * INPUT = OUTPUT + byproduct + waste + loss (+ unexplained if any).
 * All quantities caller-supplied; never invented.
 */

'use strict';

const pool = require('../database/pool');

function nonNegative(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${name} must be a finite non-negative number`);
  }
  return number;
}

function reconcile(line) {
  if (!line || typeof line !== 'object') throw new Error('mass-balance line is required');
  const qtyIn = nonNegative(line.qtyIn, 'qtyIn');
  const qtyOut = nonNegative(line.qtyOut ?? 0, 'qtyOut');
  const byproduct = nonNegative(line.byproduct ?? 0, 'byproduct');
  const waste = nonNegative(line.waste ?? 0, 'waste');
  const loss = nonNegative(line.loss ?? 0, 'loss');
  const accounted = qtyOut + byproduct + waste + loss;
  const unexplained = Math.round((qtyIn - accounted) * 1000) / 1000;
  return {
    qtyIn, qtyOut, byproduct, waste, loss,
    accounted,
    unexplainedVariance: unexplained,
    balanced: Math.abs(unexplained) < 0.001,
    unit: line.unit || 'kg',
    evidenceClass: line.evidenceClass || 'USER_DECLARED',
  };
}

async function addLine(caseId, line) {
  if (!caseId) throw new Error('caseId is required');
  if (!line?.stage || typeof line.stage !== 'string') throw new Error('stage is required');
  const r = reconcile(line);
  const { rows } = await pool.query(
    `INSERT INTO vc_mass_balance_lines
       (case_id, stage, qty_in, qty_out, byproduct, waste, loss, unit, evidence_class, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      caseId, line.stage, r.qtyIn, r.qtyOut, r.byproduct, r.waste, r.loss,
      r.unit, r.evidenceClass, line.note || null,
    ],
  );
  return { row: rows[0], reconciliation: r };
}

async function listLines(caseId) {
  const { rows } = await pool.query(
    `SELECT * FROM vc_mass_balance_lines WHERE case_id = $1 ORDER BY created_at`,
    [caseId],
  );
  return rows.map((row) => ({
    row,
    reconciliation: reconcile({
      qtyIn: row.qty_in,
      qtyOut: row.qty_out,
      byproduct: row.byproduct,
      waste: row.waste,
      loss: row.loss,
      unit: row.unit,
      evidenceClass: row.evidence_class,
    }),
  }));
}

/** Chain simple sequential losses from harvest qty + loss fractions (ESTIMATED path). */
function projectChain(harvestQty, stages) {
  // stages: [{ stage, lossFraction, evidenceClass? }]
  if (!Array.isArray(stages)) throw new Error('stages array required');
  let current = nonNegative(harvestQty, 'harvestQty');
  const steps = [];
  for (const s of stages || []) {
    if (!s?.stage || typeof s.stage !== 'string') throw new Error('Each mass-balance stage needs a stage name');
    const f = Number(s.lossFraction);
    if (!Number.isFinite(f) || f < 0 || f >= 1) throw new Error(`Invalid lossFraction at ${s.stage}`);
    const loss = Math.round(current * f * 1000) / 1000;
    const out = Math.round((current - loss) * 1000) / 1000;
    steps.push({
      stage: s.stage,
      qtyIn: current,
      qtyOut: out,
      loss,
      lossFraction: f,
      evidenceClass: s.evidenceClass || 'ESTIMATED',
      unit: 'kg',
    });
    current = out;
  }
  return { saleableQty: current, steps, evidenceClass: 'CALCULATED' };
}

module.exports = {
  nonNegative,
  reconcile,
  addLine,
  listLines,
  projectChain,
};
