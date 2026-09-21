'use strict';

const massBalance = require('../value-chain-control/massBalanceEngine');

describe('value-chain control integrity', () => {
  test('projects deterministic handling loss with an explicit stage', () => {
    expect(massBalance.projectChain(1000, [{ stage: 'grading', lossFraction: 0.08 }])).toMatchObject({
      saleableQty: 920,
      evidenceClass: 'CALCULATED',
    });
  });

  test('rejects non-numeric mass values instead of silently treating them as zero', () => {
    expect(() => massBalance.reconcile({ qtyIn: 'not-a-number' })).toThrow('qtyIn must be a finite non-negative number');
    expect(() => massBalance.projectChain(100, [{ stage: 'grading', lossFraction: 'not-a-number' }])).toThrow('Invalid lossFraction');
  });

  test('requires named stages for a traceable projection', () => {
    expect(() => massBalance.projectChain(100, [{ lossFraction: 0.1 }])).toThrow('stage name');
  });
});
