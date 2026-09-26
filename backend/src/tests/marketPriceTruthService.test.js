'use strict';

jest.mock('../database/pool', () => ({
  query: jest.fn(),
}));

const pool = require('../database/pool');
const truth = require('../services/commerce/marketPriceTruthService');

describe('Phase 048 market price truth layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('normalizes quintal prices to INR per kg', () => {
    expect(truth.pricePerKg(5000, 'qtl')).toBe(50);
    expect(truth.pricePerKg(180, 'g', 250)).toBe(720);
  });

  test('accepts current official observations for benchmark use', () => {
    const now = new Date('2026-09-26T00:00:00.000Z');
    const obs = truth.buildObservation({
      sourceKey: 'AGMARKNET_OGD',
      productName: 'Ginger',
      price: 6000,
      unit: 'qtl',
      observedAt: '2026-09-25T00:00:00.000Z',
      geography: { country: 'India', state: 'Assam', district: 'Kamrup', market: 'Guwahati' },
      sourceRecordId: 'agmark:1',
    }, { now });

    expect(obs.pricePerKgInr).toBe(60);
    expect(obs.verificationStatus).toBe('OBSERVED_OFFICIAL');
    expect(obs.eligibleForBenchmark).toBe(true);
    expect(obs.confidenceScore).toBeGreaterThanOrEqual(0.6);
  });
  test('keeps prototype and stale evidence out of benchmarks', () => {
    const now = new Date('2026-09-26T00:00:00.000Z');
    const prototype = truth.buildObservation({
      sourceKey: 'AFRERA_PROTOTYPE_RETAIL',
      productName: 'Prototype Tea',
      price: 800,
      unit: 'kg',
      observedAt: now.toISOString(),
    }, { now });
    const stale = truth.buildObservation({
      sourceKey: 'AGMARKNET_OGD',
      productName: 'Ginger',
      price: 5000,
      unit: 'qtl',
      observedAt: '2026-08-01T00:00:00.000Z',
      geography: { country: 'India', state: 'Assam' },
    }, { now });

    expect(prototype.confidenceScore).toBe(0);
    expect(prototype.eligibleForBenchmark).toBe(false);
    expect(stale.stale).toBe(true);
    expect(stale.eligibleForBenchmark).toBe(false);
  });

  test('public market snapshot excludes private farm-gate floors', async () => {
    pool.query.mockResolvedValueOnce({ rows: [
      { id: 1, product_id: 'p1', product_name: 'Ginger', market_level: 'farm_gate_floor',
        source_type: 'afrera_farmer_listing', source_name: 'Private floor', source_authority: 'first_party_listing',
        collection_method: 'partner_share', price_kind: 'floor', currency: 'INR', price_per_kg_inr: 35,
        observed_at: '2026-09-25T00:00:00.000Z', verification_status: 'DECLARED_FIRST_PARTY',
        match_confidence: 1, confidence_score: 0.8, confidence_basis: {}, eligible_for_benchmark: true },
      { id: 2, product_id: 'p1', product_name: 'Ginger', market_level: 'mandi_wholesale',
        source_type: 'agmarknet', source_name: 'Agmarknet', source_authority: 'official_government',
        collection_method: 'public_api', price_kind: 'modal', currency: 'INR', price_per_kg_inr: 60,
        observed_at: '2026-09-25T00:00:00.000Z', verification_status: 'OBSERVED_OFFICIAL',
        match_confidence: 1, confidence_score: 0.9, confidence_basis: {}, eligible_for_benchmark: true },
    ]});

    const snapshot = await truth.marketSnapshot({ productId: 'p1' });
    expect(snapshot.observations).toBe(1);
    expect(snapshot.current.pricePerKgInr).toBe(60);
    expect(snapshot.privateFarmGateFloorExcluded).toBe(true);
  });
});
