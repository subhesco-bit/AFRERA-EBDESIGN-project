/**
 * Complete System Registry
 *
 * Purpose:
 * - Recognise every existing module/service/route/page as part of a named business system.
 * - Preserve the existing repository architecture; this is discovery/orchestration, not a replacement architecture.
 * - Provide a single runtime inventory for Platform, Domain and Enterprise layers.
 *
 * The catalogue is intentionally broader than the numbered M001-M150 set. The repository
 * contains additional named modules, legacy services, routes and frontend surfaces.
 */
const fs = require('fs');
const path = require('path');

const SYSTEMS = Object.freeze([
  ['S01', 'Identity, Auth & Security', 'Platform', ['auth','identity','mfa','gdpr','permission','role','session','sso','consent','kyc','verification']],
  ['S02', 'Platform Core, Multi-Tenancy & Organisation Administration', 'Platform', ['platform','tenant','organisation','organization','configuration','systemadministration','company']],
  ['S03', 'AI Orchestration & Copilot', 'Platform', ['ai','claude','copilot','orchestration','decision','predictive','knowledge','vision','voice','selfhealing']],
  ['S04', 'Marketplace & E-Commerce', 'Domain', ['marketplace','ecommerce','commerce','product','order','seller','rfq','bulkorder','pricing','catalog','buyingclub']],
  ['S05', 'Finance, Payments & Ledger', 'Enterprise', ['finance','financial','payment','wallet','ledger','loan','gst','revenue','escrow','accounting','cost']],
  ['S06', 'Insurance & Risk Protection', 'Domain', ['insurance','claim','policy','premium','fraud']],
  ['S07', 'Rural Finance, Government Schemes & Cooperative', 'Domain', ['ruralfinance','scheme','subsidy','cooperative','cooperative','grant','benefit']],
  ['S08', 'Logistics & Cold Chain', 'Domain', ['logistics','cold','warehouse','transport','shipment','tracking','transit','cargo','delivery']],
  ['S09', 'Crop & Agronomy Advisory', 'Domain', ['crop','agronomy','agriculture','farm','harvest','cultivation']],
  ['S10', 'Soil, Nutrient & Land Mapping', 'Domain', ['soil','nutrient','land','geospatial','plot','soilhealth']],
  ['S11', 'Water & Irrigation Management', 'Domain', ['water','irrigation','watershed','drainage']],
  ['S12', 'Climate, Weather & Risk Intelligence', 'Domain', ['climate','weather','forecast','risk','disaster','resilience']],
  ['S13', 'Crop Inputs Supply Chain', 'Domain', ['input','seed','fertilizer','pesticide','agriinput']],
  ['S14', 'Livestock & Dairy', 'Domain', ['livestock','dairy','cattle','goat','pig','poultry','chicken','milk']],
  ['S15', 'Fisheries & Aquaculture', 'Domain', ['fish','fisheries','aquaculture','pond','hatchery']],
  ['S16', 'Horticulture & Protected Cultivation', 'Domain', ['horticulture','greenhouse','polyhouse','protectedcultivation','vegetable','fruit']],
  ['S17', 'Forestry, Sericulture & Minor Produce', 'Domain', ['forestry','sericulture','silk','bamboo','minorproduce','ntfp']],
  ['S18', 'Nutrition, Food & Consumer Health', 'Domain', ['nutrition','food','foodsafety','consumerhealth','protein']],
  ['S19', 'ERP Integration', 'Enterprise', ['erp','sap','integration','interoperability']],
  ['S20', 'HR & Labour Management', 'Enterprise', ['hr','humanresource','labour','employee','payroll','timesheet']],
  ['S21', 'Farmer Identity, Portal & Household', 'Domain', ['farmer','household','family','member','profile']],
  ['S22', 'Analytics, BI & Reporting', 'Enterprise', ['analytics','bi','report','dashboard','insight','metrics']],
  ['S23', 'Compliance, Governance & Audit', 'Enterprise', ['compliance','governance','audit','legal','regulatory']],
  ['S24', 'IoT, Sensors, Realtime & Digital Twin', 'Platform', ['iot','sensor','telemetry','realtime','digitaltwin','device']],
  ['S25', 'Mobile Experience & Offline Layer', 'Platform', ['mobile','offline','pwa','sync']],
  ['S26', 'Engineering, R&D & Enterprise Knowledge', 'Enterprise', ['engineering','dpr','estimate','projectdesign','research','r&d','knowledge']],
  ['S27', 'Enterprise Administration & DevOps', 'Enterprise', ['devops','deployment','infrastructure','administration','backup','monitoring']],
  ['S28', 'Vendor, Procurement & Supply Chain Operations', 'Enterprise', ['vendor','procurement','purchase','supplier','supplychain']],
  ['S29', 'Machinery, Equipment & Village Operations', 'Domain', ['machinery','equipment','village','panchayat','rental','shared','asset']]
]);

