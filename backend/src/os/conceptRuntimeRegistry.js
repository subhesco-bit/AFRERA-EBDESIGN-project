/**
 * Concept → Runtime registry — single source of truth seed
 * Classify; never delete. Multiplatform sectors under one OS domain.
 */

'use strict';

/** @typedef {'verified'|'partial'|'scaffolded'|'documented_only'|'disconnected'|'duplicated'|'overlapping'|'conflicting'|'blocked'|'proposed'} Status */

const CONCEPTS = [
  {
    id: 'os.kernel',
    name: 'Multiplatform OS kernel (single domain)',
    layer: 'platform',
    status: 'partial',
    modules: ['M001_PLATFORM_CORE'],
    apis: ['/api/v1/os/health', '/api/v1/os/platforms', '/api/v1/os/registry'],
    services: ['os/osKernel.js'],
    notes: 'Sector platforms mount under one domain as agro-economic OS',
  },
  {
    id: 'os.registry',
    name: 'Concept-to-runtime registry',
    layer: 'platform',
    status: 'partial',
    apis: ['/api/v1/os/registry'],
    services: ['os/conceptRuntimeRegistry.js'],
    notes: 'Hand-seeded + expandable via code scan',
  },
  {
    id: 'identity.auth',
    name: 'Authentication (one coherent system)',
    layer: 'platform',
    status: 'partial',
    modules: ['M002_USER_MANAGEMENT'],
    services: ['dual-use/authService', 'middleware/auth.js'],
    notes: 'Baseline TODO marks mock auth replaced; verify all mounts',
  },
  {
    id: 'layer.ecommerce',
    name: 'Ecommerce / marketplace platform',
    layer: 'ecommerce',
    status: 'partial',
    modules: ['M826100_ECOMMERCE', 'M419100_ORDER', 'M251100_ECOMMERCEERP'],
    apis: ['/api/v1/ecommerce-checkout', '/api/v1/ecommerce'],
    services: ['ecommerce/checkoutOrchestrator', 'layers/ecommerceLayerService'],
    notes: 'Checkout + RMA deep-fill; not farmer layer',
  },
  {
    id: 'layer.farmer',
    name: 'Farmer / agro production platform',
    layer: 'farmer',
    status: 'partial',
    modules: ['M722100_FARMER', 'M100_CROP_MANAGEMENT', 'M101_LIVESTOCK_MANAGEMENT'],
    apis: ['/api/v1/farmer'],
    services: ['layers/farmerLayerService'],
    notes: 'Distinct from ecommerce; seasonal lifecycle FSM still open',
  },
  {
    id: 'bridge.farm_commerce',
    name: 'Farm ↔ commerce explicit bridges',
    layer: 'bridge',
    status: 'partial',
    apis: ['/api/v1/bridge/farm-commerce'],
    services: ['layers/farmCommerceBridge'],
    notes: 'Dual ids only; no id collapse',
  },
  {
    id: 'insurance.corporate',
    name: 'Corporate insurance support (not retail sales)',
    layer: 'insurance',
    status: 'partial',
    modules: ['M359100_INSURANCE', 'M640100_INSURANCEPOLICYISSUANCE'],
    apis: ['/api/v1/insurance-corporate'],
    services: ['insurance/corporateInsurancePlatform'],
    notes: 'Employees, assets, transit, credit, farmer-linked risk objects',
  },
  {
    id: 'subsidy.eligibility',
    name: 'Government scheme computable eligibility',
    layer: 'farmer',
    status: 'partial',
    modules: ['M386100_SUBSIDY', 'M652100_GOVERNMENTSCHEME'],
    apis: ['/api/v1/research-grade/subsidy/extract', '/api/v1/farmer'],
    services: ['research-grade/subsidyEligibilityEngine'],
    notes: 'Rules engine done; application FSM + grievance open',
  },
  {
    id: 'logistics.decision',
    name: 'Logistics mode decision',
    layer: 'logistics',
    status: 'partial',
    modules: ['M615100_LOGISTICS', 'M100100_LOGISTICSENHANCEMENT'],
    apis: ['/api/v1/research-grade/logistics/decide'],
    services: ['research-grade/logisticsDecisionEngine'],
    notes: 'Control tower / POD still open',
  },
  {
    id: 'cold_storage.ops',
    name: 'Cold storage operations',
    layer: 'logistics',
    status: 'partial',
    modules: ['M379100_COLDSTORAGE'],
    apis: ['/api/v1/enterprise-10x/cold_storage'],
    notes: 'Bay allocate; temp exception workflow open',
  },
  {
    id: 'erp.spine',
    name: 'ERP double-entry spine',
    layer: 'erp',
    status: 'partial',
    modules: ['M300_ERP_CORE', 'M513100_COMPREHENSIVEERP'],
    apis: ['/api/v1/research-grade/erp/*'],
    services: ['research-grade/erpDoubleEntrySpine'],
    notes: 'COA + JE + trial balance; full control plane open',
  },
  {
    id: 'engineering.advisory',
    name: 'Engineering calculation chain',
    layer: 'engineering',
    status: 'partial',
    apis: ['/api/v1/engineering-design', '/api/v1/research-grade/mep/package'],
    services: ['engineering/*', 'research-grade/mepEngineeringEngine'],
    notes: 'Structural/solar/MEP advisory; CFD/BIM not implemented (declared)',
  },
  {
    id: 'ai.backbone',
    name: 'AI backbone + evidence gateway',
    layer: 'ai',
    status: 'partial',
    modules: ['M400_AI_BACKBONE', 'M401_AI_GATEWAY'],
    apis: ['/api/v1/research-grade/ai/:capability'],
    services: ['research-grade/aiBackboneEvidenceGateway'],
    notes: 'Evidence records; full model registry / drift open',
  },
  {
    id: 'ai.vet_nutrition_disease',
    name: 'Health decision-support (vet, nutrition, disease)',
    layer: 'health',
    status: 'partial',
    modules: ['M777_VETERINARY_AI', 'M779_NUTRITION_AI', 'M782_DISEASE_ANALYZER_AI'],
    notes: '10x elevation + clinical protocols + panel; live CV external',
  },
  {
    id: 'fulfillment.o2c',
    name: 'Fulfillment / O2C saga',
    layer: 'ecommerce',
    status: 'partial',
    services: ['fulfillmentOrchestrationService', 'ecommerce/checkoutOrchestrator'],
    notes: 'Prior live Postgres path + new checkout orchestrator',
  },
  {
    id: 'personalization.adaptive',
    name: 'Governed adaptive experience engine',
    layer: 'platform',
    status: 'proposed',
    notes: 'Consent ledger, intent, page composer — not built',
  },
  {
    id: 'rural.offline',
    name: 'Rural offline / assisted access',
    layer: 'platform',
    status: 'scaffolded',
    modules: ['M25100_OFFLINESYNC'],
    notes: 'Concepts exist; verified offline queue open',
  },
  {
    id: 'trust.graph',
    name: 'Trust and reputation graph',
    layer: 'platform',
    status: 'proposed',
    notes: 'Transaction + dispute adjusted trust',
  },
  {
    id: 'grievance.spine',
    name: 'Cross-domain grievance spine',
    layer: 'platform',
    status: 'proposed',
    notes: 'Complaint → evidence → decision → appeal',
  },
  {
    id: 'superorganism.mapping',
    name: 'Digital super-organism executable mapping',
    layer: 'platform',
    status: 'documented_only',
    notes: 'Brain/nervous/memory metaphors need event contracts + owners',
  },
];

function summary() {
  const by = {};
  for (const c of CONCEPTS) {
    by[c.status] = (by[c.status] || 0) + 1;
  }
  return {
    total: CONCEPTS.length,
    by_status: by,
    rule: 'Nothing removed — classify and complete',
    os_model: 'multiplatform_sectors_under_single_domain_agro_economic_os',
  };
}

function list(filter = {}) {
  let rows = CONCEPTS;
  if (filter.status) rows = rows.filter((c) => c.status === filter.status);
  if (filter.layer) rows = rows.filter((c) => c.layer === filter.layer);
  return { concepts: rows, summary: summary() };
}

function get(id) {
  return CONCEPTS.find((c) => c.id === id) || null;
}

module.exports = {
  CONCEPTS,
  summary,
  list,
  get,
};
