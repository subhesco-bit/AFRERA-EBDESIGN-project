'use strict';

// cropRecommendationService used to return hardcoded canned data (fixed
// Rice/Wheat/Corn list, static guidance strings, a random market price)
// while presenting itself as AI-driven crop advisory. It now routes through
// claudeAICoordinator (agent 'farmer-advisor') and falls back to labeled
// static data only when the AI call fails. These tests assert both paths.

jest.mock('../../core/claudeAICoordinator', () => ({
  coordinateAIRequest: jest.fn(),
}));
jest.mock('../../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(),
}));

const claudeAICoordinator = require('../../core/claudeAICoordinator');
const cropRecommendationService = require('../cropRecommendationService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('cropRecommendationService.recommendCrops', () => {
  test('calls the real AI coordinator with the farmer-advisor agent and returns its response', async () => {
    claudeAICoordinator.coordinateAIRequest.mockResolvedValue({
      response: 'Rice (0.9 confidence, 25% ROI)', agent: 'farmer-advisor',
    });

    const result = await cropRecommendationService.recommendCrops('farmer-1', 'Assam', 'kharif');

    expect(claudeAICoordinator.coordinateAIRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: 'conversational',
        agentPreference: 'farmer-advisor',
        userId: 'farmer-1',
        context: { location: 'Assam', season: 'kharif' },
      })
    );
    expect(result).toEqual(expect.objectContaining({
      farmer_id: 'farmer-1', season: 'kharif', location: 'Assam',
      recommendations: 'Rice (0.9 confidence, 25% ROI)',
      source: 'ai',
    }));
  });

  test('falls back to labeled static data when the AI coordinator throws', async () => {
    claudeAICoordinator.coordinateAIRequest.mockRejectedValue(new Error('ANTHROPIC_API_KEY not configured'));

    const result = await cropRecommendationService.recommendCrops('farmer-2', 'Meghalaya', 'rabi');

    expect(result.source).toBe('fallback');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

describe('cropRecommendationService.getCropGuidance', () => {
  test('returns AI-generated guidance on success', async () => {
    claudeAICoordinator.coordinateAIRequest.mockResolvedValue({
      response: 'Prepare raised beds and test soil pH before sowing paddy.', agent: 'farmer-advisor',
    });

    const result = await cropRecommendationService.getCropGuidance('rice', 'preparation');

    expect(result.source).toBe('ai');
    expect(result.guidance).toContain('paddy');
  });

  test('falls back to static guidance when AI call fails', async () => {
    claudeAICoordinator.coordinateAIRequest.mockRejectedValue(new Error('timeout'));

    const result = await cropRecommendationService.getCropGuidance('rice', 'planting');

    expect(result.source).toBe('fallback');
    expect(result.guidance).toBe('Sow seeds at recommended depth');
  });
});

describe('cropRecommendationService.getMarketOutlook', () => {
  test('returns AI-generated outlook on success', async () => {
    claudeAICoordinator.coordinateAIRequest.mockResolvedValue({
      response: 'Demand for wheat is rising ahead of the festival season.', agent: 'farmer-advisor',
    });

    const result = await cropRecommendationService.getMarketOutlook('wheat');

    expect(result.source).toBe('ai');
    expect(result.outlook).toContain('wheat'.length ? 'Demand' : '');
  });

  test('falls back without fabricating a price when AI call fails', async () => {
    claudeAICoordinator.coordinateAIRequest.mockRejectedValue(new Error('no key'));

    const result = await cropRecommendationService.getMarketOutlook('wheat');

    expect(result.source).toBe('fallback');
    expect(result).not.toHaveProperty('expected_price');
  });
});

describe('cropRecommendationService.calculateROI', () => {
  test('computes ROI deterministically from real inputs (no AI call)', async () => {
    const result = await cropRecommendationService.calculateROI('rice', {
      expected_yield: 100, expected_price: 20, input_cost: 1000,
    });

    expect(claudeAICoordinator.coordinateAIRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ crop: 'rice', roi: 100, profitability: 'high' });
  });
});