function walk(root, predicate, output = []) {
  if (!fs.existsSync(root)) return output;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) walk(full, predicate, output);
    else if (predicate(full)) output.push(full);
  }
  return output;
}

function normalise(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function collectEvidence(projectRoot) {
  const evidence = [];
  const sources = [
    ['module', path.join(projectRoot, 'modules'), p => p.endsWith('module.json')],
    ['module', path.join(projectRoot, 'backend', 'src', 'modules'), p => /(?:service|routes|controller|model)\.js$/i.test(p)],
    ['service', path.join(projectRoot, 'backend', 'src', 'services'), p => p.endsWith('.js')],
    ['route', path.join(projectRoot, 'backend', 'src', 'routes'), p => p.endsWith('.js')],
    ['page', path.join(projectRoot, 'frontend', 'src', 'pages'), p => /\.(jsx|tsx|js|ts)$/i.test(p)],
    ['component', path.join(projectRoot, 'frontend', 'src', 'components'), p => /\.(jsx|tsx|js|ts)$/i.test(p)]
  ];
  for (const [kind, root, predicate] of sources) {
    for (const file of walk(root, predicate)) {
      evidence.push({ kind, path: path.relative(projectRoot, file).replace(/\\/g, '/') });
    }
  }
  return evidence;
}

function classifyEvidence(item) {
  const haystack = normalise(item.path);
  let best = null;
  let bestScore = 0;
  for (const [id, name, layer, keywords] of SYSTEMS) {
    const score = keywords.reduce((sum, keyword) => sum + (haystack.includes(normalise(keyword)) ? 1 : 0), 0);
    if (score > bestScore) {
      best = { id, name, layer };
      bestScore = score;
    }
  }
  return best ? { ...best, confidence: Math.min(1, bestScore / 3) } : null;
}

function buildCompleteSystemRegistry(projectRoot = path.resolve(__dirname, '../../..')) {
  const evidence = collectEvidence(projectRoot);
  const systems = SYSTEMS.map(([id, name, layer]) => ({
    id,
    name,
    layer,
    evidence: evidence.filter(item => classifyEvidence(item)?.id === id),
    counts: {}
  }));

  for (const system of systems) {
    for (const item of system.evidence) system.counts[item.kind] = (system.counts[item.kind] || 0) + 1;
  }

  const unclassified = evidence.filter(item => !classifyEvidence(item));
  return {
    generatedAt: new Date().toISOString(),
    architecture: ['Platform', 'Domain', 'Enterprise'],
    systems,
    evidenceCount: evidence.length,
    unclassifiedCount: unclassified.length,
    unclassified,
    sourceOfTruth: 'Existing repository files; no replacement module architecture is created.'
  };
}

module.exports = {
  SYSTEMS,
  collectEvidence,
  classifyEvidence,
  buildCompleteSystemRegistry
};
