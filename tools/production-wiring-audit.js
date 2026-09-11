#!/usr/bin/env node
'use strict';

/**
 * Production wiring audit for the existing EBDESIGN architecture.
 * This validates connectivity; it does not create a replacement architecture.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend', 'src');
const FRONTEND = path.join(ROOT, 'frontend', 'src');
const failures = [];
const warnings = [];
const exists = p => fs.existsSync(p);
const read = p => fs.readFileSync(p, 'utf8');
const rel = p => path.relative(ROOT, p).replace(/\\/g, '/');
function walk(dir, out = []) {
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','.git','dist','build','.next'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    e.isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}
function fail(code, message) { failures.push({ code, message }); }
function warn(code, message) { warnings.push({ code, message }); }

const index = path.join(BACKEND, 'index.js');
if (!exists(index)) fail('BACKEND_ENTRY_MISSING', 'backend/src/index.js is missing');

if (exists(index)) {
  const source = read(index);
  for (const marker of ['DynamicServiceLoader','DynamicRouteLoader','errorHandler','securityHeaders','requestId']) {
    if (!source.includes(marker)) warn('CORE_WIRING_MARKER_MISSING', `index.js: ${marker}`);
  }
  const imports = [...source.matchAll(/require\(['"]\.\/routes\/([^'"]+)['"]\)/g)].map(m => m[1]);
  for (const name of [...new Set(imports)]) {
    const p = path.join(BACKEND, 'routes', name);
    if (!exists(p)) fail('ROUTE_IMPORT_MISSING', `index.js imports missing route ${rel(p)}`);
  }
}

for (const file of walk(path.join(BACKEND, 'routes')).filter(p => p.endsWith('.js'))) {
  const source = read(file);
  if (!/module\.exports\s*=/.test(source)) warn('ROUTE_EXPORT_UNKNOWN', rel(file));
  if (!/express\.Router|router\s*=/.test(source)) warn('ROUTE_SHAPE_UNKNOWN', rel(file));
}

for (const root of [path.join(BACKEND,'modules'), path.join(ROOT,'modules')].filter(exists)) {
  for (const manifest of walk(root).filter(p => p.endsWith('module.json'))) {
    let json;
    try { json = JSON.parse(read(manifest)); }
    catch (e) { fail('INVALID_MODULE_JSON', `${rel(manifest)}: ${e.message}`); continue; }
    const base = path.dirname(manifest);
    const f = json.execution?.frontend || {};
    if (f.entryPoint && !exists(path.join(base, f.entryPoint))) warn('MODULE_FRONTEND_ENTRY_MISSING', `${rel(manifest)} -> ${f.entryPoint}`);
    if (f.mainComponent && !exists(path.join(base, f.mainComponent))) warn('MODULE_FRONTEND_COMPONENT_MISSING', `${rel(manifest)} -> ${f.mainComponent}`);
  }
}

const anchors = {
  village: ['villageProfileService.js','VillageRegistryPage.jsx'],
  engineering_dpr: ['engineeringProjectRoutes.js','dprGenerationRoutes.js'],
  subsidy: ['subsidyRoutes.js','GovernmentDashboardPage.jsx'],
  supply_chain_vendor: ['vendorRoutes.js','supplyChainTracking.js'],
  logistics_cold_chain: ['logisticsEnhancements','coldStorageRoutes.js'],
  insurance: ['insuranceEnhancements'],
  finance: ['paymentRoutes.js','financialAnalytics.js'],
  ai_backbone: ['aiBackboneRoutes.js','aiGatewayRoutes.js'],
  geo_connectivity: ['geofencingRoutes.js'],
  seasonal_intelligence: ['predictiveIntelligenceRoutes.js','climateMonitoringRoutes.js']
};
const backendText = walk(BACKEND).filter(p => /\.(js|json|sql)$/.test(p)).map(read).join('\n');
for (const [domain, markers] of Object.entries(anchors)) {
  const missing = markers.filter(m => !backendText.includes(m));
  if (missing.length) warn('DOMAIN_WIRING_REVIEW', `${domain}: ${missing.join(', ')}`);
}

const names = new Map();
for (const file of walk(path.join(BACKEND,'services')).filter(p => p.endsWith('.js'))) {
  const key = path.basename(file).toLowerCase();
  const list = names.get(key) || []; list.push(rel(file)); names.set(key,list);
}
for (const [name, files] of names) if (files.length > 1) warn('DUPLICATE_SERVICE_NAME', `${name}: ${files.join(' | ')}`);

if (exists(FRONTEND)) {
  const apiSurface = walk(FRONTEND).filter(p => /(^|[\\/])(api|services)[\\/]/.test(rel(p)) && /\.(js|jsx|ts|tsx)$/.test(p));
  if (!apiSurface.length) warn('FRONTEND_API_SURFACE_MISSING', 'No frontend api/services source detected');
}

const result = {
  generatedAt: new Date().toISOString(),
  repository: 'subhesco-bit/AFRERA-EBDESIGN-project',
  scope: 'Existing modules/files only; wiring validation and integration integrity',
  status: failures.length ? 'FAIL' : warnings.length ? 'REVIEW_REQUIRED' : 'PASS',
  failures,
  warnings,
  counts: { failures: failures.length, warnings: warnings.length }
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = failures.length ? 1 : 0;
