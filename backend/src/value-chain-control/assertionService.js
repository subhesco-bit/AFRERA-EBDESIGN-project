/** Field-level provenance assertions for a VC case. */

'use strict';

const pool = require('../database/pool');

const CLASSES = [
  'AUTHORITATIVE', 'VERIFIED', 'TRANSACTIONAL', 'SENSOR_OBSERVED',
  'USER_DECLARED', 'CALCULATED', 'ESTIMATED', 'STALE', 'CONFLICTED', 'MISSING',
];

async function assertField(caseId, {
  fieldKey, value, unit, evidenceClass, sourceSystem, sourceRecord,
  calculationId, calculationVersion, assumptionId, effectiveFrom, effectiveTo,
}) {
  if (!fieldKey) throw new Error('fieldKey is required');
  if (value === undefined) throw new Error('value is required');
  if (!CLASSES.includes(evidenceClass)) {
    throw new Error(`evidenceClass must be one of ${CLASSES.join(', ')}`);
  }
  if (evidenceClass === 'AI_GENERATED') {
    throw new Error('AI_GENERATED is not allowed on authoritative assertions');
  }
  if (['AUTHORITATIVE', 'VERIFIED', 'TRANSACTIONAL', 'SENSOR_OBSERVED'].includes(evidenceClass)
    && (!sourceSystem || !sourceRecord)) {
    throw new Error(`${evidenceClass} assertions require sourceSystem and sourceRecord`);
  }
  if (evidenceClass === 'CALCULATED' && (!calculationId || !calculationVersion)) {
    throw new Error('CALCULATED assertions require calculationId and calculationVersion');
  }

  const { rows } = await pool.query(
    `INSERT INTO vc_assertions
       (case_id, field_key, value, unit, evidence_class, source_system, source_record,
        calculation_id, calculation_version, assumption_id, effective_from, effective_to)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      caseId, fieldKey, JSON.stringify(value), unit || null, evidenceClass,
      sourceSystem || null, sourceRecord || null,
      calculationId || null, calculationVersion || null, assumptionId || null,
      effectiveFrom || null, effectiveTo || null,
    ],
  );
  return rows[0];
}

async function listAssertions(caseId, fieldKey = null) {
  const params = [caseId];
  let q = 'SELECT * FROM vc_assertions WHERE case_id = $1';
  if (fieldKey) {
    params.push(fieldKey);
    q += ` AND field_key = $${params.length}`;
  }
  q += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(q, params);
  return rows;
}

module.exports = {
  CLASSES,
  assertField,
  listAssertions,
};
