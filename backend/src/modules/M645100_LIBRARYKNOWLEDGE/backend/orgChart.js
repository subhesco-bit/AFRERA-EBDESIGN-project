/**
 * Library org chart: Project -> Controllers -> Systems -> Modules -> Files.
 *
 * The index answers "what exists" but not "where does it sit and who owns it",
 * so a file with a name shared by 191 others (module.json) could be found but
 * not told apart. This assigns every indexed entry a position in one org chart
 * and gives it a qualified name derived from that position, so duplicates stay
 * distinguishable and nothing is an orphan.
 *
 * Assignment is evidence-ordered, strongest signal first:
 *   1. the module's own declared `category` field,
 *   2. keywords in its name/description/identifier,
 *   3. the descriptive twin of a bare identifier (M001 -> M001_PLATFORM_CORE),
 * and anything still unmatched lands in UNASSIGNED, which is counted and
 * reported rather than hidden, so gaps stay visible instead of being guessed.
 */

'use strict';

const path = require('path');

const PROJECT = 'AFRERA-EBDESIGN';
const UNASSIGNED = 'Unassigned';

/** A module's own declared category is the most reliable signal available. */
const CATEGORY_CONTROLLER = {
  platform: 'Platform',
  identity: 'Platform',
  organization: 'Platform',
  security: 'Compliance',
  erp: 'ERP',
  ai: 'AI',
};

/**
 * A domain declared in a module's README, mapped to its business unit. These
 * are the values the READMEs actually use, surveyed across the module tree;
 * an unlisted domain falls through to keyword matching rather than a guess.
 */
const DOMAIN_CONTROLLER = {
  'platform foundation': 'Platform',
  identity: 'Platform',
  operations: 'Platform',
  'business intelligence & analytics': 'Platform',
  'e-commerce': 'Commerce',
  crop: 'Agriculture',
  'crop management': 'Agriculture',
  livestock: 'Agriculture',
  fisheries: 'Agriculture',
  horticulture: 'Agriculture',
  water: 'Agriculture',
  land: 'Agriculture',
  farmer: 'Agriculture',
  climate: 'Agriculture',
  'input supply': 'Agriculture',
  fpo: 'Agriculture',
  machinery: 'Agriculture',
  'farm equipment': 'Agriculture',
};

/**
 * Controller (business unit) by keyword. Ordered: the first match wins, so
 * narrower domains are listed before broader ones.
 */
const CONTROLLER_RULES = [
  ['AI', /(\bAI\b|AIBRAIN|INTELLIGENCE|COPILOT|AGENTIC|PREDICTIVE|DECISION|KNOWLEDGE|MACHINE.?LEARNING|VISION|OCR|VOICE|MULTILINGUAL|OMNICHANNEL|SELFHEALING|DIGITALTWIN|WIKIPEDIA|ADVISORY|RECOMMEND)/],
  ['Compliance', /(COMPLIANCE|AUDIT|GOVERNANCE|TRACEABILITY|FOODSAFETY|CUSTODY|FRAUD|\bRISK|CERTIF|QUARANTINE|SECURITY|INSURANCE|CLAIM|LEGAL|STATUTORY|REGULAT)/],
  ['ERP', /(\bERP|FINANC|ACCOUNT|COST|PROCUREMENT|\bGST\b|ESCROW|REVENUE|BILLING|INVOICE|PAYMENT|ASSET|HUMAN.?RESOURCE|PAYROLL|PROJECTSYSTEM|ENGINEERINGPROJECT|SUBSCRIPTION|\bRFQ\b|\bORDER|SUBSIDY|BUDGET)/],
  ['Commerce', /(ECOMMERCE|COMMERCE|MARKET|PRODUCT|SELLER|PRICING|MERCHANDIS|CATALOG|BUYINGCLUB|RETAIL|DEMAND|SALES|CONSUMER|SHOP|CART)/],
  ['Logistics', /(LOGISTIC|FREIGHT|COLDSTORAGE|COLD.?CHAIN|MOBILITY|RIDES|WAREHOUS|SHELFLIFE|RETURNLOAD|GEOFENCING|TRANSPORT|DELIVER|FLEET)/],
  ['Agriculture', /(CROP|SOIL|LIVESTOCK|DAIRY|FISHER|POULTRY|SHEEP|GOAT|\bPIG\b|SERICULTURE|APICULTURE|MUSHROOM|HORTICULTURE|FORESTRY|SEED|FERTILIZER|IRRIGATION|WATER|WEATHER|CLIMATE|BIODIVERSITY|GREENHOUSE|VERMICOMPOST|ANIMALHEALTH|FARMER|VILLAGE|\bLAND|NUTRIENT|ORGANIC|AGRI|HARVEST|RURAL|FOOD|NUTRITION|RECIPE|HEALTH)/],
  ['Platform', /(PLATFORM|IDENTITY|\bUSER|\bROLE|PERMISSION|ORGANIZATION|TENANT|SYSTEMADMIN|SHAREDINFRA|BACKUP|TELEMETRY|MONITORING|CONFIGURATION|SMSAUTH|OFFLINESYNC|\bFORM\b|RESOURCECRUD|\bIOT\b|SENSOR|WEARABLE|INFRASTRUCTURE|ANALYTICS|COMMUNITY|INFORMATION|EXPERIENCE|\bAPI\b|INTEGRATION|CONNECT)/],
];

