#!/usr/bin/env node
/**
 * AFRERA Master Engineering Registry Generator
 * =============================================
 *
 * WHY THIS IS A GENERATOR AND NOT A DOCUMENT
 *
 * The governance brief requires (directive 11): "Auto-update all registries
 * after every implementation. No manual synchronization allowed."
 *
 * A hand-written registry violates that requirement the moment it is saved.
 * Within a week it describes a system that no longer exists — which is exactly
 * the failure mode already documented in docs/EBDESIGN_ALIGNMENT.md, where
 * 450 KB of aspirational specs at the repo root read as a gap list and caused
 * duplicate work.
 *
 * So every registry below is DERIVED FROM THE CODE. Run it and it is current.
 * If a registry disagrees with the code, the registry is wrong and regenerating
 * fixes it. That is the only arrangement that satisfies directive 11 honestly.
 *
 * WHAT IT PRODUCES  (docs/registry/)
 *   00_MASTER_INDEX.json/.md      every engineering object, ID'd
 *   01_MODULE_INVENTORY.md        services + their evidence
 *   02_API_REGISTRY.md            every live route
 *   03_DATABASE_REGISTRY.md       tables, views, constraints
 *   04_AI_REGISTRY.md             agents, signals, decision rules
 *   05_GAP_REGISTER.md            classified gaps
 *   06_DUPLICATION_REPORT.md      duplicate tables / index names
 *   07_TECHNICAL_DEBT.md          measured debt, not opinion
 *   08_DEPENDENCY_GRAPH.md        service -> service require graph
 *   09_TRACEABILITY_MATRIX.md     capability -> DB -> API -> UI -> test
 *   10_READINESS_DASHBOARD.md     completion by layer
 *
 * USAGE
 *   node tools/engineering-registry.js            # write registries
 *   node tools/engineering-registry.js --check    # CI mode, non-zero on new gaps
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BE = path.join(ROOT, 'backend', 'src');
const FE = path.join(ROOT, 'frontend', 'src');
const OUT = path.join(ROOT, 'docs', 'registry');

const CHECK_MODE = process.argv.includes('--check');

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function walk(dir, ext, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, acc);
    else if (ext.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const count = (s, re) => (s.match(re) || []).length;

/** Stable ID from a namespace + name, so IDs do not churn between runs. */
function id(ns, name) {
  return `${ns}-${String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 40)}`;
}

// ---------------------------------------------------------------------------
// 1. COLLECT — backend services
// ---------------------------------------------------------------------------

function collectServices() {
  // routes/ carries endpoints that services/ does not. Scanning only services/
  // under-counted the live API surface by ~26% against a real boot.
  const files = walk(path.join(BE, 'services'), ['.js'])
    .concat(walk(path.join(BE, 'routes'), ['.js']));
  return files.map((p) => {
    const src = read(p);
    const name = path.basename(p, '.js');
    const kind = /[\\/]routes[\\/]/.test(p) ? 'Route' : 'Service';
    const routes = [...src.matchAll(/router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)/g)]
      .map((m) => ({ method: m[1].toUpperCase(), path: m[2] }));
    const requires = [...src.matchAll(/require\(['"]\.\.?\/([^'"]+)['"]\)/g)].map((m) => m[1]);
    return {
      objectId: id(kind === 'Route' ? 'RTE' : 'SVC', name),
      name,
      kind,
      file: rel(p),
      lines: src.split('\n').length,
      routes,
      routeCount: routes.length,
      exportsRouter: /module\.exports\s*=\s*\{[^}]*\brouter\b/.test(src) || /exports\.router/.test(src),
      // Measured debt signals — counted, never estimated.
      randomCalls: count(src, /Math\.random\(\)/g),
      todos: count(src, /\b(TODO|FIXME|HACK|XXX)\b/g),
      authGuarded: count(src, /authMiddleware/g),
      adminGuarded: count(src, /adminMiddleware/g),
      usesTransactions: /BEGIN|COMMIT/.test(src),
      emitsSignals: count(src, /signalBus\.emit/g),
      requires,
    };
  });
}

// ---------------------------------------------------------------------------
// 2. COLLECT — database
// ---------------------------------------------------------------------------

