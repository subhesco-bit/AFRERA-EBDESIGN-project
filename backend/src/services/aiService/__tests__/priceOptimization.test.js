'use strict';

// getCompetitorPrices() used to return the identical hardcoded
// [280, 295, 310, 275, 305] for every product, presented as real
// competitor pricing. It now honestly returns [] (no real market-data API
// is configured). These tests lock in that honesty and confirm
// calculateOptimalPrice() still produces a sensible result when there is
// no competitor signal - the fix depends on that existing fallback
// behavior, not a change to it.

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const {
  calculateOptimalPrice,
  calculatePriceElasticity,
  calculateRevenueImpact,
  calculateMarginImpact,
  getCompetitorPrices,
  generatePricingRecommendations,
} = require('../priceOptimization');

describe('priceOptimization.getCompetitorPrices', () => {
  test('honestly returns no competitor data instead of a fabricated price list', async () => {
    const result = await getCompetitorPrices('product-1');
    expect(result).toEqual([]);
  });
});

describe('priceOptimization.calculateOptimalPrice', () => {
  test('falls back to currentPrice-weighted average when competitor data is empty', () => {
    const market = { avg_market_price: 320 };
    const result = calculateOptimalPrice(300, market, []);

    // marketWeight 0.4 * 320 + competitorWeight 0.3 * currentPrice(300, the
    // documented fallback) + currentWeight 0.3 * 300 = 128 + 90 + 90 = 308
    expect(result).toBe(308);
  });

  test('incorporates real competitor prices when present', () => {
    const market = { avg_market_price: 320 };
    const result = calculateOptimalPrice(300, market, [310, 330]);

    // 0.4*320 + 0.3*320(avg of [310,330]) + 0.3*300 = 128 + 96 + 90 = 314
    expect(result).toBe(314);
  });
});

describe('priceOptimization.calculatePriceElasticity', () => {
  test('is a fixed placeholder pending real historical price/demand data', () => {
    expect(calculatePriceElasticity('product-1')).toBe(-1.2);
  });
});

describe('priceOptimization.calculateRevenueImpact', () => {
  test('computes demand and revenue change from a real price change and elasticity', () => {
    const result = calculateRevenueImpact(300, 330, -1.2);
    // priceChange = 0.1; demandChange = -1.2 * 0.1 * 100 = -12; + 10 = -2
    expect(result).toBeCloseTo(-2, 5);
  });
});

describe('priceOptimization.calculateMarginImpact', () => {
  test('is a fixed placeholder pending real cost/COGS data', () => {
    expect(calculateMarginImpact(300, 330)).toBe('12.00');
  });
});

describe('priceOptimization.generatePricingRecommendations', () => {
  test('flags a price materially above market average', () => {
    const recs = generatePricingRecommendations(360, { avg_market_price: 300 });
    expect(recs).toContain('Price is above market average - monitor competition');
  });

  test('flags a price materially below market average', () => {
    const recs = generatePricingRecommendations(250, { avg_market_price: 300 });
    expect(recs).toContain('Price is below market average - opportunity for margin improvement');
  });

  test('makes no recommendation when price is close to market average', () => {
    const recs = generatePricingRecommendations(305, { avg_market_price: 300 });
    expect(recs).toEqual([]);
  });
});