/** Library sections that are governance/compliance rather than content. */
const LIBRARY_GOVERNANCE = /^(00_GOVERNANCE|04_AUTHORITY|12_AUDITS|99_AUDIT|19_QUARANTINE_INDEX|29_DEACCESSION)/;

function controllerForText(text) {
  const upper = String(text || '').toUpperCase();
  if (!upper) return UNASSIGNED;
  for (const [controller, pattern] of CONTROLLER_RULES) {
    if (pattern.test(upper)) return controller;
  }
  return UNASSIGNED;
}

/** "M001", "BACKEND:M001", "MOD-M001", "M001_PLATFORM_CORE" -> "M001". */
function moduleNumber(identifier) {
  const match = String(identifier || '').match(/(M\d+)/);
  return match ? match[1] : null;
}

/** Free-text an entry offers about itself, for keyword classification. */
function describingText(key, entry) {
  const data = entry.data || {};
  return [
    key,
    data.moduleId,
    data.name,
    data.moduleName,
    data.ModuleName,
    data.Name,
    data.description,
    data.aiContext,
  ].filter(Boolean).join(' ');
}

/**
 * Place one index entry in the org chart. `aliases` maps a module number to
 * descriptive text gathered from richer entries, so a bare M001 inherits what
 * M001_PLATFORM_CORE knows about itself.
 * Never returns null: no entry can fall out of the chart.
 */
function classify(key, entry, aliases = new Map()) {
  const type = entry.type || 'unknown';
  const file = path.basename(entry.path || key);
  const data = entry.data || {};

  // Library content: the library is its own business unit, its top-level
  // section is the system, and the next directory down is the module.
  if (key.startsWith('LIBRARY:') || type === 'catalogue' || type === 'library-file') {
    const relative = key.startsWith('LIBRARY:')
      ? key.slice('LIBRARY:'.length)
      : data.relativePath || file;
    const segments = relative.split('/').filter(Boolean);
    const section = segments.length > 1 ? segments[0] : '(root)';
    const module = segments.length > 2 ? segments[1] : '(section root)';
    return {
      controller: LIBRARY_GOVERNANCE.test(section) ? 'Compliance' : 'Library',
      system: section,
      module,
      file,
      basis: 'library-path',
    };
  }

  const identifier = type === 'runtime-module' || type === 'backend-module'
    ? (key.includes(':') ? key.split(':')[0] : key)
    : String(data.moduleId || data.ModuleName || key.replace(/^MOD-/, ''));

  // 1. the module's own declared category
  let controller = UNASSIGNED;
  let basis = 'unmatched';
  const declared = String(data.category || '').toLowerCase();
  if (CATEGORY_CONTROLLER[declared]) {
    controller = CATEGORY_CONTROLLER[declared];
    basis = `category:${declared}`;
  }

  // 1b. a domain the module's own README declares
  if (controller === UNASSIGNED) {
    const domain = String(data.domain || '').toLowerCase().trim();
    if (DOMAIN_CONTROLLER[domain]) {
      controller = DOMAIN_CONTROLLER[domain];
      basis = `domain:${domain}`;
    }
  }

  // 2. keywords in whatever the entry says about itself
  if (controller === UNASSIGNED) {
    controller = controllerForText(describingText(key, entry));
    if (controller !== UNASSIGNED) basis = 'keyword';
  }

  // 3. the descriptive twin of a bare identifier
  if (controller === UNASSIGNED) {
    const number = moduleNumber(identifier);
    const alias = number && aliases.get(number);
    if (alias) {
      controller = controllerForText(alias.text);
      if (controller === UNASSIGNED && CATEGORY_CONTROLLER[alias.category]) {
        controller = CATEGORY_CONTROLLER[alias.category];
      }
      if (controller !== UNASSIGNED) basis = `alias:${alias.source}`;
    }
  }

  const system = type === 'backend-module' ? 'Backend Systems'
    : type === 'runtime-module' ? 'Runtime Systems'
      : 'Module Cards';

  return { controller, system, module: identifier, file, basis };
}

