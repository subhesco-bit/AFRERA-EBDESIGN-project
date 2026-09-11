/**
 * EBDESIGN System Integration Registry
 *
 * Canonical runtime contracts for cross-domain workflows. This registry does
 * not replace existing domain services; it makes their integration explicit
 * and machine-checkable.
 */
'use strict';

const CONTRACTS = Object.freeze({
  rural_supply_to_metro_order: {
    name: 'Rural supply to metro order',
    domains: ['rural_economy', 'quality', 'processing', 'packaging', 'cold_chain', 'logistics', 'ecommerce', 'finance'],
    requiredCapabilities: [
      'production', 'aggregation', 'quality', 'processing', 'packaging',
      'pre_cooling', 'cold_storage', 'inventory', 'order', 'logistics',
      'payment', 'settlement', 'accounting'
    ],
  },
  corporate_procure_to_pay: {
    name: 'Corporate procure to pay',
    domains: ['procurement', 'inventory', 'finance', 'accounting'],
    requiredCapabilities: ['supplier', 'purchase_order', 'goods_receipt', 'invoice', 'payment', 'reconciliation', 'ledger'],
  },
  metro_order_to_cash: {
    name: 'Metro order to cash',
    domains: ['ecommerce', 'sales', 'crm', 'logistics', 'finance', 'accounting'],
    requiredCapabilities: ['catalog', 'pricing', 'order', 'fulfilment', 'shipment', 'payment', 'ar', 'settlement'],
  },
  rural_contract_work: {
    name: 'Rural contract work',
    domains: ['rural_economy', 'workforce', 'procurement', 'finance', 'insurance'],
    requiredCapabilities: ['worker_profile', 'work_order', 'material_issue', 'production_output', 'acceptance', 'payment', 'material_insurance'],
  },
  biological_product_to_consumer: {
    name: 'Biological product to consumer',
    domains: ['product', 'quality', 'laboratory', 'nutrition', 'ecommerce', 'finance'],
    requiredCapabilities: ['provenance', 'quality', 'lab_result', 'product_attributes', 'nutrient_data', 'listing', 'order', 'payment'],
    sensitive: true,
  },
});

const MODULE_CAPABILITIES = Object.freeze({
  rural_economy: ['production', 'aggregation', 'worker_profile', 'work_order'],
  quality: ['quality', 'inspection', 'traceability'],
  processing: ['processing', 'production_output'],
  packaging: ['packaging'],
  cold_chain: ['pre_cooling', 'cold_storage'],
  logistics: ['logistics', 'shipment', 'fulfilment'],
  ecommerce: ['catalog', 'listing', 'order', 'pricing'],
  sales: ['order'],
  crm: ['customer'],
  finance: ['payment', 'settlement', 'ar', 'invoice'],
  accounting: ['accounting', 'ledger', 'reconciliation'],
  procurement: ['supplier', 'purchase_order', 'goods_receipt'],
  workforce: ['worker_profile', 'work_order'],
  insurance: ['material_insurance'],
  product: ['product_attributes', 'provenance'],
  laboratory: ['lab_result'],
  nutrition: ['nutrient_data'],
  inventory: ['inventory'],
});

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function capabilityIndex(modules = MODULE_CAPABILITIES) {
  const index = new Map();
  for (const [moduleName, capabilities] of Object.entries(modules)) {
    for (const capability of capabilities) {
      const key = normalize(capability);
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(moduleName);
    }
  }
  return index;
}

function validateContract(contractId, availableCapabilities = []) {
  const contract = CONTRACTS[contractId];
  if (!contract) {
    const error = new Error(`Unknown integration contract: ${contractId}`);
    error.code = 'UNKNOWN_INTEGRATION_CONTRACT';
    throw error;
  }
  const available = new Set(availableCapabilities.map(normalize));
  const missingCapabilities = contract.requiredCapabilities.filter(c => !available.has(normalize(c)));
  return {
    contractId,
    name: contract.name,
    valid: missingCapabilities.length === 0,
    sensitive: Boolean(contract.sensitive),
    requiredCapabilities: [...contract.requiredCapabilities],
    missingCapabilities,
  };
}

function getContract(contractId) {
  return CONTRACTS[contractId] || null;
}

function listContracts() {
  return Object.entries(CONTRACTS).map(([id, contract]) => ({ id, ...contract }));
}

function getModuleCapabilityIndex() {
  return Object.fromEntries([...capabilityIndex()].map(([key, modules]) => [key, [...modules]]));
}

module.exports = {
  CONTRACTS,
  MODULE_CAPABILITIES,
  getContract,
  listContracts,
  validateContract,
  getModuleCapabilityIndex,
};
