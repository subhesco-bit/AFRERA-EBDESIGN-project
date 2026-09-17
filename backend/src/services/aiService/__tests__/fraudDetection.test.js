'use strict';

// checkLocationAnomaly() used to return a hardcoded 0.2 regardless of
// input - since the caller only acts on a risk above 0.5, this silently
// never contributed to the fraud score while looking like a real,
// evaluated signal. It now honestly returns null ("not evaluated").
// matchesPattern() has no defined schema to match against and honestly
// still returns false - documented, not changed - these tests lock in
// both current, honest behaviors.

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const { checkLocationAnomaly, matchesPattern, generateFraudRecommendations } = require('../fraudDetection');

describe('fraudDetection.checkLocationAnomaly', () => {
  test('honestly reports not evaluated instead of a fabricated risk value', () => {
    expect(checkLocationAnomaly({ amount: 50000 })).toBeNull();
  });
});

describe('fraudDetection.matchesPattern', () => {
  test('never matches - no real pattern-matching schema is implemented', () => {
    expect(matchesPattern({ amount: 50000 }, { name: 'test_pattern', risk_score: 0.9 })).toBe(false);
  });
});

describe('fraudDetection.generateFraudRecommendations', () => {
  test('recommends manual review actions when decision is review', () => {
    const recs = generateFraudRecommendations('review', []);
    expect(recs).toEqual(['Manual review recommended', 'Request additional verification']);
  });

  test('recommends blocking actions when decision is block', () => {
    const recs = generateFraudRecommendations('block', []);
    expect(recs).toEqual(['Transaction blocked', 'Report to security team']);
  });

  test('recommends nothing when the transaction is simply approved', () => {
    const recs = generateFraudRecommendations('approve', []);
    expect(recs).toEqual([]);
  });
});
