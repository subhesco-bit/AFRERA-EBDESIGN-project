'use strict';

// generateRecommendationExplanation() used to unconditionally claim
// recommendations were "based on your purchase history, similar users,
// and current market conditions" even when the three source functions
// (all honestly unimplemented, returning []) never contributed anything -
// i.e. every real call before this fix got a misleading explanation for
// an empty list. It's now honest about the empty case.

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const {
  getCollaborativeRecommendations,
  getContentBasedRecommendations,
  getContextualRecommendations,
  combineRecommendations,
  generateRecommendationExplanation,
} = require('../recommendationEngine');

describe('recommendationEngine source functions', () => {
  test('collaborative filtering is honestly unimplemented', async () => {
    await expect(getCollaborativeRecommendations('user-1', [])).resolves.toEqual([]);
  });

  test('content-based filtering is honestly unimplemented', async () => {
    await expect(getContentBasedRecommendations([])).resolves.toEqual([]);
  });

  test('contextual recommendations are honestly unimplemented', async () => {
    await expect(getContextualRecommendations({})).resolves.toEqual([]);
  });
});

describe('recommendationEngine.combineRecommendations', () => {
  test('merges all three sources', () => {
    expect(combineRecommendations(['a'], ['b'], ['c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('recommendationEngine.generateRecommendationExplanation', () => {
  test('is honest when there are no recommendations (the only real case today)', () => {
    const explanation = generateRecommendationExplanation([]);
    expect(explanation).toMatch(/not implemented/i);
    expect(explanation).not.toMatch(/based on your purchase history/i);
  });

  test('gives the real explanation once recommendations actually exist', () => {
    const explanation = generateRecommendationExplanation([{ productId: 'p1' }]);
    expect(explanation).toMatch(/based on your purchase history/i);
  });
});
