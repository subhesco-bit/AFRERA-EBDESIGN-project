'use strict';

const {
  validateContract,
  listContracts,
  getModuleCapabilityIndex,
} = require('./systemIntegrationRegistry');

describe('system integration registry', () => {
  test('lists the canonical business workflows', () => {
    const ids = listContracts().map(contract => contract.id);
    expect(ids).toEqual(expect.arrayContaining([
      'rural_supply_to_metro_order',
      'corporate_procure_to_pay',
      'metro_order_to_cash',
      'rural_contract_work',
      'biological_product_to_consumer',
    ]));
  });

  test('detects an incomplete cross-domain workflow', () => {
    const result = validateContract('rural_contract_work', ['worker_profile', 'work_order']);
    expect(result.valid).toBe(false);
    expect(result.missingCapabilities).toEqual(expect.arrayContaining(['material_issue', 'payment', 'material_insurance']));
  });

  test('accepts a complete rural contract-work capability set', () => {
    const result = validateContract('rural_contract_work', [
      'worker_profile', 'work_order', 'material_issue', 'production_output',
      'acceptance', 'payment', 'material_insurance',
    ]);
    expect(result.valid).toBe(true);
    expect(result.missingCapabilities).toHaveLength(0);
  });

  test('exposes shared capability ownership for integration tooling', () => {
    const index = getModuleCapabilityIndex();
    expect(index.payment).toEqual(expect.arrayContaining(['finance']));
    expect(index.quality).toEqual(expect.arrayContaining(['quality']));
    expect(index.nutrient_data).toEqual(expect.arrayContaining(['nutrition']));
  });
});
