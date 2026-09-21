/**
 * Versioned calculation registry — authoritative formulas only.
 * No LLM. Inputs must be supplied; missing inputs → honest error.
 */

'use strict';

const pool = require('../database/pool');

/** In-memory seed (also loadable from vc_calculation_definitions). */
const BUILTIN = {
  'LOGISTICS-KG-003': {
    version: '1.0',
    name: 'Logistics cost per kg',
    formula_text: '(distanceKm * ratePerKm) / payloadKg',
    inputs: ['distanceKm', 'ratePerKm', 'payloadKg'],
    unit: 'INR/kg',
    compute(inputs) {
      const d = Number(inputs.distanceKm);
      const r = Number(inputs.ratePerKm);
      const p = Number(inputs.payloadKg);
      if (!(d >= 0) || !(r >= 0) || !(p > 0)) {
        throw new Error('LOGISTICS-KG-003 requires distanceKm>=0, ratePerKm>=0, payloadKg>0');
      }
      return Math.round(((d * r) / p) * 100) / 100;
    },
  },
  'PRICE-FARMGATE-NET-001': {
    version: '1.0',
    name: 'Farm-gate net from delivered price',
    formula_text: 'deliveredPrice - sum(deductions[])',
    inputs: ['deliveredPrice', 'deductions'],
    unit: 'INR/kg',
    compute(inputs) {
      const delivered = Number(inputs.deliveredPrice);
      if (!(delivered >= 0)) throw new Error('deliveredPrice required');
      const deductions = Array.isArray(inputs.deductions) ? inputs.deductions : [];
      let sum = 0;
      for (const d of deductions) {
        const v = Number(d.amount);
        if (!(v >= 0)) throw new Error(`deduction ${d.label || '?'} invalid`);
        sum += v;
      }
      return Math.round((delivered - sum) * 100) / 100;
    },
  },
  'MASS-LOSS-001': {
    version: '1.0',
    name: 'Qty after fractional loss',
    formula_text: 'qtyIn * (1 - lossFraction)',
    inputs: ['qtyIn', 'lossFraction'],
    unit: 'kg',
    compute(inputs) {
      const q = Number(inputs.qtyIn);
      const f = Number(inputs.lossFraction);
      if (!(q >= 0) || !(f >= 0) || f >= 1) throw new Error('qtyIn>=0 and 0<=lossFraction<1');
      return Math.round(q * (1 - f) * 1000) / 1000;
    },
  },
};

function listDefinitions() {
  return Object.entries(BUILTIN).map(([calculationId, def]) => ({
    calculationId,
    version: def.version,
    name: def.name,
    formula_text: def.formula_text,
    inputs: def.inputs,
    unit: def.unit,
  }));
}

function runCalculation(calculationId, inputs, version = null) {
  const def = BUILTIN[calculationId];
  if (!def) throw new Error(`Unknown calculationId: ${calculationId}`);
  if (version && version !== def.version) {
    throw new Error(`Version ${version} not loaded for ${calculationId} (have ${def.version})`);
  }
  const value = def.compute(inputs || {});
  return {
    calculationId,
    version: def.version,
    value,
    unit: def.unit,
    evidenceClass: 'CALCULATED',
    formula_text: def.formula_text,
    inputs,
  };
}

async function persistDefinition(row) {
  await pool.query(
    `INSERT INTO vc_calculation_definitions
       (calculation_id, version, name, formula_text, inputs, unit, effective_from)
     VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE)
     ON CONFLICT (calculation_id, version) DO UPDATE SET formula_text = EXCLUDED.formula_text`,
    [
      row.calculationId, row.version, row.name, row.formula_text,
      JSON.stringify(row.inputs || []), row.unit || null,
    ],
  );
}

module.exports = {
  BUILTIN,
  listDefinitions,
  runCalculation,
  persistDefinition,
};