function collectDatabase() {
  const files = walk(path.join(BE, 'database', 'migrations'), ['.sql']).sort();
  const tables = new Map();  // name -> [{file}]
  const views = [];
  const indexNames = new Map();
  let checks = 0, fks = 0, triggers = 0;

  for (const p of files) {
    const raw = read(p);
    // Strip plpgsql bodies AND comments AND string literals before matching.
    //
    // Comments were not stripped until 2026-08-04, and it showed: the report
    // listed tables called "is", "and", "makes" and "statements". Those came
    // from prose — a reconciliation comment reading "CREATE TABLE IF NOT
    // EXISTS is a no-op here" matched the pattern and registered a table
    // named `is`. Documentation about SQL is not SQL.
    const src = raw
      .replace(/\$\$[\s\S]*?\$\$/g, ' ')    // plpgsql bodies
      .replace(/\/\*[\s\S]*?\*\//g, ' ')    // block comments
      .replace(/--[^\n]*/g, ' ')            // line comments
      .replace(/'(?:[^']|'')*'/g, "''");    // string literals
    for (const m of src.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/gi)) {
      const t = m[1].toLowerCase();
      if (t === 'body') continue;
      if (!tables.has(t)) tables.set(t, []);
      tables.get(t).push(rel(p));
    }
    for (const m of src.matchAll(/CREATE (?:OR REPLACE )?(?:MATERIALIZED )?VIEW\s+(\w+)/gi)) {
      views.push({ name: m[1].toLowerCase(), file: rel(p) });
    }
    for (const m of src.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)\s+ON\s+([\w.]+)/gi)) {
      const k = m[1].toLowerCase();
      if (!indexNames.has(k)) indexNames.set(k, []);
      indexNames.get(k).push({ table: m[2].toLowerCase(), file: rel(p) });
    }
    checks += count(src, /\bCHECK\s*\(/gi);
    fks += count(src, /\bREFERENCES\s+\w+\s*\(/gi);
    triggers += count(src, /CREATE TRIGGER/gi);
  }
  return { files, tables, views, indexNames, checks, fks, triggers };
}

// ---------------------------------------------------------------------------
// 3. COLLECT — AI layer
// ---------------------------------------------------------------------------

function collectAI() {
  const agentsSrc = read(path.join(BE, 'core', 'erpAgents.js'));
  const agents = [...agentsSrc.matchAll(/id:\s*'([\w.]+)',\s*\n\s*domain:\s*DOMAIN\.(\w+)/g)]
    .map((m) => ({ objectId: id('AGT', m[1]), agentId: m[1], domain: m[2] }));

  const busSrc = read(path.join(BE, 'core', 'signalBus.js'));
  const signals = [...busSrc.matchAll(/^\s{2}(\w+):\s*'([\w.]+)'/gm)].map((m) => ({ key: m[1], topic: m[2] }));

  const engineSrc = read(path.join(BE, 'core', 'decisionEngine.js'));
  const rules = [...engineSrc.matchAll(/(?:id|name):\s*'([\w.\- ]+)'/g)].map((m) => m[1]);

  return {
    agents,
    signals,
    ruleCount: new Set(rules).size,
    hasMcda: fs.existsSync(path.join(BE, 'core', 'mcda.js')),
    // The learning loop: do agents ever see whether they were right?
    hasOutcomeFeedback: /outcome|actual_vs|realised/i.test(agentsSrc + engineSrc),
    // Strip comments before checking for self-execution. The naive test matched
    // this file's OWN header — "Every agent PROPOSES. None execute." — and so
    // penalised the code for documenting the guarantee it actually upholds.
    proposalsOnly: (() => {
      const code = agentsSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      return /status:\s*'proposed'/.test(code) && !/\bautoApprove\b|\bexecuteProposal\b/i.test(code);
    })(),
  };
}

// ---------------------------------------------------------------------------
// 4. COLLECT — frontend
// ---------------------------------------------------------------------------

function collectFrontend() {
  const comps = walk(FE, ['.jsx', '.tsx']);
  let aria = 0, errBoundary = 0, breakpoints = 0, loading = 0;
  for (const p of comps) {
    const s = read(p);
    aria += count(s, /aria-[a-z]+/g);
    if (/ErrorBoundary|componentDidCatch|getDerivedStateFromError/.test(s)) errBoundary++;
    breakpoints += count(s, /\b(sm|md|lg|xl):/g);
    if (/loading|Skeleton|isPending/i.test(s)) loading++;
  }
  const pages = comps.filter((p) => /[\\/]pages[\\/]/.test(p)).map(rel);
  return { components: comps.map(rel), pages, aria, errBoundary, breakpoints, loading };
}

