#!/usr/bin/env node
/**
 * domain-chain-audit.js — does each business domain actually work end to end?
 *
 * A route that boots is not a feature. A feature needs the whole chain:
 *
 *     database table -> backend service -> mounted route -> frontend page
 *
 * This measures each link per domain and reports where the chain breaks, so
 * "how complete is the platform" is answered with evidence instead of a file
 * count. Substance is measured by size: below ~6 KB a service or page cannot
 * hold a working implementation, and below ~1 KB it is a scaffold.
 *
 * Usage: node tools/domain-chain-audit.js [--json <out>]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'backend', 'src');
const FE = path.join(ROOT, 'frontend', 'src');
const JSON_OUT = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;

/**
 * Business domains, matched against file paths and names by keyword. Ordered:
 * the first domain whose pattern matches wins, so put specific before general.
 */
const DOMAINS = [
  ['Marketplace & Commerce', /ecommerce|marketplace|product|catalog|cart|checkout|listing|order|buyer|seller|storefront|pricing|auction|tender|bid/i],
  ['Farmer & Agronomy', /farmer|agronom|crop|seed|soil|irrigation|harvest|cultivat|agri|farm|nursery|greenhouse|vermicompost|mushroom|variety/i],
  ['Livestock & Fisheries', /livestock|cattle|dairy|poultry|pig|goat|fishery|fisheries|aqua|veterinar|animal/i],
  // NB: no bare "route" here — it would match backend/src/routes/* for every
  // file in the tree and swallow the whole API surface into this one domain.
  ['Supply Chain & Logistics', /logistic|shipment|freight|warehouse|inventory|coldchain|cold_chain|coldstorage|transport|delivery|fleet|routing|routeoptim|custody|dispatch/i],
  ['Finance & Payments', /financ|payment|invoic|billing|ledger|accounting|credit|loan|subsidy|gst|tax|wallet|settlement|revenue|cost|treasury|payroll/i],
  ['Insurance & Risk', /insurance|claim|policy|underwrit|risk|actuar|premium/i],
  ['AI & Intelligence', /\bai\b|aiservice|intelligence|ml_|machinelearn|predict|recommend|copilot|llm|claude|decision|nervous|brain|vision|forecast/i],
  ['Identity & Access', /auth|login|user|role|permission|rbac|mfa|session|token|identity|access|tenant|organization/i],
  ['Compliance & Governance', /gdpr|compliance|consent|audit|governance|privacy|regulat|statutor|certif|traceab/i],
  ['ERP & Enterprise', /erp|sap|hr_|human_resource|procure|vendor|supplier|asset|maintenance|workflow|approval|document/i],
  ['Rural & Community', /rural|village|community|cooperative|fpo|ngo|training|advisory|scheme|welfare|health/i],
  ['Platform & Infrastructure', /platform|core|config|registry|monitor|health|telemetry|notification|search|integration|gateway|cache|queue/i],
  ['Analytics & Reporting', /analytic|report|dashboard|metric|kpi|insight|statistic|chart|bi_/i],
];

const domainOf = (text) => {
  for (const [name, re] of DOMAINS) if (re.test(text)) return name;
  return 'Unclassified';
};

// ---------------------------------------------------------------- helpers

function walk(dir, filter = () => true, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.git', '__tests__', 'dist', 'build'].includes(e.name)) walk(abs, filter, out);
    } else if (e.isFile() && filter(abs)) {
      out.push(abs);
    }
  }
  return out;
}

const sizeOf = (f) => { try { return fs.statSync(f).size; } catch { return 0; } };
const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };

// ---------------------------------------------------------------- collect

const blank = () => ({
  tables: 0,
  services: 0, servicesReal: 0,
  routeFiles: 0, routeDecls: 0, mounted: 0,
  pages: 0, pagesReal: 0, pagesRouted: 0,
  pagesCallingApi: 0,
  modulesNamed: 0, modulesBare: 0,
});
const D = new Map(DOMAINS.map(([n]) => [n, blank()]).concat([['Unclassified', blank()]]));
const bump = (dom, k, n = 1) => { const d = D.get(dom) || D.get('Unclassified'); d[k] += n; };

