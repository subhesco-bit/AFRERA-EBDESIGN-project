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

  test('marks rural/metro benchmark as internal', () => {
    const result = engine.benchmarkInternalValue({
      rural: { landedCostPerKg: 100, nutritionScore: 80 },
      metro: { referencePricePerKg: 150, nutritionScore: 70 },
    });
    expect(result.visibility).toBe('INTERNAL_PRICING_ONLY');
  });
});
