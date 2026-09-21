'use strict';

const service = require('../sharedCapacityService');

describe('shared infrastructure and fulfillment ranking', () => {
  const demand = { quantity: 20, coldChainRequired: true, perishability: 0.9, readyAt: '2026-09-20T08:00:00Z', deliverBy: '2026-09-21T08:00:00Z' };
  test('hard cold-chain and capacity constraints beat lower price', () => {
    const result = service.optimize(demand, [
      { id: 'cheap', availableCapacity: 40, coldChain: false, landedCost: 10, transitHours: 1 },
      { id: 'small', availableCapacity: 10, coldChain: true, landedCost: 5, transitHours: 1 },
      { id: 'feasible', availableCapacity: 30, coldChain: true, landedCost: 100, transitHours: 3, reliability: 0.9, risk: 0.1 },
    ]);
    expect(result.recommendation.optionId).toBe('feasible');
    expect(result.evaluated.find((x) => x.optionId === 'cheap').reason).toBe('cold_chain_required');
    expect(result.evaluated.find((x) => x.optionId === 'small').reason).toBe('insufficient_capacity');
  });

  test('missed delivery window remains infeasible even if price is zero', () => {
    const result = service.optimize(demand, [{ id: 'late', availableCapacity: 30, coldChain: true, landedCost: 0, transitHours: 2, arrivalAt: '2026-09-22T00:00:00Z' }]);
    expect(result.recommendation).toBeNull();
    expect(result.evaluated[0].reason).toBe('misses_delivery_window');
  });

  test('North East supplier to North India buyer requires a served corridor and enough shelf life', () => {
    const corridorDemand = { ...demand, originState: 'Nagaland', destinationState: 'Delhi', remainingShelfLifeHours: 36 };
    const result = service.optimize(corridorDemand, [
      { id: 'wrong-destination', originState: 'Nagaland', destinationState: 'Assam', availableCapacity: 50, coldChain: true, landedCost: 10, transitHours: 8 },
      { id: 'too-slow', originState: 'Nagaland', destinationState: 'Delhi', availableCapacity: 50, coldChain: true, landedCost: 20, transitHours: 48 },
      { id: 'air-cold-chain', originState: 'Nagaland', destinationState: 'Delhi', availableCapacity: 50, coldChain: true, landedCost: 500, transitHours: 18, reliability: 0.95, risk: 0.05 },
    ]);
    expect(result.recommendation.optionId).toBe('air-cold-chain');
    expect(result.evaluated.find((x) => x.optionId === 'wrong-destination').reason).toBe('destination_not_served');
    expect(result.evaluated.find((x) => x.optionId === 'too-slow').reason).toBe('shelf_life_exceeded');
  });
});
