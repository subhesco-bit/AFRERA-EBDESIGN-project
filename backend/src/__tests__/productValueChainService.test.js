'use strict';

const service = require('../services/productValueChainService');

describe('productValueChainService', () => {
  test('builds an auditable end-to-end plan without an AI call', async () => {
    const result = await service.analyzeProduct({ name: 'Organic Assam Tea', location: 'Assam', costPerKg: 300, marketPricePerKg: 420, quantityKg: 100, qualityScore: 85, organic: true, giCertified: true }, { useAI: false, generateImage: false });
    expect(result.product.category).toBe('beverage');
    expect(result.pricing.recommended_price_per_kg).toBeGreaterThan(420);
    expect(result.marketing.source).toBe('deterministic-fallback');
    expect(result.media.status).toBe('not_requested');
    expect(result.workflow).toHaveLength(6);
    expect(result.governance.human_review_required).toContain('insurance binding');
  });

  test('requires a product name', async () => {
    await expect(service.analyzeProduct({}, { useAI: false })).rejects.toThrow('Product name is required');
  });

  test('caps the computed premium and exposes its evidence level', () => {
    const pricing = service.calculatePricing({ costPerKg: 100, marketPricePerKg: 120, qualityScore: 100, organic: true, giCertified: true, traceable: true }, service.findFoodProfile('turmeric'));
    expect(pricing.premium_rate_percent).toBeLessThanOrEqual(35);
    expect(pricing.evidence).toBe('rule-based-estimate');
  });
});