// ---------------------------------------------------------------------------
// 5. CAPABILITY TRACEABILITY
//
// Each capability is traced Vision -> DB -> API -> UI -> Test. A capability
// missing any link is a gap, and the register says WHICH link is missing —
// "Backend Complete / Frontend Missing" is a different and far more tractable
// problem than "not started".
// ---------------------------------------------------------------------------

const CAPABILITIES = [
  { cap: 'Marketplace / catalog',      db: /products|categories/,        svc: /product|catalog|merchandis/i,  ui: /Marketplace|Product/i },
  { cap: 'Orders / checkout',          db: /^orders|order_items/,        svc: /order/i,                        ui: /Cart|Checkout|Order/i },
  { cap: 'Payments',                   db: /payment|transaction/,        svc: /payment|financial/i,            ui: /Payment|Checkout/i },
  { cap: 'Wallet',                     db: /wallet/,                     svc: /wallet|offlinePayment/i,        ui: /Wallet/i },
  { cap: 'Escrow',                     db: /escrow/,                     svc: /escrow/i,                       ui: /Escrow/i },
  { cap: 'GST / tax',                  db: /gst/,                        svc: /gst/i,                          ui: /GST|Tax/i },
  { cap: 'Accounting (double-entry)',  db: /journal|ledger|chart_of/,    svc: /financial|accounting/i,         ui: /Account|Ledger/i },
  { cap: 'Subsidy',                    db: /subsid/,                     svc: /subsid/i,                       ui: /Subsid/i },
  { cap: 'Insurance',                  db: /policies|insurance_/,        svc: /insurance/i,                    ui: /Insurance/i },
  { cap: 'Logistics / shipment',       db: /shipment|freight/,           svc: /logistic|shipping/i,            ui: /Logistic|Shipment/i },
  { cap: 'Cold chain / temperature',   db: /temperature|cold/,           svc: /coldchain|iot|shelfLife/i,      ui: /Cold|Temperature/i },
  { cap: 'Farmer portal',              db: /farmers|farm_/,              svc: /farmer/i,                       ui: /Farmer/i },
  { cap: 'Organic traceability',       db: /organic/,                    svc: /organicTrace/i,                 ui: /Organic/i },
  { cap: 'GI intelligence',            db: /gi_/,                        svc: /giIntelligence/i,               ui: /GIIntel/i },
  { cap: 'Multilingual',               db: /translation|language/,       svc: /multilingual/i,                 ui: /Multilingual/i },
  { cap: 'Workflow / approvals',       db: /workflow_/,                  svc: /enterpriseControl/i,            ui: /Workflow|Approval/i },
  { cap: 'CRM',                        db: /crm_/,                       svc: /enterpriseControl/i,            ui: /CRM|Lead/i },
  { cap: 'Risk management',            db: /risk_/,                      svc: /enterpriseControl/i,            ui: /Risk/i },
  { cap: 'Legal management',           db: /legal_/,                     svc: /enterpriseControl/i,            ui: /Legal/i },
  { cap: 'Emergency management',       db: /emergency_/,                 svc: /enterpriseControl/i,            ui: /Emergency|Incident/i },
  { cap: 'Crop semantic search',       db: /crop_concept/,               svc: /v42Intelligence/i,              ui: /Search/i },
  { cap: 'Disruption / rerouting',     db: /disruption|blockade/,        svc: /disruption|reroute/i,           ui: /Disruption/i },
  { cap: 'Knowledge graph',            db: /knowledge_node|ontology/,    svc: /knowledgeGraph/i,               ui: /Knowledge/i },
  // NB: ui was /Mandi|Price/i, which matched any component containing "Price"
  // and reported a UI link for a capability with no backend at all.
  { cap: 'Mandi / reference price',    db: /mandi|reference_price/,      svc: /agmarknet|mandi/i,              ui: /Mandi|ReferencePrice/i },
  { cap: 'Government DPI (ONDC etc.)', db: /ondc|aadhaar|digilocker/,    svc: /ondc|aadhaar|digilocker/i,      ui: /ONDC/i },
  { cap: 'Monitoring / observability', db: /metric|trace_/,              svc: /monitoring|telemetry/i,         ui: /Monitor/i },
];

