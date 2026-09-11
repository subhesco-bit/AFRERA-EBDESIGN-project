'use strict';

const {
  CONTRACTS,
  getContract,
  validateCapabilities,
  listContracts,
} = require('./systemIntegrationRegistry');

describe('System integration registry', () => {
  test('defines the core rural, metro and ERP flows', () => {
    expect(CONTRACTS.rural_supply_to_metro_order).toBeDefined();
    expect(CONTRACTS.metro_order_to_cash).toBeDefined();
    expect(CONTRACTS.corporate_procure_to_pay).toBeDefined();
    expect(CONTRACTS.rural_contract_work).toBeDefined();
  });

  test('reports incomplete capabilities instead of falsely passing', () => {
    const result = validateCapabilities('rural_supply_to_metro_order', ['production', 'quality']);
    expect(result.complete).toBe(false);
    expect(result.missing).toContain('inventory');
    expect(result.missing).toContain('fulfilment');
  });

  test('passes a fully supplied contract', () => {
    const contract = getContract('metro_order_to_cash');
    const result = validateCapabilities(contract.id, contract.capabilities);
    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test('exposes a stable contract catalogue for orchestration', () => {
    expect(listContracts().length).toBeGreaterThanOrEqual(5);
    expect(listContracts().every(item => item.id && item.domains && item.capabilities)).toBe(true);
  });
});
