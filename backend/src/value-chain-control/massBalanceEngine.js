/**
 * Mass-balance engine — physical reconciliation.
 * INPUT = OUTPUT + byproduct + waste + loss (+ unexplained if any).
 * All quantities caller-supplied; never invented.
 */

'use strict';

const pool = require('../database/pool');

function reconcile(line) {
  const qtyIn = Number(line.qtyIn) || 0;
  const qtyOut = Number(line.qtyOut) || 0;
  const byproduct = Number(line.byproduct) || 0;
  const waste = Number(line.waste) || 0;
  const loss = Number(line.loss) || 0;
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
  if (!(Number(harvestQty) >= 0)) throw new Error('harvestQty required');
  let current = Number(harvestQty);
  const steps = [];
  for (const s of stages || []) {
    const f = Number(s.lossFraction) || 0;
    if (f < 0 || f >= 1) throw new Error(`Invalid lossFraction at ${s.stage}`);
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
  reconcile,
  addLine,
  listLines,
  projectChain,
};
