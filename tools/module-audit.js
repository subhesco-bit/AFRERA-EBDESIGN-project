#!/usr/bin/env node
/**
 * AFRERA Per-Module Deep Audit
 * =============================
 *
 * Companion to tools/engineering-registry.js, which audits the system in
 * aggregate. This one audits MODULE BY MODULE, and answers four questions the
 * aggregate registry could not:
 *
 *   1. ERP COVERAGE      Which SAP-equivalent ERP domain does each module serve,
 *                        and which domains have no module at all?
 *   2. AI WITHIN MODULE  Not "how many modules" but how many AI applications
 *                        exist INSIDE each module — agents, forecasts, scoring,
 *                        decision rules — and which modules have none.
 *   3. NERVOUS SYSTEM    Is the module connected to the signal bus? Does it
 *                        emit (afferent/sensory), subscribe (efferent/motor),
 *                        or is it denervated — present but unable to
 *                        participate in system-wide reflexes?
 *   4. CONTROLS          Auth, admin gate, transactions, validation, audit
 *                        logging, error handling. A module with routes but no
 *                        controls is an open door.
 *
 * OUTPUT  docs/registry/11_MODULE_AUDIT.md
 *         docs/registry/12_ERP_COVERAGE.md
 *         docs/registry/13_NERVOUS_SYSTEM.md
 *         docs/registry/14_AI_APPLICATION_MAP.md
 *
 * USAGE   node tools/module-audit.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BE = path.join(ROOT, 'backend', 'src');
const OUT = path.join(ROOT, 'docs', 'registry');

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const count = (s, re) => (s.match(re) || []).length;

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

/** Strip comments so we never audit prose as if it were code. */
function codeOnly(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

// ---------------------------------------------------------------------------
// ERP DOMAIN MAP — SAP-equivalent modules, and what maps to each here
// ---------------------------------------------------------------------------

const ERP_DOMAINS = [
  { code: 'AF-FI',   name: 'Financial Accounting',        sap: 'FI',   match: /financial|accounting|payment|gst|wallet|offlinePayment/i },
  { code: 'AF-CO',   name: 'Controlling / Cost',          sap: 'CO',   match: /costing|profitab|margin/i },
  { code: 'AF-MM',   name: 'Materials Management',        sap: 'MM',   match: /procurement|purchas|vendor|supplier|institutionalProcurement/i },
  { code: 'AF-SD',   name: 'Sales & Distribution',        sap: 'SD',   match: /order|sales|marketplace|valueCommerce|merchandis|dynamicPricing/i },
  { code: 'AF-WM',   name: 'Warehouse Management',        sap: 'WM',   match: /inventory|warehouse|stock|shelfLife/i },
  { code: 'AF-TM',   name: 'Transport Management',        sap: 'TM',   match: /logistic|shipping|transport|freight|v42Intelligence/i },
  { code: 'AF-QM',   name: 'Quality Management',          sap: 'QM',   match: /quality|foodSafety|laboratoryERP|certification/i },
  { code: 'AF-PP',   name: 'Production Planning',         sap: 'PP',   match: /production|processing|manufactur|recipe/i },
  { code: 'AF-PM',   name: 'Plant Maintenance',           sap: 'PM',   match: /maintenance|asset|equipment|greenhouse|sharedInfra/i },
  { code: 'AF-AA',   name: 'Asset Accounting',            sap: 'AA',   match: /assetAccounting|depreciation/i },
  { code: 'AF-HCM',  name: 'Human Capital Management',    sap: 'HCM',  match: /hr|employee|labour|workforce|farmerTraining/i },
  { code: 'AF-PS',   name: 'Project Systems',             sap: 'PS',   match: /project|engineering|dpr/i },
  { code: 'AF-CS',   name: 'Customer Service',            sap: 'CS',   match: /support|ticket|complaint|conversationalAI/i },
  { code: 'AF-MDM',  name: 'Master Data Management',      sap: 'MDM',  match: /moduleCatalog|catalogIntelligence|product|form/i },
  { code: 'AF-SEC',  name: 'Governance / Risk / Compliance', sap: 'GRC', match: /audit|compliance|governance|enterpriseControl/i },
  { code: 'AF-CRM',  name: 'Customer Relationship Mgmt',  sap: 'CRM',  match: /enterpriseControl|crm/i },
  { code: 'AF-TR',   name: 'Treasury',                    sap: 'TR',   match: /treasury|cashflow|escrow|subsidy/i },
  { code: 'AF-AGRI', name: 'Agronomy (AFRERA-specific)',  sap: '—',    match: /soil|crop|organic|biodiversity|agri|nutrition|giIntelligence|indigenous/i },
];

// ---------------------------------------------------------------------------
// AI APPLICATION DETECTORS — what counts as an AI application inside a module
// ---------------------------------------------------------------------------

const AI_KINDS = [
  { kind: 'Registered agent',    re: /erpAgents|AGENTS\b/ },
  { kind: 'Forecasting',         re: /\bholt\b|forecast|movingAverage|seasonalIndex|trend\(/i },
  { kind: 'Scoring / ranking',   re: /score|ranking|weight.*criteria|rank\(/i },
  { kind: 'MCDA decision',       re: /\bmcda\b/i },
  { kind: 'Statistics (tested)', re: /utils\/statistics/ },
  { kind: 'Anomaly / outlier',   re: /anomal|outlier|deviation|zscore|z_score/i },
  { kind: 'Recommendation',      re: /recommend/i },
  { kind: 'Classification',      re: /classif|categoris|categoriz/i },
  { kind: 'NLP / language',      re: /translat|sentiment|nlp|tokeni[sz]/i },
  { kind: 'Vision',              re: /image.*(detect|classif)|vision/i },
  { kind: 'Signal correlation',  re: /decisionEngine/ },
];

// ---------------------------------------------------------------------------
// CONTROL DETECTORS — what a production module must have
// ---------------------------------------------------------------------------

const CONTROLS = [
  { key: 'auth',      label: 'Authentication', re: /authMiddleware/ },
  { key: 'admin',     label: 'Admin gate',     re: /adminMiddleware/ },
  { key: 'txn',       label: 'Transactions',   re: /BEGIN['"`]|\bCOMMIT\b/ },
  { key: 'validate',  label: 'Input validation', re: /throw new Error\(|!Number\.isFinite|zod|joi\./ },
  { key: 'errors',    label: 'Error handling', re: /try\s*\{|catch\s*\(/ },
  { key: 'logging',   label: 'Logging',        re: /logger\.(info|warn|error)/ },
  { key: 'rateLimit', label: 'Rate limiting',  re: /rateLimit|rateLimiter/ },
];

// ---------------------------------------------------------------------------

function auditModules() {
  const files = walk(path.join(BE, 'services'), ['.js'])
    .concat(walk(path.join(BE, 'routes'), ['.js']));

  return files.map((p) => {
    const raw = read(p);
    const src = codeOnly(raw);
    const name = path.basename(p, '.js');

    const routes = [...src.matchAll(/router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)/g)]
      .map((m) => `${m[1].toUpperCase()} ${m[2]}`);

    // --- Math.random() classification ---
    // NOT all random() is fabricated analysis. Generating an ID or a code is a
    // legitimate use. Fabricating a score, forecast or confidence is not.
    // Conflating them overstated the debt and would have sent someone to
    // "fix" correct code.
    // Scan CODE lines only. Scanning raw text flagged a comment that read
    // "Previously returned Math.random() values. Now performs real Holt
    // linear" — i.e. documentation of a fix, reported as the defect it fixed.
    const codeLineSet = new Set(codeOnly(raw).split('\n').map((l) => l.trim()).filter(Boolean));
    const randomLines = raw.split('\n')
      .map((l, i) => ({ n: i + 1, l }))
      .filter((x) => /Math\.random\(\)/.test(x.l) && codeLineSet.has(x.l.trim()));

    // Legitimate: generating an identifier, code, hash, nonce or padded serial.
    const isIdGen = (l) => /toString\(\s*(16|36)\s*\)|\bid\b|_id|code|uuid|token|nonce|salt|hash|serial|padStart|reference/i.test(l);
    const idGen = randomLines.filter((x) => isIdGen(x.l));
    const suspect = randomLines.filter((x) => !isIdGen(x.l));

    const aiApps = AI_KINDS.filter((k) => k.re.test(src)).map((k) => k.kind);

    const controls = {};
    CONTROLS.forEach((c) => { controls[c.key] = c.re.test(src); });

    const erp = ERP_DOMAINS.filter((d) => d.match.test(name)).map((d) => d.code);

    return {
      name,
      file: path.relative(ROOT, p).replace(/\\/g, '/'),
      lines: raw.split('\n').length,
      routes,
      routeCount: routes.length,
      erp,
      aiApps,
      aiCount: aiApps.length,
      // Nervous system: emit = afferent (sensory), subscribe = efferent (motor)
      // emitSignal() is the real API. A bare signalBus.emit({...}) is raw
      // EventEmitter and publishes an event literally named "[object Object]",
      // so no subscriber ever receives it. The old detector matched both and
      // scored 4 modules as connected when 2 of them were silently broken.
      emits: count(src, /signalBus\.emitSignal\s*\(/g),
      badEmits: count(src, /signalBus\.emit\s*\(\s*\{/g),
      // The bus exposes onSignal(), not on()/subscribe(). Matching the wrong
      // method name reported ZERO subscribers repo-wide, which would have led
      // someone to conclude the nervous system had no efferent path at all.
      subscribes: count(src, /signalBus\.(onSignal|on|subscribe)\b/g),
      controls,
      controlScore: Object.values(controls).filter(Boolean).length,
      randomTotal: randomLines.length,
      randomIdGen: idGen.length,
      randomSuspect: suspect.length,
      suspectLines: suspect.map((x) => ({ n: x.n, code: x.l.trim().slice(0, 90) })),
    };
  });
}

function main() {
  const mods = auditModules().sort((a, b) => b.routeCount - a.routeCount);
  fs.mkdirSync(OUT, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const hdr = (t) => `# ${t}\n\n**Generated:** ${stamp} by \`tools/module-audit.js\`\n` +
    `**Status:** DESCRIPTIVE — read from source, comments stripped before analysis.\n` +
    `**Do not edit by hand.**\n\n---\n\n`;

  const totalRoutes = mods.reduce((n, m) => n + m.routeCount, 0);
  const susTotal = mods.reduce((n, m) => n + m.randomSuspect, 0);
  const idTotal = mods.reduce((n, m) => n + m.randomIdGen, 0);

  // ---- 11 MODULE AUDIT ----
  fs.writeFileSync(path.join(OUT, '11_MODULE_AUDIT.md'),
    hdr('Per-Module Deep Audit') +
    `**Modules:** ${mods.length} · **Endpoints:** ${totalRoutes} · ` +
    `**AI applications:** ${mods.reduce((n, m) => n + m.aiCount, 0)}\n\n` +
    '## Control matrix\n\n' +
    'Auth · Adm(in) · Txn · Val(idation) · Err · Log · RL(rate limit). ' +
    'Score is out of 7.\n\n' +
    '| Module | Lines | Rts | ERP | AI | Emit | Sub | Auth | Adm | Txn | Val | Err | Log | RL | Score |\n' +
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n' +
    mods.map((m) => {
      const c = m.controls;
      const t = (b) => (b ? '✓' : '·');
      return `| ${m.name} | ${m.lines} | ${m.routeCount} | ${m.erp.join(' ') || '—'} | ${m.aiCount || '·'} | ` +
        `${m.emits || '·'} | ${m.subscribes || '·'} | ${t(c.auth)} | ${t(c.admin)} | ${t(c.txn)} | ` +
        `${t(c.validate)} | ${t(c.errors)} | ${t(c.logging)} | ${t(c.rateLimit)} | **${m.controlScore}/7** |`;
    }).join('\n') +
    '\n\n## Modules with routes but weak controls (score < 4)\n\n' +
    (mods.filter((m) => m.routeCount > 0 && m.controlScore < 4)
      .map((m) => `- **${m.name}** — ${m.routeCount} routes, ${m.controlScore}/7 controls, ` +
        `missing: ${CONTROLS.filter((c) => !m.controls[c.key]).map((c) => c.label).join(', ')}`)
      .join('\n') || '_none_') + '\n');

  // ---- 12 ERP COVERAGE ----
  const erpRows = ERP_DOMAINS.map((d) => {
    const owned = mods.filter((m) => m.erp.includes(d.code));
    return {
      ...d, modules: owned.map((m) => m.name),
      routes: owned.reduce((n, m) => n + m.routeCount, 0),
      ai: owned.reduce((n, m) => n + m.aiCount, 0),
    };
  });
  fs.writeFileSync(path.join(OUT, '12_ERP_COVERAGE.md'),
    hdr('ERP Domain Coverage') +
    'Each AFRERA domain against its SAP equivalent. A domain with zero modules\n' +
    'is an ERP function the platform cannot perform at all.\n\n' +
    '| Code | Domain | SAP | Modules | Endpoints | AI apps | Status |\n|---|---|---|---|---|---|---|\n' +
    erpRows.map((r) => `| ${r.code} | ${r.name} | ${r.sap} | ${r.modules.length} | ${r.routes} | ${r.ai} | ` +
      `${r.modules.length === 0 ? '**MISSING**' : r.routes === 0 ? 'No endpoints' : r.ai === 0 ? 'No AI' : 'Covered'} |`).join('\n') +
    '\n\n## Domain detail\n\n' +
    erpRows.map((r) => `### ${r.code} — ${r.name}\n\n` +
      (r.modules.length ? r.modules.map((m) => `- ${m}`).join('\n') : '_No module serves this domain._')).join('\n\n') + '\n');

  // ---- 13 NERVOUS SYSTEM ----
  const emitters = mods.filter((m) => m.emits > 0);
  const listeners = mods.filter((m) => m.subscribes > 0);
  const denervated = mods.filter((m) => m.emits === 0 && m.subscribes === 0 && m.routeCount > 0);
  fs.writeFileSync(path.join(OUT, '13_NERVOUS_SYSTEM.md'),
    hdr('Nervous System Audit') +
    'The signal bus (`core/signalBus.js`) is the platform\'s nervous system.\n' +
    'A module that neither emits nor subscribes is **denervated** — it works in\n' +
    'isolation but cannot participate in any system-wide reflex. A temperature\n' +
    'breach in such a module reaches no one.\n\n' +
    `| | Count |\n|---|---|\n` +
    `| Afferent (sensory — emit signals) | **${emitters.length}** |\n` +
    `| Efferent (motor — subscribe) | **${listeners.length}** |\n` +
    `| Denervated (routes, no bus) | **${denervated.length}** |\n` +
    `| **Broken emits (signalBus.emit instead of emitSignal)** | **${mods.reduce((n, m) => n + m.badEmits, 0)}** |\n` +
    `| Total modules | ${mods.length} |\n\n` +
    `**Innervation: ${Math.round(((emitters.length + listeners.length) / mods.length) * 100)}%**\n\n` +
    '## Afferent — modules that sense\n\n' +
    (emitters.map((m) => `- **${m.name}** — ${m.emits} emit(s)`).join('\n') || '_none_') +
    '\n\n## Efferent — modules that act on signals\n\n' +
    (listeners.map((m) => `- **${m.name}** — ${m.subscribes} subscription(s)`).join('\n') || '_none_') +
    '\n\n## Denervated — live routes, no nervous connection\n\n' +
    (denervated.map((m) => `- ${m.name} (${m.routeCount} routes)`).join('\n') || '_none_') + '\n');

  // ---- 14 AI APPLICATION MAP ----
  const withAI = mods.filter((m) => m.aiCount > 0).sort((a, b) => b.aiCount - a.aiCount);
  const noAI = mods.filter((m) => m.aiCount === 0 && m.routeCount > 0);
  fs.writeFileSync(path.join(OUT, '14_AI_APPLICATION_MAP.md'),
    hdr('AI Application Map — applications WITHIN each module') +
    'The question is not how many modules exist, but how many AI applications\n' +
    'operate inside each one.\n\n' +
    `- Modules with at least one AI application: **${withAI.length} / ${mods.length}**\n` +
    `- Total AI applications: **${mods.reduce((n, m) => n + m.aiCount, 0)}**\n` +
    `- Modules with routes and NO AI: **${noAI.length}**\n\n` +
    '## Randomness review list — NOT a verdict\n\n' +
    'An earlier audit reported 37 `Math.random()` calls as "fabricated AI".\n' +
    'That was wrong three times over: most are legitimate ID generation, one was\n' +
    'a COMMENT documenting a past fix, and one was a padded policy serial.\n\n' +
    '**Automated classification of random() intent is unreliable.** This section\n' +
    'lists calls for HUMAN REVIEW with the source line shown, rather than\n' +
    'asserting fabrication. Judge each on the line, not on the count.\n\n' +
    `| Use | Count |\n|---|---|\n| Matches ID/code/hash/serial patterns (likely fine) | ${idTotal} |\n` +
    `| **Needs review** | **${susTotal}** |\n\n` +
    (susTotal ? '### For review — file, line, and the actual code\n\n' +
      mods.filter((m) => m.randomSuspect > 0)
        .map((m) => `**${m.file}**\n\n` + m.suspectLines
          .map((x) => `- L${x.n}: \`${x.code}\``).join('\n')).join('\n\n') + '\n\n' : '') +
    '## AI applications per module\n\n' +
    '| Module | Count | Applications |\n|---|---|---|\n' +
    withAI.map((m) => `| ${m.name} | ${m.aiCount} | ${m.aiApps.join(', ')} |`).join('\n') +
    '\n\n## Modules with endpoints but no AI\n\n' +
    (noAI.map((m) => `- ${m.name} (${m.routeCount} routes)`).join('\n') || '_none_') + '\n');

  console.log(`\nAFRERA Per-Module Audit — ${stamp}`);
  console.log(`  modules              : ${mods.length}`);
  console.log(`  endpoints            : ${totalRoutes}`);
  console.log(`  AI applications      : ${mods.reduce((n, m) => n + m.aiCount, 0)} across ${withAI.length} modules`);
  console.log(`  ERP domains covered  : ${erpRows.filter((r) => r.modules.length).length}/${ERP_DOMAINS.length}`);
  console.log(`  ERP domains MISSING  : ${erpRows.filter((r) => !r.modules.length).map((r) => r.code).join(', ') || 'none'}`);
  console.log(`  nervous system       : ${emitters.length} afferent, ${listeners.length} efferent, ${denervated.length} denervated`);
  console.log(`  random(): ${idTotal} likely-fine ID-gen, ${susTotal} need human review`);
  console.log(`  weak controls (<4/7) : ${mods.filter((m) => m.routeCount > 0 && m.controlScore < 4).length} modules`);
  console.log(`  written to           : docs/registry/11..14\n`);
}

main();