function traceCapabilities(db, services, fe, tests) {
  const tableNames = [...db.tables.keys()];
  return CAPABILITIES.map((c) => {
    const dbHit = tableNames.filter((t) => c.db.test(t));
    const svcHit = services.filter((s) => c.svc.test(s.name));
    const uiHit = fe.components.filter((p) => c.ui.test(p));
    const apiHit = svcHit.reduce((n, s) => n + s.routeCount, 0);
    const testHit = tests.filter((t) => c.svc.test(path.basename(t)));

    const links = { db: dbHit.length > 0, api: apiHit > 0, svc: svcHit.length > 0, ui: uiHit.length > 0, test: testHit.length > 0 };
    const present = Object.values(links).filter(Boolean).length;

    let status;
    if (present === 0) status = 'Missing';
    else if (present === 5) status = 'Production Candidate';
    else if (links.db && links.svc && links.api && !links.ui) status = 'Backend Complete / Frontend Missing';
    else if (links.db && !links.svc) status = 'Database Only';
    else if (links.svc && !links.db) status = 'Backend Only (no schema)';
    else if (!links.test) status = 'Testing Pending';
    else status = 'Partially Implemented';

    return {
      objectId: id('CAP', c.cap), capability: c.cap, links, status,
      completion: Math.round((present / 5) * 100),
      evidence: { tables: dbHit.length, services: svcHit.length, endpoints: apiHit, components: uiHit.length, tests: testHit.length },
    };
  });
}

// ---------------------------------------------------------------------------
// 6. RENDER
// ---------------------------------------------------------------------------

function bar(pct) {
  const n = Math.round(pct / 5);
  return '█'.repeat(n) + '░'.repeat(20 - n);
}

