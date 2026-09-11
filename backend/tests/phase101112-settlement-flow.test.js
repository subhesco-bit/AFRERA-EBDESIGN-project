const settlement = require('../src/services/commercialSettlementService');

describe('Phase 10-12 settlement controls', () => {
  test('allows only controlled settlement transitions', () => {
    expect(settlement.TRANSITIONS.pending).toContain('approved');
    expect(settlement.TRANSITIONS.paid).toContain('reversed');
    expect(settlement.TRANSITIONS.pending).not.toContain('paid');
  });

  test('does not permit processing to skip to paid from queued', () => {
    expect(settlement.TRANSITIONS.queued).toEqual(['processing','cancelled']);
  });
});
