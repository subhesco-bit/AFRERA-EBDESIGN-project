const { calculateNutrientTotals } = require('../services/legacy/nutritionIntelligenceService');

describe('nutrient calculator', () => {
  it('calculates totals, serving values, daily values, and provenance', () => {
    const result = calculateNutrientTotals([
      { quantity: 2, nutrients: { PRO: 10, FIB: 4 } },
      { quantity: 1, nutrients: { PRO: 5, FIB: 2 } }
    ], 3);

    expect(result.per_serving).toEqual({ PRO: 8.33, FIB: 3.33 });
    expect(result.daily_value_percent.PRO).toBe(16.7);
    expect(result.provenance).toContain('caller-supplied');
    expect(result.disclaimer).toBeTruthy();
  });

  it('rejects invalid nutrient input', () => {
    expect(() => calculateNutrientTotals([{ nutrients: { PRO: -1 } }])).toThrow('non-negative');
    expect(() => calculateNutrientTotals([])).toThrow('non-empty');
  });
});