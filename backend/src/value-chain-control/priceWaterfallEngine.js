/**
 * Price waterfall — delivered → farm-gate economics.
 * Every line is explicit; totals CALCULATED from supplied line amounts only.
 */

'use strict';

const { runCalculation } = require('./calculationRegistry');

/**
 * @param {number} deliveredPricePerKg
 * @param {Array<{ label: string, amount: number, evidenceClass?: string, source?: string }>} deductions
 */
function buildWaterfall(deliveredPricePerKg, deductions = []) {
  const delivered = Number(deliveredPricePerKg);
  if (!(delivered >= 0)) throw new Error('deliveredPricePerKg required');

  const lines = [
    {
      label: 'Buyer / delivered price',
      amount: delivered,
      sign: '+',
      evidenceClass: 'USER_DECLARED',
    },
  ];

  for (const d of deductions) {
    const amount = Number(d.amount);
    if (!(amount >= 0)) throw new Error(`Invalid deduction: ${d.label}`);
    lines.push({
      label: d.label,
      amount,
      sign: '-',
      evidenceClass: d.evidenceClass || 'USER_DECLARED',
      source: d.source || null,
    });
  }

  const net = runCalculation('PRICE-FARMGATE-NET-001', {
    deliveredPrice: delivered,
    deductions: deductions.map((d) => ({ label: d.label, amount: d.amount })),
  });

  return {
    lines,
    farmGateNetPerKg: net.value,
    unit: 'INR/kg',
    calculation: net,
    evidenceClass: 'CALCULATED',
    note: 'Net is CALCULATED; line evidence classes are as supplied',
  };
}

module.exports = {
  buildWaterfall,
};
