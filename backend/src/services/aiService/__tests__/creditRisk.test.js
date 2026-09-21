'use strict';

// calculateFDI() returns the identical {score: 72, grade: 'B+'} for every
// farmer, which becomes 40% of every real farmer's credit_score below -
// a known, documented, NOT-yet-fixed gap (needs a real FDI service or a
// domain decision on reweighting, not a guess). This test locks in the
// current documented behavior so a future real fix intentionally changes
// it, rather than silently drifting.

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const {
  calculateFDI,
  calculateCreditScore,
  calculateLoanLimit,
  generateCreditRecommendations,
} = require('../creditRisk');

describe('creditRisk.calculateFDI', () => {
  test('documented gap: identical for every farmer pending a real FDI service', () => {
    expect(calculateFDI('farmer-1')).toEqual({ score: 72, grade: 'B+', advance_percentage: 30 });
    expect(calculateFDI('farmer-2')).toEqual({ score: 72, grade: 'B+', advance_percentage: 30 });
  });
});

describe('creditRisk.calculateCreditScore', () => {
  test('rewards a strong repayment history and certifications over a weak one', () => {
    const fdiScore = { score: 80 };
    const goodRepayment = { total_loans: 10, paid_loans: 10 };
    const weakRepayment = { total_loans: 10, paid_loans: 2 };
    const farmer = { certification_count: 2, years_active: 5 };

    const goodScore = calculateCreditScore(fdiScore, goodRepayment, farmer);
    const weakScore = calculateCreditScore(fdiScore, weakRepayment, farmer);
    expect(goodScore).toBeGreaterThan(weakScore);
  });

  test('penalizes a farmer with no loan history and no certifications', () => {
    const fdiScore = { score: 40 };
    const noHistory = { total_loans: 0, paid_loans: 0 };
    const farmer = {};

    const score = calculateCreditScore(fdiScore, noHistory, farmer);
    expect(score).toBeLessThan(40);
  });
});

describe('creditRisk.calculateLoanLimit', () => {
  test('scales with both credit score and farm size', () => {
    expect(calculateLoanLimit(100, 10)).toBe(1000000);
    expect(calculateLoanLimit(50, 5)).toBe(250000);
  });

  test('caps the farm-size multiplier at 10', () => {
    expect(calculateLoanLimit(100, 50)).toBe(calculateLoanLimit(100, 10));
  });
});

describe('creditRisk.generateCreditRecommendations', () => {
  test('offers premium terms for low risk', () => {
    const recs = generateCreditRecommendations('low', 90);
    expect(recs).toContain('Eligible for maximum advance percentage');
  });

  test('requires collateral for high risk', () => {
    const recs = generateCreditRecommendations('high', 20);
    expect(recs).toContain('Require additional collateral');
  });

  test('gives no special recommendation for medium risk', () => {
    const recs = generateCreditRecommendations('medium', 65);
    expect(recs).toEqual([]);
  });
});
