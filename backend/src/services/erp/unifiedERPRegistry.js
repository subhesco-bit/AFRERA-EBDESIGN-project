/**
 * Unified ERP capability registry.
 *
 * This is the canonical domain/capability map for the platform. It deliberately
 * models rural participants as economic actors (not only employees) and keeps
 * corporate and rural operating models distinct while sharing the ERP backbone.
 */

const ERP_DOMAINS = Object.freeze({
  finance: {
    name: 'Finance & Accounting',
    capabilities: ['general_ledger', 'accounts_payable', 'accounts_receivable', 'tax', 'budgeting', 'costing', 'treasury', 'settlement', 'bank_reconciliation', 'period_close'],
  },
  supply_chain: {
    name: 'Supply Chain Management',
    capabilities: ['procurement', 'supplier_management', 'demand_planning', 'inventory', 'warehouse', 'material_planning', 'traceability'],
  },
  sales: {
    name: 'Sales Management',
    capabilities: ['quotations', 'orders', 'contracts', 'pricing', 'invoicing', 'returns', 'channel_management'],
  },
  marketing: {
    name: 'Marketing',
    capabilities: ['campaigns', 'segmentation', 'product_catalogue', 'promotion', 'market_intelligence', 'customer_engagement'],
  },
  logistics: {
    name: 'Logistics & Transportation',
    capabilities: ['transport_planning', 'fleet', 'routing', 'dispatch', 'tracking', 'cold_chain', 'delivery', 'proof_of_delivery'],
  },
  crm: {
    name: 'CRM & Service',
    capabilities: ['customer_360', 'lead_management', 'service_cases', 'complaints', 'sla', 'communications'],
  },
  erm: {
    name: 'Enterprise / Economic Resource Management',
    capabilities: ['people', 'households', 'farms', 'animals', 'poultry', 'fishery', 'equipment', 'capacity', 'infrastructure', 'partners'],
  },
  workforce: {
    name: 'Workforce & Contract Labour',
    capabilities: ['employees', 'contractors', 'rural_freelancers', 'work_orders', 'skills', 'attendance', 'rate_cards', 'worker_settlement', 'worker_insurance'],
  },
  insurance: {
    name: 'Insurance & Risk',
    capabilities: ['policy_management', 'coverage', 'claims', 'material_risk', 'payment_risk', 'crop_risk', 'livestock_risk', 'shipment_risk', 'asset_risk'],
  },
  retail: {
    name: 'Retail ERP',
    capabilities: ['stores', 'pos', 'assortment', 'pricing', 'promotions', 'stock', 'omnichannel', 'returns'],
  },
  ecommerce: {
    name: 'E-commerce ERP',
    capabilities: ['catalogue', 'seller_onboarding', 'cart', 'orders', 'payments', 'settlements', 'returns', 'reviews', 'marketplace_operations'],
  },
  production: {
    name: 'Production & Processing',
    capabilities: ['production_planning', 'work_orders', 'recipes', 'batching', 'yield', 'processing', 'packaging', 'pre_cooling', 'quality_release'],
  },
  quality: {
    name: 'Quality & Laboratory',
    capabilities: ['inspection', 'sampling', 'laboratory', 'certification', 'food_quality', 'biological_quality', 'traceability', 'non_conformance'],
  },
  asset: {
    name: 'Asset & Shared Infrastructure',
    capabilities: ['asset_register', 'maintenance', 'utilisation', 'depreciation', 'shared_infrastructure', 'capacity_booking'],
  },
  projects: {
    name: 'Project & Development Management',
    capabilities: ['projects', 'milestones', 'budgets', 'wbs', 'community_projects', 'grant_tracking'],
  },
  governance: {
    name: 'Governance, Risk & Compliance',
    capabilities: ['roles', 'approvals', 'policies', 'audit', 'compliance', 'delegation', 'exceptions', 'segregation_of_duties'],
  },
  data_ai: {
    name: 'Data, Analytics & AI',
    capabilities: ['master_data', 'analytics', 'forecasting', 'recommendations', 'generative_ai', 'agentic_ai', 'autonomous_agents', 'ai_governance'],
  },
});

const ACTOR_TYPES = Object.freeze({
  corporate: ['legal_entity', 'business_unit', 'employee', 'contractor', 'supplier', 'customer', 'retailer', 'bank', 'insurer', 'government_buyer'],
  rural: ['person', 'household', 'farmer', 'producer', 'farm', 'animal_owner', 'poultry_keeper', 'fisher', 'contract_labour', 'rural_freelancer', 'service_provider', 'fpo', 'cooperative', 'village', 'panchayat', 'rural_enterprise'],
  shared: ['buyer', 'seller', 'logistics_provider', 'laboratory', 'processor', 'warehouse', 'cold_storage', 'payment_provider', 'insurer', 'administrator'],
});

const CROSS_ECONOMY_WORKFLOWS = Object.freeze({
  rural_to_metro_product: [
    'producer_onboarding', 'product_capture', 'ai_product_media', 'quality_check',
    'lab_or_certification', 'processing', 'packaging', 'pre_cooling', 'cold_storage',
    'inventory', 'demand_match', 'pricing', 'logistics', 'order', 'payment', 'settlement', 'accounting',
  ],
  rural_contract_work: [
    'work_request', 'skill_match', 'material_issuance', 'work_order', 'production',
    'quality_check', 'quantity_acceptance', 'worker_payment', 'material_reconciliation', 'insurance_event_if_required',
  ],
  corporate_procure_to_pay: [
    'requisition', 'approval', 'purchase_order', 'goods_receipt', 'quality', 'invoice', 'three_way_match', 'payment', 'bank_reconciliation', 'general_ledger',
  ],
  metro_order_to_cash: [
    'demand', 'catalogue', 'pricing', 'cart', 'order', 'inventory_allocation', 'fulfilment', 'delivery', 'invoice', 'payment', 'settlement', 'customer_service',
  ],
});

function listDomains() {
  return Object.entries(ERP_DOMAINS).map(([id, domain]) => ({ id, ...domain }));
}

function getDomain(id) {
  return ERP_DOMAINS[id] ? { id, ...ERP_DOMAINS[id] } : null;
}

function getActorTypes(economy) {
  return ACTOR_TYPES[economy] ? [...ACTOR_TYPES[economy]] : [];
}

function getWorkflow(id) {
  return CROSS_ECONOMY_WORKFLOWS[id] ? { id, steps: [...CROSS_ECONOMY_WORKFLOWS[id]] } : null;
}

function getCapabilityMatrix() {
  return {
    corporate: listDomains().map(({ id, name, capabilities }) => ({ id, name, capabilities, enabled: true })),
    rural: listDomains().map(({ id, name, capabilities }) => ({ id, name, capabilities, enabled: true })),
    shared: listDomains().filter(({ id }) => ['finance', 'supply_chain', 'logistics', 'crm', 'insurance', 'quality', 'governance', 'data_ai'].includes(id)),
  };
}

module.exports = {
  ERP_DOMAINS,
  ACTOR_TYPES,
  CROSS_ECONOMY_WORKFLOWS,
  listDomains,
  getDomain,
  getActorTypes,
  getWorkflow,
  getCapabilityMatrix,
};
