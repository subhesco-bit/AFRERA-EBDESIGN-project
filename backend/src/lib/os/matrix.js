'use strict';
/** 16-link concept-to-runtime matrix. The missing single source of truth.
 * Ported from pine-shadow src/lib/os/matrix.ts */

const { OS_ITEMS } = require('./catalog');

const MATRIX_LINKS = ['concept', 'module', 'feature', 'user', 'workflow', 'rules', 'database', 'service', 'api', 'authorization', 'ai', 'erp', 'page', 'component', 'test', 'telemetry'];

const PAGE_COMPONENT = {
  '/': 'BooksHome', '/lots': 'LotsBoard', '/warehouse': 'WarehouseBoard', '/trade': 'TradeBoard',
  '/ledger': 'LedgerBoard', '/cells': 'CellsBoard', '/platform': 'AtlasBoard + PlatformBoard', '/pulse': 'PulseWalk',
  '/modules': 'ModulesPanel', '/charter': 'CharterBoard', '/companion': 'CompanionPanel', '/nerve': 'NervePanel',
  '/library': 'LibraryPanel', '/os': 'OsBoard', '/economy': 'EconomyPanel', '/organism': 'OrganismMap',
  '/brain': 'AiAtlas + BrainBoard', '/body': 'BodyBoard', '/flows': 'FlowBoard', '/systems': 'SystemsPanel',
  '/mesh': 'MeshPanel', '/ligaments': 'LigamentCatalog', '/vet': 'VetBoard', '/share': 'ShareBoard',
};

const PAGE_WORKFLOW = {
  '/lots': 'harvest-mint', '/warehouse': 'warehouse-intake', '/trade': 'offtake-settle', '/nerve': 'nerve-consult',
  '/modules': 'platform-bus', '/companion': 'harvest-mint', '/pulse': 'harvest-mint', '/platform': 'platform-bus',
  '/charter': 'platform-bus', '/os': 'os.classify', '/vet': 'code-herd', '/share': 'book-muscle',
};

function bound(x) {
  return x.kernel === 'verified' || x.kernel === 'partial';
}

function userFor(x) {
  if (x.organs.includes('farmer') || x.organs.includes('household')) return 'cell / clerk';
  if (x.organs.includes('fpo')) return 'FPO clerk';
  return 'operator';
}

function chainFor(id) {
  const x = OS_ITEMS.find((r) => r.id === id);
  if (!x) return null;
  const live = bound(x);
  return {
    concept: x.name, module: x.organs.join(' · '), feature: x.present, user: userFor(x),
    workflow: PAGE_WORKFLOW[x.href] ?? (live ? 'named' : 'unbound'), rules: x.next,
    database: live ? 'erp_* remaining_grams / journal' : 'unbound', service: live ? 'kernel server fn' : 'unbound',
    api: live ? 'createServerFn clerk write' : 'none', authorization: 'Clerk. Auth off for visitors. GitHub JWT disconnected.',
    ai: x.level >= 5 || x.organs.includes('ai') ? 'library / companion / firewall' : 'none',
    erp: x.area === 'erp' || x.organs.includes('erp') || x.organs.includes('rupee') ? 'village journal' : 'n/a',
    page: x.href, component: PAGE_COMPONENT[x.href] ?? 'OsBoard', test: x.todo === 'done' ? 'kernel tests' : 'named',
    telemetry: 'lotId on the bus',
  };
}

module.exports = { MATRIX_LINKS, chainFor };
