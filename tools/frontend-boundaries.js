#!/usr/bin/env node
/**
 * AFRERA Frontend Wireframe & Boundary Enforcer
 * ==============================================
 *
 * Companion to tools/wireframe-boundaries.js (backend). The backend had
 * declared layers; the frontend had none, and it was hiding two real defects:
 *
 *   1. 30 files call fetch() directly instead of services/api.js — bypassing
 *      the axios instance that attaches the Authorization header and handles
 *      401 refresh. None of those 30 set an auth header themselves.
 *   2. 11 of 43 endpoints the frontend calls DO NOT EXIST in the backend.
 *      /banker, /ca, /government, /fpo, /research and /admin are not mounted
 *      at all. Six role dashboards fetch routes that were never built, and
 *      render empty with a console error nobody reads.
 *
 * A component diagram would show none of that. These rules do, and CI runs them.
 *
 * OUTPUT  docs/registry/19_FRONTEND_WIREFRAME.md
 *         docs/registry/20_FRONTEND_BOUNDARIES.md
 *         docs/registry/21_API_CONTRACT_DRIFT.md
 *
 * USAGE   node tools/frontend-boundaries.js
 *         node tools/frontend-boundaries.js --check
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FE = path.join(ROOT, 'frontend', 'src');
const BE = path.join(ROOT, 'backend', 'src');
const OUT = path.join(ROOT, 'docs', 'registry');
const CHECK = process.argv.includes('--check');

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

// ===========================================================================
// THE FRONTEND WIREFRAME — layers and permitted direction
// ===========================================================================

const FE_LAYERS = [
  { id: 'app',        dir: 'App.jsx',   owns: 'Routing, provider composition',
    mayImport: ['pages', 'components', 'store', 'services', 'hooks'] },
  { id: 'pages',      dir: 'pages',     owns: 'Route-level composition. Fetches, arranges, delegates.',
    mayImport: ['components', 'store', 'services', 'hooks'] },
  { id: 'components', dir: 'components', owns: 'Presentation and local interaction only',
    mayImport: ['components', 'store', 'hooks'] },
  { id: 'store',      dir: 'store',     owns: 'Cross-page state (zustand)',
    mayImport: ['services'] },
  { id: 'hooks',      dir: 'hooks',     owns: 'Reusable stateful logic',
    mayImport: ['services', 'store'] },
  { id: 'services',   dir: 'services',  owns: 'ALL network I/O. The only layer that talks to the API.',
    mayImport: [] },
];

const feLayer = (rel) => {
  const seg = rel.split('/')[0];
  return FE_LAYERS.find((l) => l.dir === seg)?.id || (rel === 'App.jsx' ? 'app' : 'other');
};

const FE_RULES = [
  {
    id: 'FE-01',
    rule: 'Network calls go through services/api.js — never raw fetch().',
    why: 'services/api.js attaches the Authorization header and handles 401 by '
       + 'refreshing the token. 30 files bypassed it with raw fetch() and NONE '
       + 'set an auth header. Against a guarded endpoint every one of those '
       + 'calls returns 401 and the screen renders empty.',
    severity: 'critical',
    detect: (src, rel) => (feLayer(rel) === 'services' ? 0 : count(src, /\bfetch\s*\(/g)),
  },
  {
    id: 'FE-02',
    rule: 'Components must not fetch. Pages fetch; components receive props.',
    why: 'A component that fetches cannot be reused on a screen that already '
       + 'has the data, and cannot be tested without mocking the network. It '
       + 'also produces N requests when rendered in a list.',
    severity: 'high',
    detect: (src, rel) => (feLayer(rel) === 'components'
      ? count(src, /\bfetch\s*\(|services\/api/g) : 0),
  },
  {
    id: 'FE-03',
    rule: 'Interactive elements need an accessible name.',
    why: 'A button whose only content is an icon is unlabelled to a screen '
       + 'reader. This platform ships a voice mode for low-literacy and '
       + 'low-vision farmers; unlabelled controls make that mode decorative.',
    severity: 'high',
    detect: (src) => {
      const iconOnly = count(src, /<button[^>]*>\s*\{?\s*<[A-Z]\w+[^>]*\/>\s*\}?\s*<\/button>/g);
      const labelled = count(src, /aria-label|aria-labelledby|sr-only/g);
      return Math.max(0, iconOnly - labelled);
    },
  },
  {
    id: 'FE-04',
    rule: 'Every route-level page needs an error boundary above it.',
    why: 'Without one, a single component throwing unmounts the whole React '
       + 'tree and the user sees a blank white page. On a rural connection '
       + 'with partial data this is not a rare path.',
    severity: 'high',
    detect: (src, rel) => (rel === 'App.jsx'
      ? (/ErrorBoundary/.test(src) ? 0 : 1) : 0),
  },
  {
    id: 'FE-05',
    rule: 'No hardcoded colour literals — use design tokens.',
    why: 'Two different greens both called "the brand green" already shipped '
       + 'once. Tokens are the single source of truth; a hex in a component '
       + 'silently forks it and does not follow dark mode.',
    severity: 'medium',
    detect: (src) => count(src, /#[0-9a-fA-F]{6}\b|rgb\(\s*\d+/g),
  },
  {
    id: 'FE-06',
    rule: 'A page fetching data must render a loading and an error state.',
    why: 'Otherwise a slow or failed request is indistinguishable from empty '
       + 'data. The user cannot tell "no orders" from "we could not load your '
       + 'orders", and will act on the wrong one.',
    severity: 'medium',
    detect: (src, rel) => {
      if (feLayer(rel) !== 'pages') return 0;
      const fetches = count(src, /\bfetch\s*\(|api\.(get|post|put|delete)/g);
      if (!fetches) return 0;
      const hasLoading = /loading|isLoading|isPending|Skeleton/i.test(src);
      const hasError = /error|isError|catch\s*\(/i.test(src);
      return (hasLoading && hasError) ? 0 : 1;
    },
  },
];

// ===========================================================================

function main() {
  const files = walk(FE, ['.jsx', '.js']).filter((p) => !/\.test\./.test(p));

  // --- backend route inventory, for contract drift ---
  const beRoutes = new Set();
  for (const p of walk(path.join(BE, 'services'), ['.js']).concat(walk(path.join(BE, 'routes'), ['.js']))) {
    for (const m of read(p).matchAll(/router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)/g)) {
      beRoutes.add(m[2]);
    }
  }
  // The backend mounts routers TWO ways: mountRoute() for services that export
  // a .router, and app.use() for the enhancement route files. Collecting only
  // mountRoute() left 12 prefixes invisible, so every call into them was
  // reported as drift — 11 false positives including the entire marketplace
  // reviews and GST surface, which plainly exist.
  const indexSrc = read(path.join(BE, 'index.js'));
  const mounts = [
    ...[...indexSrc.matchAll(/mountRoute\(\s*'([^']+)'/g)].map((m) => m[1]),
    ...[...indexSrc.matchAll(/app\.use\(\s*'(\/api\/[^']+)'/g)].map((m) => m[1]),
  ];

  const modules = files.map((p) => {
    const src = read(p);
    const rel = path.relative(FE, p).replace(/\\/g, '/');
    const calls = [...src.matchAll(/fetch\(\s*['"`](\/[^'"`?]+)/g)].map((m) => m[1]);
    const violations = FE_RULES.map((r) => ({ ...r, n: r.detect(src, rel) })).filter((r) => r.n > 0);
    return {
      name: path.basename(p),
      rel,
      layer: feLayer(rel),
      lines: src.split('\n').length,
      rawFetch: count(src, /\bfetch\s*\(/g),
      usesApiService: /services\/api|from ['"]\.\.\/services/.test(src),
      aria: count(src, /aria-[a-z]+/g),
      hexColours: count(src, /#[0-9a-fA-F]{6}\b/g),
      hasLoading: /loading|isLoading|Skeleton/i.test(src),
      calls,
      violations,
    };
  });

  // --- contract drift: frontend calls with no backend route ---
  //
  // Template literals must be normalised first. `/events/${productId}` is a
  // call to a PARAMETERISED route (`/events/:productId`) — comparing it as a
  // literal string reported 36 false positives, because no static backend
  // route can ever equal a string containing "${...}".
  const norm = (s) => s
    .replace(/\$\{[^}]*\}?/g, ':param')   // ${id} -> :param (unclosed too)
    .replace(/\/:[\w]+/g, '/:param')      // /:productId -> /:param
    .replace(/\/+$/, '');

  const beNorm = new Set([...beRoutes].map(norm));
  const allCalls = [...new Set(modules.flatMap((m) => m.calls))].filter((c) => c.startsWith('/api'));

  // Longest mount wins. `.find()` returned the FIRST match, so a call to
  // /api/v1/marketplace/... was stripped against a shorter prefix and the tail
  // never matched — reporting routes as missing that plainly exist.
  const mountsByLength = [...mounts].sort((a, b) => b.length - a.length);

  const drift = allCalls.filter((c) => {
    const mount = mountsByLength.find((mt) => c === mt || c.startsWith(mt + '/'));
    if (!mount) return true;                       // prefix not mounted at all
    const tail = norm(c.slice(mount.length) || '/');
    if (!tail || tail === '/') return false;
    return !(beNorm.has(tail)
      || beNorm.has(tail.replace(/\/:param$/, ''))
      // tolerate a trailing param the frontend supplies but the route names
      || [...beNorm].some((r) => r === tail || r.startsWith(tail + '/:param')));
  });

  fs.mkdirSync(OUT, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const hdr = (t) => `# ${t}\n\n**Generated:** ${stamp} by \`tools/frontend-boundaries.js\`\n` +
    `**Status:** DESCRIPTIVE — measured from source.\n**Do not edit by hand.**\n\n---\n\n`;

  const byLayer = {};
  modules.forEach((m) => { (byLayer[m.layer] = byLayer[m.layer] || []).push(m); });

  // ---- 19 WIREFRAME ----
  fs.writeFileSync(path.join(OUT, '19_FRONTEND_WIREFRAME.md'),
    hdr('Frontend Wireframe — layers and permitted dependencies') +
    '```\n' +
    '┌──────────────────────────────────────────────────────────────┐\n' +
    '│  App.jsx     routing · provider composition · ErrorBoundary  │\n' +
    '├──────────────────────────────────────────────────────────────┤\n' +
    '│  pages       route-level: fetch → arrange → delegate         │\n' +
    '├──────────────────────────────────────────────────────────────┤\n' +
    '│  components  presentation only. Receive props. Never fetch.  │\n' +
    '├───────────────────────────┬──────────────────────────────────┤\n' +
    '│  store (zustand)          │  hooks                           │\n' +
    '│  cross-page state         │  reusable stateful logic         │\n' +
    '├───────────────────────────┴──────────────────────────────────┤\n' +
    '│  services/api.js   THE ONLY LAYER THAT TALKS TO THE NETWORK  │\n' +
    '│  auth header · 401 refresh · baseURL · offline queue         │\n' +
    '└──────────────────────────────────────────────────────────────┘\n' +
    '\n   Anything calling fetch() outside services/ has silently opted out\n' +
    '   of authentication and token refresh.\n```\n\n' +
    '## Layers as built\n\n| Layer | Files | Owns | May import |\n|---|---|---|---|\n' +
    FE_LAYERS.map((l) => `| **${l.id}** | ${(byLayer[l.id] || []).length} | ${l.owns} | ${l.mayImport.join(', ') || '_nothing_'} |`).join('\n') +
    '\n\n## Rules\n\n' +
    FE_RULES.map((r) => `### ${r.id} — ${r.rule}\n\n**Severity:** ${r.severity}\n\n${r.why}\n`).join('\n') + '\n');

  // ---- 20 BOUNDARIES ----
  const allV = modules.flatMap((m) => m.violations.map((v) => ({ file: m.rel, ...v })));
  const byRule = {};
  allV.forEach((v) => { (byRule[v.id] = byRule[v.id] || []).push(v); });

  fs.writeFileSync(path.join(OUT, '20_FRONTEND_BOUNDARIES.md'),
    hdr('Frontend Boundary Violations') +
    `**Total: ${allV.length}** across ${new Set(allV.map((v) => v.file)).size} files ` +
    `(${modules.length} scanned).\n\n` +
    '| Rule | Severity | Files | Description |\n|---|---|---|---|\n' +
    FE_RULES.map((r) => `| ${r.id} | ${r.severity} | ${(byRule[r.id] || []).length} | ${r.rule} |`).join('\n') +
    '\n\n' +
    FE_RULES.filter((r) => byRule[r.id]).map((r) =>
      `## ${r.id} — ${r.rule}\n\n**${r.severity.toUpperCase()}.** ${r.why}\n\n` +
      byRule[r.id].slice(0, 40).map((v) => `- \`${v.file}\` — ${v.n}`).join('\n')
      + (byRule[r.id].length > 40 ? `\n- _…and ${byRule[r.id].length - 40} more_` : '')).join('\n\n') + '\n');

  // ---- 21 CONTRACT DRIFT ----
  fs.writeFileSync(path.join(OUT, '21_API_CONTRACT_DRIFT.md'),
    hdr('Frontend ↔ Backend API Contract Drift') +
    `The frontend calls **${allCalls.length}** distinct API endpoints by raw fetch().\n` +
    `**${drift.length}** have no matching backend route.\n\n` +
    'A call to a route that does not exist returns 404. The page renders empty\n' +
    'and logs to a console nobody is watching — so the screen looks "built"\n' +
    'while showing nothing. This is the most expensive kind of gap to find late.\n\n' +
    '## Endpoints with no backend route\n\n' +
    (drift.length ? drift.map((d) => `- \`${d}\``).join('\n') : '_none_') +
    '\n\n## Mounted API prefixes (backend)\n\n' +
    mounts.map((m) => `- \`${m}\``).join('\n') + '\n');

  // ---- console ----
  const crit = allV.filter((v) => v.severity === 'critical');
  console.log(`\nAFRERA Frontend Boundaries — ${stamp}`);
  console.log(`  files scanned    : ${modules.length}`);
  console.log(`  layers declared  : ${FE_LAYERS.length}`);
  console.log(`  VIOLATIONS       : ${allV.length}  (${crit.length} critical)`);
  FE_RULES.forEach((r) => {
    const n = (byRule[r.id] || []).length;
    if (n) console.log(`    ${r.id} ${r.severity.padEnd(8)} ${String(n).padStart(3)}  ${r.rule.slice(0, 50)}`);
  });
  console.log(`  API endpoints called : ${allCalls.length}`);
  console.log(`  CONTRACT DRIFT       : ${drift.length} endpoints with no backend route`);
  console.log(`  written to           : docs/registry/19..21\n`);

  if (CHECK && (crit.length || drift.length)) {
    console.error(`CHECK FAILED: ${crit.length} critical, ${drift.length} missing endpoints`);
    process.exit(1);
  }
}

main();
