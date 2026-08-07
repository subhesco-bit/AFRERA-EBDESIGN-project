#!/usr/bin/env node
/**
 * AFRERA System Wireframe & Boundary Enforcer
 * ============================================
 *
 * The audit found the system had no declared boundaries. Without them:
 *
 *   - 39 services each construct their own `new Pool()`. At pg's default of
 *     10 connections that is 390, plus the shared pool's 20 = 410 against a
 *     PostgreSQL whose default max_connections is 100. The system is
 *     oversubscribed 4x and will exhaust connections under load.
 *   - Nothing declares which layer may call which, so drift is invisible
 *     until something breaks.
 *   - No module states what it OWNS, so two modules writing the same table is
 *     discovered only when the data is already wrong.
 *
 * A diagram cannot prevent any of that. A declared boundary that CI checks can.
 * This file is therefore both the wireframe AND the enforcement.
 *
 * OUTPUT  docs/registry/15_SYSTEM_WIREFRAME.md    layers + allowed dependencies
 *         docs/registry/16_MODULE_BOUNDARIES.md   per-module boundary card
 *         docs/registry/17_BOUNDARY_VIOLATIONS.md what actually breaks the rules
 *         docs/registry/18_MODULE_COMPLETENESS.md missing / partial / complete
 *
 * USAGE   node tools/wireframe-boundaries.js
 *         node tools/wireframe-boundaries.js --check   (non-zero on violations)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BE = path.join(ROOT, 'backend', 'src');
const OUT = path.join(ROOT, 'docs', 'registry');
const CHECK = process.argv.includes('--check');

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const count = (s, re) => (s.match(re) || []).length;
const codeOnly = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

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

// ===========================================================================
// THE WIREFRAME — declared layers and the ONLY permitted dependency direction
//
// Dependencies flow DOWNWARD only. A lower layer must never import an upper
// one; that is what turns a layered system into a ball of mud.
// ===========================================================================

const LAYERS = [
  { id: 'entry',      dir: 'index.js',   rank: 0, owns: 'Process boot, route mounting, socket server',
    mayImport: ['routes', 'services', 'core', 'middleware', 'utils', 'database'] },
  { id: 'routes',     dir: 'routes',     rank: 1, owns: 'HTTP shape only — parse, validate, delegate',
    mayImport: ['services', 'middleware', 'utils', 'core'] },
  { id: 'services',   dir: 'services',   rank: 2, owns: 'Business logic and its own tables',
    mayImport: ['core', 'middleware', 'utils', 'database'] },
  { id: 'core',       dir: 'core',       rank: 3, owns: 'Nervous system, decision engine, agents, MCDA',
    mayImport: ['utils'] },
  { id: 'middleware', dir: 'middleware', rank: 3, owns: 'Cross-cutting request concerns',
    mayImport: ['utils', 'services'] },
  { id: 'database',   dir: 'database',   rank: 4, owns: 'Connection pooling and migrations',
    mayImport: ['utils'] },
  { id: 'utils',      dir: 'utils',      rank: 5, owns: 'Pure functions, no I/O, no state',
    mayImport: [] },
];

const layerOf = (rel) => {
  const seg = rel.split('/')[0];
  return LAYERS.find((l) => l.dir === seg)?.id || (rel === 'index.js' ? 'entry' : 'unknown');
};

// ===========================================================================
// BOUNDARY RULES — each is CI-checkable, and each states its consequence
// ===========================================================================

const RULES = [
  {
    id: 'BR-01',
    rule: 'A service must not construct its own database Pool.',
    why: '39 services each build a Pool. At pg\'s default of 10 connections that '
       + 'is 390 + the shared pool\'s 20 = 410, against a PostgreSQL default '
       + 'max_connections of 100. Under load the 101st request fails and every '
       + 'module blames a different one. Use database/connection.js.',
    severity: 'critical',
    // Scoped to services/ and routes/. database/connection.js is SUPPOSED to
    // build the pool, and migrate.js / seed.js are standalone scripts that run
    // outside the app process. Flagging them was a false positive in this rule.
    detect: (src, rel) => (/^(services|routes)\//.test(rel) ? count(src, /new Pool\s*\(/g) : 0),
  },
  {
    id: 'BR-02',
    rule: 'core/ must not import services/.',
    why: 'The nervous system and decision engine must stay usable without the '
       + 'organs. Importing upward makes core untestable in isolation and '
       + 'creates require cycles that surface as undefined-at-load bugs.',
    severity: 'high',
    detect: (src, rel) => (layerOf(rel) === 'core' ? count(src, /require\(['"]\.\.\/services\//g) : 0),
  },
  {
    id: 'BR-03',
    rule: 'utils/ must import nothing from the application.',
    why: 'Utilities are the only layer safe to unit-test with no setup. Any '
       + 'import makes them stateful and drags the whole app into their tests.',
    severity: 'high',
    detect: (src, rel) => (layerOf(rel) === 'utils' ? count(src, /require\(['"]\.\.\/(services|routes|core|database|middleware)\//g) : 0),
  },
  {
    id: 'BR-04',
    rule: 'A service must not import another service directly.',
    why: 'Direct calls create a hidden dependency graph that no one maintains. '
       + 'Cross-module communication belongs on the signal bus, which is '
       + 'observable, auditable and does not couple deployment.',
    severity: 'medium',
    detect: (src, rel) => (layerOf(rel) === 'services' ? count(src, /require\(['"]\.\.\/services\//g) : 0),
  },
  {
    id: 'BR-05',
    rule: 'Routes must not contain SQL.',
    why: 'SQL in a route means business logic is in the HTTP layer, where it '
       + 'cannot be reused, tested without a request, or found by anyone '
       + 'looking in services/.',
    severity: 'medium',
    detect: (src, rel) => (layerOf(rel) === 'routes'
      ? count(src, /\b(SELECT|INSERT INTO|UPDATE\s+\w+\s+SET|DELETE FROM)\b/gi) : 0),
  },
  {
    id: 'BR-06',
    rule: 'A module with write endpoints must guard them.',
    why: 'An unguarded POST/PUT/DELETE is an open door. This was already found '
       + 'once — 78 unauthenticated write endpoints across 20 services.',
    severity: 'critical',
    // Rate limiting counts as a guard. Authentication endpoints (/login,
    // /verify, OTP /initiate) CANNOT require authMiddleware — you cannot be
    // logged in before you log in. Demanding it there was wrong; the correct
    // control for an unauthenticated POST is a throttle, and an unthrottled
    // OTP endpoint is an SMS-bombing and cost-attack vector.
    detect: (src) => {
      const writes = count(src, /router\.(post|put|patch|delete)\(/g);
      const guards = count(src, /authMiddleware|adminMiddleware|authRateLimit|strictRateLimit|rateLimiter/g);
      return writes > 0 && guards === 0 ? writes : 0;
    },
  },
  {
    id: 'BR-07',
    rule: 'Signals must be published with emitSignal(), never emit().',
    why: 'signalBus.emit({...}) is raw EventEmitter and publishes an event named '
       + '"[object Object]". No subscriber receives it. Four call sites did '
       + 'this and appeared connected in every audit.',
    severity: 'critical',
    detect: (src) => count(src, /signalBus\.emit\s*\(\s*\{/g),
  },
  {
    id: 'BR-08',
    rule: 'Multi-statement writes must run in a transaction.',
    why: 'Two INSERTs without BEGIN/COMMIT can half-succeed. In an accounting '
       + 'or inventory context that leaves the books wrong with no error.',
    severity: 'high',
    detect: (src) => {
      const writes = count(src, /\b(INSERT INTO|UPDATE\s+\w+\s+SET|DELETE FROM)\b/gi);
      const txn = count(src, /BEGIN|COMMIT/g);
      return writes >= 3 && txn === 0 ? writes : 0;
    },
  },
];

// ===========================================================================
// COMPLETENESS — is a module missing, partial, or complete?
// ===========================================================================

function classify(m) {
  // A file explicitly marked dead is not an incomplete module — it is a
  // decision already taken. Reporting it as "Skeleton" invites someone to
  // finish it, which is the opposite of what the marking says.
  if (m.markedDead) return { status: 'Dead code (marked)', reasons: ['explicitly marked; do not complete'] };

  // Small is not the same as incomplete. middleware/admin.js is 27 lines
  // because checking a role IS 27 lines of work. Line count alone flagged
  // four correct files as skeletons.
  if (m.layer === 'middleware' || m.layer === 'utils') {
    if (m.exports > 0 && m.hasErrorHandling) return { status: 'Complete', reasons: [] };
  }

  const reasons = [];
  if (m.lines < 60 && m.exports === 0) reasons.push('very small and exports nothing');
  if (m.routeCount === 0 && m.exports === 0) reasons.push('no routes and no exports');
  if (m.routeCount > 0 && !m.hasErrorHandling) reasons.push('routes without try/catch');
  if (m.writeRoutes > 0 && !m.hasValidation) reasons.push('writes without validation');
  if (m.stubs > 0) reasons.push(`${m.stubs} stub/TODO marker(s)`);
  if (m.emptyHandlers > 0) reasons.push(`${m.emptyHandlers} empty handler(s)`);
  if (m.routeCount > 0 && !m.hasTests) reasons.push('no test file');

  let status;
  if (m.lines < 60 && m.routeCount === 0) status = 'Skeleton';
  else if (m.stubs > 0 || m.emptyHandlers > 0) status = 'Partially written';
  else if (reasons.length >= 3) status = 'Partially written';
  else if (reasons.length > 0) status = 'Complete with gaps';
  else status = 'Complete';

  return { status, reasons };
}

// ===========================================================================

function main() {
  const files = [
    ...walk(path.join(BE, 'services'), ['.js']),
    ...walk(path.join(BE, 'routes'), ['.js']),
    ...walk(path.join(BE, 'core'), ['.js']),
    ...walk(path.join(BE, 'utils'), ['.js']),
    ...walk(path.join(BE, 'middleware'), ['.js']),
    ...walk(path.join(BE, 'database'), ['.js']),
  ];
  const testNames = new Set(
    walk(path.join(BE, 'tests'), ['.test.js']).map((p) => path.basename(p, '.test.js').toLowerCase())
  );

  const modules = files.map((p) => {
    const raw = read(p);
    const src = codeOnly(raw);
    const rel = path.relative(BE, p).replace(/\\/g, '/');
    const name = path.basename(p, '.js');

    const imports = [...src.matchAll(/require\(['"]\.\.?\/([\w/-]+)['"]\)/g)]
      .map((m) => m[1]).filter((x) => !x.startsWith('.'));

    const violations = RULES
      .map((r) => ({ ...r, n: r.detect(src, rel) }))
      .filter((r) => r.n > 0);

    const tables = [...new Set([...src.matchAll(/(?:FROM|INTO|UPDATE|JOIN)\s+([a-z_][a-z0-9_]{3,})/gi)]
      .map((m) => m[1].toLowerCase())
      .filter((t) => !['select', 'where', 'values', 'table', 'exists'].includes(t)))];

    const m = {
      name, rel, layer: layerOf(rel),
      lines: raw.split('\n').length,
      routeCount: count(src, /router\.(get|post|put|patch|delete)\(/g),
      writeRoutes: count(src, /router\.(post|put|patch|delete)\(/g),
      exports: count(src, /^\s*(module\.exports|exports\.)/gm),
      imports,
      importsByLayer: [...new Set(imports.map((i) => layerOf(i)))].filter((l) => l !== 'unknown'),
      hasErrorHandling: /catch\s*\(/.test(src),
      hasValidation: /throw new Error\(|!Number\.isFinite|zod|joi\.|typeof .* !==/.test(src),
      hasTests: testNames.has(name.toLowerCase()),
      stubs: count(src, /\b(TODO|FIXME|not implemented|NotImplemented)\b/gi),
      markedDead: /DEAD CODE — DO NOT USE|ORPHAN STUB/.test(raw),
      emptyHandlers: count(src, /=>\s*\{\s*\}/g),
      tables: tables.slice(0, 12),
      violations,
    };
    return { ...m, ...classify(m) };
  });

  fs.mkdirSync(OUT, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const hdr = (t) => `# ${t}\n\n**Generated:** ${stamp} by \`tools/wireframe-boundaries.js\`\n` +
    `**Status:** DESCRIPTIVE — measured from source, comments stripped.\n**Do not edit by hand.**\n\n---\n\n`;

  // ---- 15 SYSTEM WIREFRAME ----
  const byLayer = {};
  modules.forEach((m) => { (byLayer[m.layer] = byLayer[m.layer] || []).push(m); });

  fs.writeFileSync(path.join(OUT, '15_SYSTEM_WIREFRAME.md'),
    hdr('System Wireframe — layers and permitted dependencies') +
    '## The rule\n\nDependencies flow **downward only**. A lower layer importing an upper one\n' +
    'is what turns a layered system into a ball of mud, and it is checkable.\n\n' +
    '```\n' +
    '┌─────────────────────────────────────────────────────────────┐\n' +
    '│  entry      index.js — boot, mount, sockets                 │\n' +
    '├─────────────────────────────────────────────────────────────┤\n' +
    '│  routes     HTTP shape only: parse → validate → delegate    │\n' +
    '├─────────────────────────────────────────────────────────────┤\n' +
    '│  services   business logic; each owns its own tables        │\n' +
    '├──────────────────────────┬──────────────────────────────────┤\n' +
    '│  core                    │  middleware                      │\n' +
    '│  bus · engine · agents   │  auth · admin · rate limit       │\n' +
    '├──────────────────────────┴──────────────────────────────────┤\n' +
    '│  database   ONE pool. Never construct another.              │\n' +
    '├─────────────────────────────────────────────────────────────┤\n' +
    '│  utils      pure functions — no I/O, no state, no imports   │\n' +
    '└─────────────────────────────────────────────────────────────┘\n' +
    '\n  Cross-service communication does NOT go sideways.\n' +
    '  It goes through core/signalBus → effectors.\n```\n\n' +
    '## Layers as built\n\n| Layer | Files | Owns | May import |\n|---|---|---|---|\n' +
    LAYERS.map((l) => `| **${l.id}** | ${(byLayer[l.id] || []).length} | ${l.owns} | ${l.mayImport.join(', ') || '_nothing_'} |`).join('\n') +
    '\n\n## Boundary rules (all CI-checkable)\n\n' +
    RULES.map((r) => `### ${r.id} — ${r.rule}\n\n**Severity:** ${r.severity}\n\n${r.why}\n`).join('\n') + '\n');

  // ---- 16 MODULE BOUNDARIES ----
  fs.writeFileSync(path.join(OUT, '16_MODULE_BOUNDARIES.md'),
    hdr('Module Boundary Cards') +
    'One card per module: what it owns, what it imports, whether it stays inside\n' +
    'its layer.\n\n' +
    modules.filter((m) => m.layer === 'services' || m.layer === 'core')
      .sort((a, b) => b.routeCount - a.routeCount)
      .map((m) => `### ${m.name}  \`${m.rel}\`\n\n` +
        `| | |\n|---|---|\n| Layer | ${m.layer} |\n| Lines | ${m.lines} |\n` +
        `| Endpoints | ${m.routeCount} (${m.writeRoutes} write) |\n` +
        `| Imports layers | ${m.importsByLayer.join(', ') || '_none_'} |\n` +
        `| Tables touched | ${m.tables.join(', ') || '_none detected_'} |\n` +
        `| Status | **${m.status}** |\n` +
        `| Boundary violations | ${m.violations.length ? m.violations.map((v) => v.id).join(', ') : '_none_'} |\n`)
      .join('\n') + '\n');

  // ---- 17 VIOLATIONS ----
  const allV = modules.flatMap((m) => m.violations.map((v) => ({ module: m.name, rel: m.rel, ...v })));
  const byRule = {};
  allV.forEach((v) => { (byRule[v.id] = byRule[v.id] || []).push(v); });

  fs.writeFileSync(path.join(OUT, '17_BOUNDARY_VIOLATIONS.md'),
    hdr('Boundary Violations') +
    `**Total: ${allV.length}** across ${new Set(allV.map((v) => v.module)).size} modules.\n\n` +
    '| Rule | Severity | Count | Description |\n|---|---|---|---|\n' +
    RULES.map((r) => `| ${r.id} | ${r.severity} | ${(byRule[r.id] || []).length} | ${r.rule} |`).join('\n') +
    '\n\n' +
    RULES.filter((r) => byRule[r.id]).map((r) =>
      `## ${r.id} — ${r.rule}\n\n**${r.severity.toUpperCase()}.** ${r.why}\n\n` +
      byRule[r.id].map((v) => `- \`${v.rel}\` — ${v.n} occurrence(s)`).join('\n')).join('\n\n') + '\n');

  // ---- 18 COMPLETENESS ----
  const buckets = {};
  modules.forEach((m) => { (buckets[m.status] = buckets[m.status] || []).push(m); });

  fs.writeFileSync(path.join(OUT, '18_MODULE_COMPLETENESS.md'),
    hdr('Module Completeness — missing, partial, complete') +
    '| Status | Count |\n|---|---|\n' +
    Object.entries(buckets).sort((a, b) => b[1].length - a[1].length)
      .map(([k, v]) => `| ${k} | **${v.length}** |`).join('\n') +
    `\n| **Total** | ${modules.length} |\n\n` +
    Object.entries(buckets).sort((a, b) => b[1].length - a[1].length).map(([status, list]) =>
      `## ${status} (${list.length})\n\n| Module | Layer | Lines | Rts | Why |\n|---|---|---|---|---|\n` +
      list.sort((a, b) => b.routeCount - a.routeCount)
        .map((m) => `| ${m.name} | ${m.layer} | ${m.lines} | ${m.routeCount} | ${m.reasons.join('; ') || '—'} |`).join('\n'))
      .join('\n\n') + '\n');

  // ---- console ----
  const crit = allV.filter((v) => v.severity === 'critical');
  console.log(`\nAFRERA Wireframe & Boundaries — ${stamp}`);
  console.log(`  modules analysed     : ${modules.length}`);
  console.log(`  layers declared      : ${LAYERS.length}`);
  console.log(`  boundary rules       : ${RULES.length}`);
  console.log(`  VIOLATIONS           : ${allV.length}  (${crit.length} critical)`);
  RULES.forEach((r) => {
    const n = (byRule[r.id] || []).length;
    if (n) console.log(`    ${r.id} ${r.severity.padEnd(8)} ${String(n).padStart(3)}  ${r.rule.slice(0, 52)}`);
  });
  console.log('  completeness:');
  Object.entries(buckets).sort((a, b) => b[1].length - a[1].length)
    .forEach(([k, v]) => console.log(`    ${k.padEnd(22)} ${v.length}`));
  console.log(`  written to           : docs/registry/15..18\n`);

  if (CHECK && crit.length) {
    console.error(`CHECK FAILED: ${crit.length} critical boundary violation(s)`);
    process.exit(1);
  }
}

main();
