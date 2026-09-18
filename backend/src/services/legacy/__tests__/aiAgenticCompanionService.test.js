'use strict';

// Several methods here used to return fixed, input-ignoring values dressed
// up as real analysis: getPestsBySymptoms() always returned the same two
// pests with fake confidence scores regardless of symptoms/crop, and
// predictDroughtRisk() always claimed "low risk" regardless of the actual
// weather forecast or soil moisture passed in - a false reassurance. Both
// are now honest about not being implemented. getCropSelectionAdvice(),
// predictYield() and forecastRevenue() used to attach a hardcoded
// "confidence" literal to every response; those are now removed rather
// than left as unmeasured precision. These tests lock in that honesty.

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../database/connection', () => ({
  getPostgreSQL: jest.fn(),
}));

const service = require('../aiAgenticCompanionService');

describe('aiAgenticCompanionService.getPestsBySymptoms', () => {
  test('honestly returns no matches instead of a fabricated pest list', async () => {
    const result = await service.getPestsBySymptoms(['yellow leaves'], 'wheat');
    expect(result).toEqual([]);
  });
});

describe('aiAgenticCompanionService.identifyPest', () => {
  test('reports no potential pests when nothing was matched', async () => {
    const result = await service.identifyPest({ symptoms: ['wilting'] }, { crop_type: 'rice' });
    expect(result.potential_pests).toEqual([]);
  });
});

describe('aiAgenticCompanionService.predictDroughtRisk', () => {
  test('honestly reports not evaluated instead of a fabricated low-risk claim', async () => {
    const result = await service.predictDroughtRisk([{ rainfall: 0 }], 5);
    expect(result.risk_level).toBe('unknown');
    expect(result.probability).toBeNull();
    expect(result.configured).toBe(false);
  });
});

describe('aiAgenticCompanionService.getCropSelectionAdvice', () => {
  test('no longer attaches a fixed confidence to the market-demand recommendation', async () => {
    const result = await service.getCropSelectionAdvice({ soil_type: 'unknown_soil' }, {});
    const marketRec = result.recommendations.find(r => r.category === 'market_demand');
    expect(marketRec).toBeDefined();
    expect(marketRec.confidence).toBeUndefined();
  });
});

describe('aiAgenticCompanionService.predictYield', () => {
  test('no longer attaches a fixed confidence to the yield prediction', async () => {
    const result = await service.predictYield('wheat', { soil_quality: 0.7 }, { rainfall: 0.6 });
    expect(result.predicted_yield).toBeGreaterThan(0);
    expect(result.confidence).toBeUndefined();
  });
});

describe('aiAgenticCompanionService.forecastRevenue', () => {
  test('no longer attaches a fixed confidence to the revenue forecast', async () => {
    const result = await service.forecastRevenue(
      { crop_type: 'wheat', expected_yield: 1000 },
      { current_price: 20, price_trend: 'stable' },
    );
    expect(result.forecasted_revenue).toBeGreaterThan(0);
    expect(result.confidence).toBeUndefined();
  });
});
