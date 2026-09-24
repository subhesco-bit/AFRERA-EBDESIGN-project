/**
 * AFRERA Multiplatform OS Kernel
 *
 * All sector platforms operate under ONE domain as an India-first
 * agro-economic operating system — not separate product sites.
 *
 * Platforms: farmer | market (ecommerce) | insurance | logistics |
 *            finance | engineering | erp | gov | health | ai
 */

'use strict';

const registry = require('./conceptRuntimeRegistry');

const PLATFORMS = [
  {
    id: 'farmer',
    name: 'Farmer / Agro Production',
    path_prefix: '/farmer',
    api_prefix: '/api/v1/farmer',
    layer: 'farmer',
    description: 'Plots, cycles, subsidy eligibility, advisory — not marketplace checkout',
  },
  {
    id: 'market',
    name: 'Marketplace / Ecommerce',
    path_prefix: '/market',
    api_prefix: '/api/v1/ecommerce-checkout',
    layer: 'ecommerce',
    description: 'Catalog, cart, checkout, RMA — not subsidy or land records',
  },
  {
    id: 'insurance',
    name: 'Corporate Insurance Support',
    path_prefix: '/insurance',
    api_prefix: '/api/v1/insurance-corporate',
    layer: 'insurance',
    description: 'Employees, assets, transit, credit — support desk, not retail underwriter',
  },
  {
    id: 'logistics',
    name: 'Logistics & Cold Chain',
    path_prefix: '/logistics',
    api_prefix: '/api/v1/research-grade/logistics',
    layer: 'logistics',
    description: 'Mode decision, cold storage, transit risk objects',
  },
  {
    id: 'finance',
    name: 'Finance & Rural Credit',
    path_prefix: '/finance',
    api_prefix: '/api/v1/research-grade/erp',
    layer: 'finance',
    description: 'Ledger spine, GST estimates; full underwriting open',
  },
  {
    id: 'engineering',
    name: 'Engineering Advisory',
    path_prefix: '/engineering',
    api_prefix: '/api/v1/engineering-design',
    layer: 'engineering',
    description: 'Structural, solar, MEP — advisory with basis strings',
  },
  {
    id: 'erp',
    name: 'ERP Control Plane',
    path_prefix: '/erp',
    api_prefix: '/api/v1/research-grade/erp',
    layer: 'erp',
    description: 'Double-entry, trial balance; period close open',
  },
  {
    id: 'gov',
    name: 'Government Schemes',
    path_prefix: '/gov',
    api_prefix: '/api/v1/research-grade/subsidy',
    layer: 'farmer',
    description: 'Computable scheme rules; application FSM open',
  },
  {
    id: 'health',
    name: 'Health Decision Support',
    path_prefix: '/health',
    api_prefix: '/api/v1',
    layer: 'health',
    description: 'Vet, nutrition, disease AI with safety floors',
  },
  {
    id: 'ai',
    name: 'AI Backbone',
    path_prefix: '/ai',
    api_prefix: '/api/v1/research-grade/ai',
    layer: 'ai',
    description: 'Evidence gateway to real engines',
  },
];

function health() {
  return {
    os: 'AFRERA',
    model: 'multiplatform_single_domain_agro_economic_os',
    status: 'booting_partial',
    platforms: PLATFORMS.length,
    registry: registry.summary(),
    timestamp: new Date().toISOString(),
    principles: [
      'One domain name; many sector platforms',
      'Ecommerce ≠ Farmer',
      'Insurance = corporate support, not retail sales',
      'Nothing removed — classify and complete',
      'No scaffold-only completion claims',
    ],
  };
}

function listPlatforms() {
  return {
    domain_model: 'single_domain_multi_platform',
    platforms: PLATFORMS,
    shared: ['identity', 'erp_hooks', 'events', 'evidence', 'consent', 'design_system'],
  };
}

function resolvePlatform(idOrPath) {
  const id = String(idOrPath || '').replace(/^\//, '').split('/')[0];
  return PLATFORMS.find((p) => p.id === id || p.path_prefix === `/${id}`) || null;
}

module.exports = {
  PLATFORMS,
  health,
  listPlatforms,
  resolvePlatform,
};
