'use strict';

/**
 * Canonical cross-domain capability contracts.
 *
 * This registry does not replace existing modules. It defines the minimum
 * runtime capabilities that must be available for a business flow to be
 * considered integrated and gives AI/ERP orchestration one stable vocabulary.
 */

const CONTRACTS = Object.freeze({
  rural_supply_to_metro_order: {
    id: 'rural_supply_to_metro_order',
    domains: ['rural_economy', 'quality', 'inventory', 'logistics', 'metro_commerce'],
    capabilities: ['production', 'quality', 'inventory', 'catalogue', 'order', 'fulfilment'],
    sensitive: false,
  },
  corporate_procure_to_pay: {
    id: 'corporate_procure_to_pay',
    domains: ['procurement', 'supplier', 'inventory', 'finance'],
    capabilities: ['purchase_order', 'goods_receipt', 'invoice', 'payment', 'ledger'],
    sensitive: true,
  },
  metro_order_to_cash: {
    id: 'metro_order_to_cash',
    domains: ['metro_commerce', 'logistics', 'finance', 'crm'],
    capabilities: ['order', 'payment', 'shipment', 'delivery', 'settlement', 'ledger'],
    sensitive: true,
  },
  rural_contract_work: {
    id: 'rural_contract_work',
    domains: ['rural_economy', 'workforce', 'payments', 'insurance'],
    capabilities: ['worker_profile', 'job', 'assignment', 'material_tracking', 'acceptance', 'payment', 'coverage'],
    sensitive: true,
  },
  biological_product_to_consumer: {
    id: 'biological_product_to_consumer',
    domains: ['quality', 'laboratory', 'nutrition', 'metro_commerce'],
    capabilities: ['provenance', 'lab_result', 'nutrient_profile', 'product_listing', 'consumer_disclosure'],
    sensitive: true,
  },
});

function getContract(id) {
  return CONTRACTS[id] || null;
}

function validateCapabilities(id, available = []) {
  const contract = getContract(id);
  if (!contract) throw new Error(`Unknown integration contract: ${id}`);
  const provided = new Set(available.map(String));
  const missing = contract.capabilities.filter(capability => !provided.has(capability));
  return {
    contractId: id,
    complete: missing.length === 0,
    missing,
    required: [...contract.capabilities],
    sensitive: contract.sensitive,
  };
}

function listContracts() {
  return Object.values(CONTRACTS).map(contract => ({
    ...contract,
    capabilities: [...contract.capabilities],
    domains: [...contract.domains],
  }));
}

module.exports = { CONTRACTS, getContract, validateCapabilities, listContracts };