// -- database tables (from migrations)
const migrations = walk(path.join(BE, 'database', 'migrations'), (f) => f.endsWith('.sql'));
const tableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`']?([a-zA-Z_][\w.]*)["`']?/gi;
const tables = new Set();
for (const m of migrations) {
  const t = read(m);
  let mm;
  tableRe.lastIndex = 0;
  while ((mm = tableRe.exec(t)) !== null) {
    const name = mm[1].toLowerCase();
    // Guard against prose in comments being read as a table name.
    if (!/^[a-z][a-z0-9_]{2,}$/.test(name)) continue;
    if (['if', 'is', 'above', 'silently', 'body', 'the', 'this', 'not'].includes(name)) continue;
    tables.add(name);
  }
}
for (const t of tables) bump(domainOf(t), 'tables');

// -- backend services
for (const f of walk(path.join(BE, 'services'), (f) => f.endsWith('.js'))) {
  const dom = domainOf(path.basename(f));
  bump(dom, 'services');
  if (sizeOf(f) > 6000) bump(dom, 'servicesReal');
}

// -- backend routes
const routeDeclRe = /\b(?:router|app)\.(get|post|put|patch|delete|all)\(\s*['"`]/g;
for (const f of walk(path.join(BE, 'routes'), (f) => f.endsWith('.js'))) {
  const dom = domainOf(path.basename(f));
  bump(dom, 'routeFiles');
  const t = read(f);
  let n = 0;
  routeDeclRe.lastIndex = 0;
  while (routeDeclRe.exec(t) !== null) n++;
  bump(dom, 'routeDecls', n);
}

// -- what index.js actually mounts
const indexSrc = read(path.join(BE, 'index.js'));
const mountRe = /app\.use\(\s*['"]([^'"]+)['"]/g;
let mm;
const mounts = [];
while ((mm = mountRe.exec(indexSrc)) !== null) if (mm[1].startsWith('/api')) mounts.push(mm[1]);
for (const m of new Set(mounts)) bump(domainOf(m), 'mounted');

// -- backend modules
for (const e of (() => { try { return fs.readdirSync(path.join(BE, 'modules'), { withFileTypes: true }); } catch { return []; } })()) {
  if (!e.isDirectory()) continue;
  const dom = domainOf(e.name);
  if (/^M\d+_/.test(e.name)) bump(dom, 'modulesNamed');
  else if (/^M\d+$/.test(e.name)) bump(dom, 'modulesBare');
}

// -- frontend pages
const routesCfg = read(path.join(FE, 'config', 'routes.js'))
  + read(path.join(FE, 'config', 'componentRoutes.js'))
  + read(path.join(FE, 'config', 'autoPageRoutes.js'))
  + read(path.join(FE, 'App.jsx'));

const pages = walk(path.join(FE, 'pages'), (f) => /\.(jsx|tsx)$/.test(f));
for (const f of pages) {
  const base = path.basename(f).replace(/\.(jsx|tsx)$/, '');
  const dom = domainOf(base);
  bump(dom, 'pages');
  if (sizeOf(f) > 6000) bump(dom, 'pagesReal');
  // Routed if the component name appears in any route configuration.
  if (routesCfg.includes(base)) bump(dom, 'pagesRouted');
  const t = read(f);
  if (/\bapi\.|apiClient|axios|fetch\(|\/api\/v1/.test(t)) bump(dom, 'pagesCallingApi');
}

// ---------------------------------------------------------------- report

const rows = [...D.entries()].filter(([, v]) => Object.values(v).some((x) => x > 0));
rows.sort((a, b) => (b[1].tables + b[1].services + b[1].pages) - (a[1].tables + a[1].services + a[1].pages));

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const pad = (s, n) => String(s).padStart(n);

console.log('\n══════════════════ DOMAIN CHAIN AUDIT ══════════════════\n');
console.log('  Chain: table -> service -> route -> mounted -> page -> page calls API\n');
console.log(`  ${'Domain'.padEnd(27)}${pad('tbl', 5)}${pad('svc', 6)}${pad('real', 6)}${pad('rtF', 5)}${pad('decl', 6)}${pad('mnt', 5)}${pad('page', 6)}${pad('real', 6)}${pad('routed', 7)}${pad('→api', 6)}`);
console.log('  ' + '─'.repeat(85));
for (const [name, v] of rows) {
  console.log(`  ${name.padEnd(27)}${pad(v.tables, 5)}${pad(v.services, 6)}${pad(v.servicesReal, 6)}${pad(v.routeFiles, 5)}${pad(v.routeDecls, 6)}${pad(v.mounted, 5)}${pad(v.pages, 6)}${pad(v.pagesReal, 6)}${pad(v.pagesRouted, 7)}${pad(v.pagesCallingApi, 6)}`);
}

console.log('\n\n  CHAIN INTEGRITY — where each domain breaks\n');
for (const [name, v] of rows) {
  const breaks = [];
  if (v.tables && !v.services) breaks.push('tables but NO service');
  if (v.services && !v.servicesReal) breaks.push('services all thin');
  if (v.services && !v.routeFiles) breaks.push('service but NO route');
  if (v.routeFiles && !v.mounted) breaks.push('routes NOT mounted');
  if (v.routeFiles && !v.pages) breaks.push('api but NO ui');
  if (v.pages && !v.pagesRouted) breaks.push('pages NOT routed');
  if (v.pages && !v.pagesCallingApi) breaks.push('ui never calls api');
  if (v.pages && v.pagesCallingApi && pct(v.pagesCallingApi, v.pages) < 25) {
    breaks.push(`only ${pct(v.pagesCallingApi, v.pages)}% of ui calls api`);
  }
  const state = breaks.length === 0 ? 'complete chain' : breaks.join('; ');
  const mark = breaks.length === 0 ? 'OK  ' : breaks.length > 2 ? 'BAD ' : 'WARN';
  console.log(`  [${mark}] ${name.padEnd(27)} ${state}`);
}

const tot = rows.reduce((a, [, v]) => {
  for (const k of Object.keys(v)) a[k] = (a[k] || 0) + v[k];
  return a;
}, {});

console.log('\n\n  PLATFORM TOTALS\n');
console.log(`    database tables            ${pad(tot.tables, 6)}`);
console.log(`    backend services           ${pad(tot.services, 6)}   substantive ${tot.servicesReal} (${pct(tot.servicesReal, tot.services)}%)`);
console.log(`    route files                ${pad(tot.routeFiles, 6)}   declarations ${tot.routeDecls}`);
console.log(`    mount points in index.js   ${pad(tot.mounted, 6)}`);
console.log(`    frontend pages             ${pad(tot.pages, 6)}   substantive ${tot.pagesReal} (${pct(tot.pagesReal, tot.pages)}%)`);
console.log(`    pages registered in a route${pad(tot.pagesRouted, 6)}   (${pct(tot.pagesRouted, tot.pages)}%)`);
console.log(`    pages that call the API    ${pad(tot.pagesCallingApi, 6)}   (${pct(tot.pagesCallingApi, tot.pages)}%)`);
console.log(`    module dirs  named MXXX_*  ${pad(tot.modulesNamed, 6)}   bare MXXX ${tot.modulesBare}`);

console.log(`\n    UI reachability : ${tot.pagesRouted}/${tot.pages} pages routed — ${tot.pages - tot.pagesRouted} unreachable`);
console.log(`    UI wired to API : ${tot.pagesCallingApi}/${tot.pages} pages call the backend\n`);

if (JSON_OUT) {
  fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
  fs.writeFileSync(JSON_OUT, JSON.stringify({ domains: Object.fromEntries(rows), totals: tot }, null, 2));
  console.log(`  json -> ${path.relative(ROOT, JSON_OUT)}\n`);
}
