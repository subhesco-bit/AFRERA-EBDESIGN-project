const engine = require('./nutritionCommerceIntelligenceService');

describe('nutritionCommerceIntelligenceService', () => {
  test('normalizes pack price to per kg', () => {
    expect(engine.normalizePerKg(240, 500, 'g')).toBe(480);
  });

  test('calculates nutrient-adjusted cost without changing product price', () => {
    const result = engine.calculateProductValue({
      price: 240,
      quantity: 500,
      quantityUnit: 'g',
      nutrients: { protein: { amount: 40, unit: 'g' } },
    });
    expect(result.pricePerKg).toBe(480);
    expect(result.nutrientMetrics.protein.amountPerKg).toBe(80);
    expect(result.nutrientMetrics.protein.costPerNutrientUnit).toBe(6);
  });

  test('aggregates a household basket', () => {
    const result = engine.calculateBasket([
      { product: 'A', price: 100, units: 2, nutrients: { protein: { amount: 10, unit: 'g' } } },
      { product: 'B', price: 50, units: 1, nutrients: { protein: { amount: 5, unit: 'g' } } },
    ]);
    expect(result.totalCost).toBe(250);
    expect(result.nutrients.protein.amount).toBe(25);
    expect(result.costPerNutrientUnit.protein).toBe(10);
  });

  test('calculates transparent non-clinical nutrient coverage', () => {
    const result = engine.calculateNutritionDensity({
      nutrients: { protein: { amount: 20 }, fibre: { amount: 8 } },
      targets: { protein: 40, fibre: 10 },
    });
    expect(result.score).toBe(0.75);
    expect(result.methodology).toBe('target-relative-non-clinical-nutrient-coverage');
  });

  test('normalizes an approved market observation with freshness metadata', () => {
    const result = engine.normalizeMarketOffer({
      source: 'approved-feed',
      sourceType: 'approved_api',
      product: 'Example Food',
      price: 240,
      quantity: 500,
      quantityUnit: 'g',
      capturedAt: new Date().toISOString(),
    });
    expect(result.pricePerKg).toBe(480);
    expect(result.currency).toBe('INR');
    expect(result.freshnessSeconds).toBeGreaterThanOrEqual(0);
  });

  test('scores market observations for freshness and stability', () => {
    const now = new Date().toISOString();
    const result = engine.priceObservationQuality([
      { pricePerKg: 100, capturedAt: now },
      { pricePerKg: 102, capturedAt: now },
      { pricePerKg: 500, capturedAt: now },
    ]);
    expect(result.usable).toBe(true);
    expect(result.excludedOutliers).toBe(1);
    expect(result.confidence).toBeGreaterThan(50);
  });

  test('marks rural/metro benchmark as internal', () => {
    const result = engine.benchmarkInternalValue({
      rural: { landedCostPerKg: 100, nutritionScore: 80 },
      metro: { referencePricePerKg: 150, nutritionScore: 70 },
    });
    expect(result.visibility).toBe('INTERNAL_PRICING_ONLY');
  });
});