/** Build module-number -> descriptive text from the entries that have it. */
function buildAliases(index) {
  const aliases = new Map();
  for (const [key, entry] of index) {
    const data = entry.data || {};
    const number = moduleNumber(data.moduleId || key);
    if (!number) continue;

    const text = describingText(key, entry);
    const category = String(data.category || '').toLowerCase();
    const informative = Boolean(data.description || data.category || /_/.test(key));
    if (!informative) continue;

    const existing = aliases.get(number);
    // Prefer the richest description available for the number.
    if (!existing || text.length > existing.text.length) {
      aliases.set(number, { text, category, source: key });
    }
  }
  return aliases;
}

/** "sales_role.json (ERP -> Billing -> Sales)" */
function qualifiedName(position) {
  return `${position.file} (${position.controller} -> ${position.system} -> ${position.module})`;
}

/**
 * Build the chart, the manifest and the lookup tables in a single pass over
 * the index, so a rebuild after a file change stays cheap.
 */
function build(index) {
  const aliases = buildAliases(index);
  const controllers = new Map();
  const manifest = new Map();   // key -> record
  const byBasename = new Map(); // lowercased filename -> [key]
  const byModule = new Map();   // module -> [key]
  let unassigned = 0;

  for (const [key, entry] of index) {
    const position = classify(key, entry, aliases);
    if (position.controller === UNASSIGNED) unassigned += 1;

    const record = {
      key,
      file: position.file,
      path: entry.path,
      type: entry.type,
      controller: position.controller,
      system: position.system,
      module: position.module,
      basis: position.basis,
      qualifiedName: qualifiedName(position),
      orgPath: `${PROJECT}/${position.controller}/${position.system}/${position.module}/${position.file}`,
      lastModified: entry.lastModified,
      fileSize: entry.fileSize,
    };
    manifest.set(key, record);

    const lower = position.file.toLowerCase();
    if (!byBasename.has(lower)) byBasename.set(lower, []);
    byBasename.get(lower).push(key);

    if (!byModule.has(position.module)) byModule.set(position.module, []);
    byModule.get(position.module).push(key);

    if (!controllers.has(position.controller)) {
      controllers.set(position.controller, { name: position.controller, systems: new Map(), fileCount: 0 });
    }
    const controller = controllers.get(position.controller);
    controller.fileCount += 1;

    if (!controller.systems.has(position.system)) {
      controller.systems.set(position.system, { name: position.system, modules: new Map(), fileCount: 0 });
    }
    const system = controller.systems.get(position.system);
    system.fileCount += 1;

    if (!system.modules.has(position.module)) {
      system.modules.set(position.module, { name: position.module, files: [], fileCount: 0 });
    }
    const module = system.modules.get(position.module);
    module.fileCount += 1;
    module.files.push(key);
  }

  // Mark every name that more than one file shares, so callers know a plain
  // filename is ambiguous before they act on it.
  const duplicates = [];
  for (const [name, keys] of byBasename) {
    if (keys.length > 1) {
      duplicates.push({
        name,
        count: keys.length,
        occurrences: keys.map((k) => ({ key: k, orgPath: manifest.get(k).orgPath })),
      });
      for (const k of keys) manifest.get(k).ambiguousName = true;
    }
  }
  duplicates.sort((a, b) => b.count - a.count);

  return { controllers, manifest, byBasename, byModule, duplicates, unassigned, aliases };
}

/** Serialise the chart for an API response, with an optional depth limit. */
function toTree(chart, options = {}) {
  const includeFiles = options.includeFiles === true;
  const controllers = [...chart.controllers.values()]
    .sort((a, b) => b.fileCount - a.fileCount)
    .map((controller) => ({
      controller: controller.name,
      fileCount: controller.fileCount,
      systemCount: controller.systems.size,
      systems: [...controller.systems.values()]
        .sort((a, b) => b.fileCount - a.fileCount)
        .map((system) => ({
          system: system.name,
          fileCount: system.fileCount,
          moduleCount: system.modules.size,
          modules: [...system.modules.values()]
            .sort((a, b) => b.fileCount - a.fileCount)
            .map((module) => ({
              module: module.name,
              fileCount: module.fileCount,
              ...(includeFiles
                ? { files: module.files.map((k) => chart.manifest.get(k).file) }
                : {}),
            })),
        })),
    }));

  return {
    project: PROJECT,
    totals: {
      controllers: chart.controllers.size,
      files: chart.manifest.size,
      duplicateNames: chart.duplicates.length,
      unassigned: chart.unassigned,
    },
    controllers,
  };
}

module.exports = {
  PROJECT,
  UNASSIGNED,
  classify,
  qualifiedName,
  build,
  toTree,
  buildAliases,
  moduleNumber,
  controllerForText,
};