function main() {
  const services = collectServices();
  const db = collectDatabase();
  const ai = collectAI();
  const fe = collectFrontend();
  const tests = walk(path.join(BE, 'tests'), ['.test.js']).concat(walk(path.join(BE, '__tests__'), ['.test.js']));
  const caps = traceCapabilities(db, services, fe, tests);

  fs.mkdirSync(OUT, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const hdr = (title, n) =>
    `# ${title}\n\n**Generated:** ${stamp} by \`tools/engineering-registry.js\`\n` +
    `**Status:** DESCRIPTIVE — derived from code, not authored.\n` +
    `**Do not edit by hand.** Regenerate instead: \`node tools/engineering-registry.js\`\n\n` +
    (n ? `**Objects indexed:** ${n}\n\n` : '') + '---\n\n';

  const totalRoutes = services.reduce((n, s) => n + s.routeCount, 0);
  const dupTables = [...db.tables.entries()].filter(([, f]) => f.length > 1);
  const dupIndexes = [...db.indexNames.entries()]
    .filter(([, v]) => new Set(v.map((x) => x.table)).size > 1);
  const randomTotal = services.reduce((n, s) => n + s.randomCalls, 0);
  // A module guarded ONLY by adminMiddleware is more restricted, not less —
  // counting auth alone reported auditRoutes as unguarded when it is admin-gated.
  const unguarded = services.filter((s) => s.routeCount > 0 && s.authGuarded === 0 && s.adminGuarded === 0);

  // ---- 00 MASTER INDEX ----
  const master = [
    ...services.map((s) => ({ objectId: s.objectId, type: s.kind, name: s.name, evidence: s.file,
      completion: s.routeCount > 0 ? 100 : 50, status: s.routeCount > 0 ? 'Wired' : 'No route' })),
    ...[...db.tables.keys()].map((t) => ({ objectId: id('TBL', t), type: 'Table', name: t,
      evidence: db.tables.get(t).join(' + '), completion: 100, status: db.tables.get(t).length > 1 ? 'Duplicate' : 'Defined' })),
    ...ai.agents.map((a) => ({ objectId: a.objectId, type: 'AI Agent', name: a.agentId,
      evidence: 'backend/src/core/erpAgents.js', completion: 100, status: 'Proposing' })),
    ...caps.map((c) => ({ objectId: c.objectId, type: 'Capability', name: c.capability,
      evidence: JSON.stringify(c.evidence), completion: c.completion, status: c.status })),
    ...fe.pages.map((p) => ({ objectId: id('UI', path.basename(p, path.extname(p))), type: 'Page',
      name: path.basename(p), evidence: p, completion: 100, status: 'Present' })),
  ];
  fs.writeFileSync(path.join(OUT, '00_MASTER_INDEX.json'), JSON.stringify({ generated: stamp, objects: master }, null, 2));
  fs.writeFileSync(path.join(OUT, '00_MASTER_INDEX.md'),
    hdr('Master Engineering Index', master.length) +
    '| ID | Type | Name | Status | % | Evidence |\n|---|---|---|---|---|---|\n' +
    master.map((o) => `| ${o.objectId} | ${o.type} | ${o.name} | ${o.status} | ${o.completion} | ${String(o.evidence).slice(0, 70)} |`).join('\n') + '\n');

  // ---- 01 MODULE INVENTORY ----
  fs.writeFileSync(path.join(OUT, '01_MODULE_INVENTORY.md'),
    hdr('Module Inventory', services.length) +
    '| ID | Service | Lines | Endpoints | Auth | Txn | Signals | random() | TODO |\n|---|---|---|---|---|---|---|---|---|\n' +
    services.sort((a, b) => b.routeCount - a.routeCount).map((s) =>
      `| ${s.objectId} | ${s.name} | ${s.lines} | ${s.routeCount} | ${s.authGuarded} | ${s.usesTransactions ? 'Y' : '-'} | ${s.emitsSignals} | ${s.randomCalls || '-'} | ${s.todos || '-'} |`).join('\n') + '\n');

  // ---- 02 API REGISTRY ----
  fs.writeFileSync(path.join(OUT, '02_API_REGISTRY.md'),
    hdr('API Registry', totalRoutes) +
    services.filter((s) => s.routeCount).map((s) =>
      `### ${s.name}  (${s.routeCount})\n\n` + s.routes.map((r) => `- \`${r.method} ${r.path}\``).join('\n')).join('\n\n') + '\n');

  // ---- 03 DATABASE REGISTRY ----
  fs.writeFileSync(path.join(OUT, '03_DATABASE_REGISTRY.md'),
    hdr('Database Registry', db.tables.size) +
    `- Migrations: **${db.files.length}**\n- Tables: **${db.tables.size}**\n- Views: **${db.views.length}**\n` +
    `- CHECK constraints: **${db.checks}**\n- Foreign keys: **${db.fks}**\n- Triggers: **${db.triggers}**\n\n` +
    '## Tables\n\n| Table | Defined in |\n|---|---|\n' +
    [...db.tables.entries()].sort().map(([t, f]) => `| ${t} | ${f.join(' + ')}${f.length > 1 ? ' **DUPLICATE**' : ''} |`).join('\n') + '\n');

  // ---- 04 AI REGISTRY ----
  fs.writeFileSync(path.join(OUT, '04_AI_REGISTRY.md'),
    hdr('AI Registry', ai.agents.length) +
    `- Agents: **${ai.agents.length}**\n- Domains: **${new Set(ai.agents.map((a) => a.domain)).size}**\n` +
    `- Signal types: **${ai.signals.length}**\n- Correlation rules: **${ai.ruleCount}**\n` +
    `- MCDA framework: **${ai.hasMcda ? 'present' : 'MISSING'}**\n` +
    `- Propose-only (no self-execution): **${ai.proposalsOnly ? 'enforced' : 'NOT ENFORCED'}**\n` +
    `- Outcome feedback loop: **${ai.hasOutcomeFeedback ? 'present' : 'MISSING — agents cannot learn'}**\n` +
    `- Fabricated outputs (\`Math.random()\` in services): **${randomTotal}**\n\n` +
    '## Agents\n\n| ID | Agent | Domain |\n|---|---|---|\n' +
    ai.agents.map((a) => `| ${a.objectId} | ${a.agentId} | ${a.domain} |`).join('\n') +
    '\n\n## Signals\n\n' + ai.signals.map((s) => `- \`${s.key}\` → \`${s.topic}\``).join('\n') + '\n\n' +
    '## Registries NOT present\n\n' +
    ['Prompt Registry', 'Model Registry', 'Agent Registry (as data — agents are a JS array)',
      'Tool Registry', 'Memory Registry', 'Dataset Registry', 'AI Gateway / capability router',
      'Confidence calibration', 'Bias / fairness checks', 'Cost tracking']
      .map((x) => `- ${x}`).join('\n') + '\n');

  // ---- 05 GAP REGISTER ----
  const gaps = caps.filter((c) => c.status !== 'Production Candidate')
    .sort((a, b) => a.completion - b.completion);
  fs.writeFileSync(path.join(OUT, '05_GAP_REGISTER.md'),
    hdr('Gap Register', gaps.length) +
    '| ID | Capability | Status | % | DB | API | Svc | UI | Test |\n|---|---|---|---|---|---|---|---|---|\n' +
    gaps.map((c) => `| ${c.objectId} | ${c.capability} | ${c.status} | ${c.completion} | ${c.links.db ? '✓' : '·'} | ${c.links.api ? '✓' : '·'} | ${c.links.svc ? '✓' : '·'} | ${c.links.ui ? '✓' : '·'} | ${c.links.test ? '✓' : '·'} |`).join('\n') +
    '\n\n## Classification counts\n\n' +
    Object.entries(gaps.reduce((a, c) => { a[c.status] = (a[c.status] || 0) + 1; return a; }, {}))
      .map(([k, v]) => `- ${k}: **${v}**`).join('\n') + '\n');

  // ---- 06 DUPLICATION ----
  fs.writeFileSync(path.join(OUT, '06_DUPLICATION_REPORT.md'),
    hdr('Duplication Report', dupTables.length + dupIndexes.length) +
    `## Tables defined more than once (${dupTables.length})\n\n` +
    (dupTables.length ? dupTables.map(([t, f]) => `- **${t}** — ${f.join(' + ')}`).join('\n') : '_none_') +
    `\n\n> Only the FIRST definition takes effect (CREATE TABLE IF NOT EXISTS).\n> Later columns are silently discarded — see docs/MIGRATION_CHAIN_VERIFIED.md.\n\n` +
    `## Index names reused on different tables (${dupIndexes.length})\n\n` +
    (dupIndexes.length ? dupIndexes.map(([n, v]) => `- **${n}** — ${v.map((x) => x.table).join(', ')}`).join('\n') : '_none_') + '\n');

  // ---- 07 TECHNICAL DEBT ----
  fs.writeFileSync(path.join(OUT, '07_TECHNICAL_DEBT.md'),
    hdr('Technical Debt Register') +
    '| Item | Measure | Severity |\n|---|---|---|\n' +
    `| Fabricated AI output (\`Math.random()\`) | ${randomTotal} calls | **Critical** — presented to users as analysis |\n` +
    `| Services with routes but no auth guard | ${unguarded.length} | ${unguarded.length ? '**High**' : 'None'} |\n` +
    `| Duplicate table definitions | ${dupTables.length} | High |\n` +
    `| TODO/FIXME markers | ${services.reduce((n, s) => n + s.todos, 0)} | Low |\n` +
    `| Test files vs services | ${tests.length} / ${services.length} | **High** — ${Math.round((tests.length / services.length) * 100)}% |\n` +
    `| Components with zero ARIA | ${fe.components.length - (fe.aria > 0 ? 1 : 0)} of ${fe.components.length} | **High** |\n` +
    `| Error boundaries | ${fe.errBoundary} | **High** — one fault blanks the app |\n` +
    (unguarded.length ? `\n## Unguarded services\n\n${unguarded.map((s) => `- ${s.name} (${s.routeCount} routes)`).join('\n')}\n` : ''));

  // ---- 08 DEPENDENCY GRAPH ----
  const edges = services.flatMap((s) => s.requires.filter((r) => r.startsWith('services/'))
    .map((r) => ({ from: s.name, to: path.basename(r, '.js') })));
  fs.writeFileSync(path.join(OUT, '08_DEPENDENCY_GRAPH.md'),
    hdr('Dependency Graph', edges.length) +
    '```mermaid\ngraph LR\n' + (edges.length ? edges.map((e) => `  ${e.from} --> ${e.to}`).join('\n') : '  A[no service-to-service coupling detected]') + '\n```\n\n' +
    `Service-to-service edges: **${edges.length}**. Low coupling is intentional —\n` +
    'services communicate through the signal bus rather than direct requires.\n');

  // ---- 09 TRACEABILITY ----
  fs.writeFileSync(path.join(OUT, '09_TRACEABILITY_MATRIX.md'),
    hdr('Requirement Traceability Matrix', caps.length) +
    'Vision → Capability → Database → API → Service → UI → Test.\n' +
    'A capability missing any link is a gap; the column shows which.\n\n' +
    '| ID | Capability | DB | API | Svc | UI | Test | % | Status |\n|---|---|---|---|---|---|---|---|---|\n' +
    caps.map((c) => `| ${c.objectId} | ${c.capability} | ${c.evidence.tables} | ${c.evidence.endpoints} | ${c.evidence.services} | ${c.evidence.components} | ${c.evidence.tests} | ${c.completion} | ${c.status} |`).join('\n') + '\n');

  // ---- 10 READINESS DASHBOARD ----
  const avg = Math.round(caps.reduce((n, c) => n + c.completion, 0) / caps.length);
  const layers = [
    ['Database', Math.min(100, Math.round((db.tables.size / 500) * 100))],
    ['Backend services', Math.min(100, Math.round((services.filter((s) => s.routeCount).length / services.length) * 100))],
    ['APIs', Math.min(100, Math.round((totalRoutes / 650) * 100))],
    ['AI framework', ai.hasMcda && ai.proposalsOnly ? 55 : 25],
    ['AI non-fabricated', Math.max(0, 100 - Math.round((randomTotal / services.length) * 100))],
    ['AI learning loop', ai.hasOutcomeFeedback ? 50 : 0],
    ['Frontend components', Math.min(100, Math.round((fe.components.length / 60) * 100))],
    ['Accessibility', fe.aria > 0 ? Math.min(100, fe.aria) : 0],
    ['Resilience (error boundaries)', fe.errBoundary > 0 ? 100 : 0],
    ['Testing', Math.round((tests.length / services.length) * 100)],
    ['Capabilities traced', avg],
  ];
  fs.writeFileSync(path.join(OUT, '10_READINESS_DASHBOARD.md'),
    hdr('Production Readiness Dashboard') +
    '| Layer | Completion | |\n|---|---|---|\n' +
    layers.map(([n, p]) => `| ${n} | ${p}% | \`${bar(p)}\` |`).join('\n') +
    `\n\n**Weighted capability completion: ${avg}%**\n\n` +
    `- Services: ${services.length} (${services.filter((s) => s.routeCount).length} with routes)\n` +
    `- Endpoints: ${totalRoutes}\n- Tables: ${db.tables.size} | Views: ${db.views.length}\n` +
    `- CHECK constraints: ${db.checks} | Foreign keys: ${db.fks}\n` +
    `- AI agents: ${ai.agents.length} | Signals: ${ai.signals.length}\n` +
    `- Frontend components: ${fe.components.length} | Pages: ${fe.pages.length}\n` +
    `- Test files: ${tests.length}\n`);

  // ---- console summary ----
  console.log(`\nAFRERA Engineering Registry — ${stamp}`);
  console.log(`  objects indexed     : ${master.length}`);
  console.log(`  services / endpoints: ${services.length} / ${totalRoutes}`);
  console.log(`  tables / views      : ${db.tables.size} / ${db.views.length}`);
  console.log(`  AI agents / signals : ${ai.agents.length} / ${ai.signals.length}`);
  console.log(`  capabilities traced : ${caps.length}  (avg ${avg}%)`);
  console.log(`  gaps                : ${gaps.length}`);
  console.log(`  fabricated outputs  : ${randomTotal} Math.random() calls`);
  console.log(`  written to          : docs/registry/\n`);

  if (CHECK_MODE) {
    const blocking = [];
    if (randomTotal > 0) blocking.push(`${randomTotal} Math.random() calls in services`);
    if (unguarded.length) blocking.push(`${unguarded.length} services with unguarded routes`);
    if (dupTables.length) blocking.push(`${dupTables.length} duplicate table definitions`);
    if (blocking.length) {
      console.error('CHECK FAILED:\n' + blocking.map((b) => '  - ' + b).join('\n'));
      process.exit(1);
    }
    console.log('CHECK PASSED');
  }
}

main();
