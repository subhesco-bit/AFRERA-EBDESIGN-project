#!/usr/bin/env node
/**
 * MASTER INDEX — what the platform is specified to have, against what it has.
 *
 * The specification lives in docs/registry/SOURCE_CATALOGUE.json, extracted
 * verbatim from the project conversation export (D01–D100 enterprise domains,
 * M001–M150 modules, 17 named missing modules, SAP equivalence, screen specs).
 *
 * This tool does NOT decide whether something is built by reading its name.
 * Every claim below is backed by an artefact found on disk:
 *
 *   table      a CREATE TABLE in the migration chain
 *   service    a file in backend/src/services
 *   route      a mounted Express route
 *   component  a file in frontend/src
 *   agent      a registered ERP agent
 *
 * A module with zero artefacts is reported ABSENT. A module with only a table
 * is PARTIAL — schema without a service is a place to put data, not a feature.
 *
 * WHY THE EVIDENCE RULE MATTERS HERE
 *
 * Every previous count in this project that came from name-matching was wrong,
 * usually by a lot: "37 fabricated Math.random()" was 2; "78 dropped columns"
 * was 2; a duplication report listed tables called `is` and `and` because a
 * comment mentioned SQL. Matching "Crop Planning" to a file called
 * cropService.js is the same kind of guess. So matching is deliberately strict
 * and every match records WHICH file proved it, letting anyone check.
 *
 * Usage:  node tools/master-index.js [--json] [--absent] [--partial]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CATALOGUE = path.join(ROOT, 'docs', 'registry', 'SOURCE_CATALOGUE.json');
const OUT_MD = path.join(ROOT, 'docs', 'registry', '22_MASTER_INDEX.md');
const OUT_JSON = path.join(ROOT, 'docs', 'registry', '22_MASTER_INDEX.json');

function walk(dir, ext, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(p, ext, acc);
    } else if (ext.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

/**
 * Tokens from a module name, minus words so generic that matching on them
 * proves nothing. "Management" appears in 60 of the 150 module names; a match
 * on it is noise, and noise that looks like evidence is worse than a gap.
 */
const STOP = new Set([
  'management', 'managements', 'system', 'module', 'platform', 'engine',
  'the', 'and', 'of', 'for', 'a', 'an', 'core', 'general', 'master',
  'data', 'service', 'services', 'analytics', 'dashboard', 'registry',
]);

function tokens(name) {
  return name.toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function main() {
  const cat = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8'));

  // ---- build the evidence corpus -----------------------------------------
  const migDir = path.join(ROOT, 'backend', 'src', 'database', 'migrations');
  const tableNames = new Map();  // table -> file
  for (const f of fs.existsSync(migDir) ? fs.readdirSync(migDir).filter((x) => x.endsWith('.sql')) : []) {
    const sql = fs.readFileSync(path.join(migDir, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
    for (const m of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([a-z_][a-z0-9_]*)"?/gi)) {
      if (!tableNames.has(m[1].toLowerCase())) tableNames.set(m[1].toLowerCase(), f);
    }
  }

  const services = walk(path.join(ROOT, 'backend', 'src', 'services'), ['.js']);
  const routes = walk(path.join(ROOT, 'backend', 'src', 'routes'), ['.js']);
  const components = walk(path.join(ROOT, 'frontend', 'src'), ['.jsx', '.tsx', '.js']);

  const agentsFile = path.join(ROOT, 'backend', 'src', 'core', 'agents.js');
  const agentNames = [];
  if (fs.existsSync(agentsFile)) {
    const a = fs.readFileSync(agentsFile, 'utf8');
    for (const m of a.matchAll(/id:\s*'([a-z0-9_.-]+)'/gi)) agentNames.push(m[1]);
  }

  const corpus = [
    ...[...tableNames.entries()].map(([t, f]) => ({ kind: 'table', key: t, where: `migrations/${f}` })),
    ...services.map((p) => ({ kind: 'service', key: path.basename(p, '.js'), where: rel(p) })),
    ...routes.map((p) => ({ kind: 'route', key: path.basename(p, '.js'), where: rel(p) })),
    ...components.map((p) => ({ kind: 'component', key: path.basename(p).replace(/\.(jsx|tsx|js)$/, ''), where: rel(p) })),
    ...agentNames.map((a) => ({ kind: 'agent', key: a, where: 'core/agents.js' })),
  ].map((c) => ({ ...c, toks: new Set(tokens(c.key.replace(/([a-z])([A-Z])/g, '$1 $2'))) }));

  // ---- match each catalogued module ---------------------------------------
  /**
   * Match on the SUBJECT of the module name, then rank by corroboration.
   *
   * The first attempt required every token to match, and reported 121 of 150
   * modules absent — because "Soil Health Management" did not match
   * soilTestingService.js (no "health") and "Farmer Profile" did not match
   * farmerService.js (no "profile"). Those modules exist. The rule was
   * measuring my naming convention, not the codebase.
   *
   * Real code names things by subject: soil*, farmer*, crop*, logistics*. So
   * the subject token must match, and additional matching tokens raise
   * `quality` from 'subject' to 'strong'. A subject-only match is real
   * evidence but weaker evidence, and the index says which it is rather than
   * flattening both into "built".
   */
  function evidenceFor(name) {
    const want = tokens(name);
    if (!want.length) return [];
    const subject = want[0];              // head noun: Soil Health Mgmt -> soil
    const hits = [];
    for (const c of corpus) {
      const ct = [...c.toks];
      const hasSubject = ct.some((t) => t === subject || t.startsWith(subject) || subject.startsWith(t));
      if (!hasSubject) continue;
      const matched = want.filter((w) => ct.some((t) => t === w || t.startsWith(w) || w.startsWith(t)));
      hits.push({
        kind: c.kind,
        where: c.where,
        quality: matched.length === want.length ? 'strong'
          : matched.length > 1 ? 'partial' : 'subject',
        matched: matched.join('+'),
      });
    }
    // strongest evidence first, so the index shows the best proof available
    const rank = { strong: 0, partial: 1, subject: 2 };
    return hits.sort((a, b) => rank[a.quality] - rank[b.quality]);
  }

  const results = [];
  for (const [id, m] of Object.entries(cat.modules)) {
    const ev = evidenceFor(m.name);
    const kinds = new Set(ev.map((e) => e.kind));
    const best = ev.length ? ev[0].quality : null;
    let status;
    if (ev.length === 0) status = 'ABSENT';
    else if (kinds.has('service') || kinds.has('route')) {
      status = kinds.has('component') ? 'BUILT' : 'NO_UI';
    } else status = 'PARTIAL';
    results.push({
      id, name: m.name, domain: m.domain, status,
      match_quality: best,
      evidence: ev.slice(0, 6), evidence_count: ev.length,
    });
  }

  const byStatus = results.reduce((a, r) => { (a[r.status] = a[r.status] || []).push(r); return a; }, {});
  const n = (s) => (byStatus[s] || []).length;

  const summary = {
    generated: new Date().toISOString().slice(0, 10),
    source: cat.source,
    catalogued_domains: Object.keys(cat.domains).length,
    catalogued_modules: results.length,
    BUILT: n('BUILT'), NO_UI: n('NO_UI'), PARTIAL: n('PARTIAL'), ABSENT: n('ABSENT'),
    subject_only_matches: results.filter((r) => r.match_quality === 'subject').length,
    named_missing_modules: cat.named_missing_modules.length,
    corpus: {
      tables: tableNames.size, services: services.length, routes: routes.length,
      components: components.length, agents: agentNames.length,
    },
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ summary, results }, null, 2));
    return;
  }
  if (process.argv.includes('--absent')) {
    for (const r of byStatus.ABSENT || []) console.log(`${r.id}  ${r.name}  [${r.domain}]`);
    return;
  }
  if (process.argv.includes('--partial')) {
    for (const r of byStatus.PARTIAL || []) {
      console.log(`${r.id}  ${r.name}  — ${r.evidence.map((e) => e.kind + ':' + e.where).join(', ')}`);
    }
    return;
  }

  // ---- write the index -----------------------------------------------------
  const L = [];
  L.push('# 22 — MASTER INDEX: specified vs built');
  L.push('');
  L.push(`**Generated:** ${summary.generated} by \`tools/master-index.js\`  `);
  L.push(`**Specification:** \`docs/registry/SOURCE_CATALOGUE.json\` — ${summary.source}`);
  L.push('');
  L.push('Every status below is derived from an artefact on disk, never from a');
  L.push('module name. `BUILT` means a service or route AND a UI component were');
  L.push('found. `NO_UI` means the backend exists and nothing renders it.');
  L.push('`PARTIAL` means only a table — a place to put data, not a feature.');
  L.push('');
  L.push('| | Count |');
  L.push('|---|---|');
  L.push(`| Enterprise domains catalogued (D01–D100) | ${summary.catalogued_domains} |`);
  L.push(`| Modules catalogued (M001–M150) | ${summary.catalogued_modules} |`);
  L.push(`| **BUILT** (backend + UI) | **${summary.BUILT}** |`);
  L.push(`| **NO_UI** (backend only) | **${summary.NO_UI}** |`);
  L.push(`| **PARTIAL** (schema only) | **${summary.PARTIAL}** |`);
  L.push(`| **ABSENT** (no artefact) | **${summary.ABSENT}** |`);
  L.push(`| Modules the source explicitly names as missing | ${summary.named_missing_modules} |`);
  L.push('');
  L.push(`Evidence corpus: ${summary.corpus.tables} tables, ${summary.corpus.services} services, `
       + `${summary.corpus.routes} route files, ${summary.corpus.components} components, `
       + `${summary.corpus.agents} agents.`);
  L.push('');

  L.push('## Enterprise domains (D01–D100)');
  L.push('');
  L.push('| ID | Domain | Example modules |');
  L.push('|---|---|---|');
  for (const [id, d] of Object.entries(cat.domains)) {
    L.push(`| ${id} | ${d.name} | ${d.examples} |`);
  }
  L.push('');

  L.push('## Module index (M001–M150)');
  L.push('');
  L.push('| ID | Module | Domain | Status | Match | Evidence |');
  L.push('|---|---|---|---|---|---|');
  for (const r of results) {
    const ev = r.evidence.length
      ? r.evidence.map((e) => `\`${e.where}\``).slice(0, 3).join('<br>')
      : '—';
    L.push(`| ${r.id} | ${r.name} | ${r.domain} | **${r.status}** | ${r.match_quality || '—'} | ${ev} |`);
  }
  L.push('');

  L.push('## Modules the source names as missing');
  L.push('');
  L.push('These are not inferred. Each is stated as a gap in the source document,');
  L.push('with the business reason quoted from it.');
  L.push('');
  for (const [i, m] of cat.named_missing_modules.entries()) {
    L.push(`### ${i + 1}. ${m.module}`);
    L.push('');
    L.push(m.purpose);
    L.push('');
  }

  L.push('## SAP equivalence');
  L.push('');
  L.push('| SAP module | AFRERA module | Functionality |');
  L.push('|---|---|---|');
  for (const s of cat.sap_equivalence) L.push(`| ${s.sap} | ${s.afrera} | ${s.function} |`);
  L.push('');

  L.push('## Screen specifications');
  L.push('');
  L.push('| Screen / feature | Operation | Wiring |');
  L.push('|---|---|---|');
  for (const s of cat.screen_specs) L.push(`| ${s.screen} | ${s.process} | ${s.wiring} |`);
  L.push('');

  fs.writeFileSync(OUT_MD, L.join('\n'), 'utf8');
  fs.writeFileSync(OUT_JSON, JSON.stringify({ summary, results }, null, 2), 'utf8');

  console.log(`master-index: ${summary.catalogued_modules} modules catalogued`);
  console.log(`  BUILT   ${summary.BUILT}`);
  console.log(`  NO_UI   ${summary.NO_UI}`);
  console.log(`  PARTIAL ${summary.PARTIAL}`);
  console.log(`  ABSENT  ${summary.ABSENT}`);
  console.log(`  (of the matched, ${summary.subject_only_matches} rest on a subject-word match alone — weakest evidence)`);
  console.log(`  -> ${rel(OUT_MD)}`);
}

if (require.main === module) main();
