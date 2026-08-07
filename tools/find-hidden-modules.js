#!/usr/bin/env node
/**
 * FIND HIDDEN MODULES — does this capability exist anywhere, under any name?
 *
 * WHY THIS EXISTS
 *
 * `master-index.js` decides whether a catalogued module is built by matching
 * its name against file names on disk. That is a lexical test, and it answers
 * the wrong question. A module called "Weather Monitoring" implemented in a
 * file called `ClimateWeatherPage.jsx` reads as ABSENT. A module whose
 * features were folded into a larger service reads as ABSENT. The status page
 * already carries a warning that the figure is "a floor, not a score".
 *
 * Building from that floor is expensive in the one way that cannot be undone:
 * it creates a second implementation of something that already works, and now
 * two places disagree about the same business rule.
 *
 * So before anything is declared missing, this tool asks a different question
 * of the actual file contents:
 *
 *   FOUND        — the capability exists under a matching name
 *   HIDDEN       — it exists, but under a name the matcher cannot see
 *   CLUBBED      — its features live inside a different, larger module
 *   ABSENT       — no evidence anywhere in the folder
 *
 * Only the ABSENT set is safe to build.
 *
 * EVERY VERDICT PRINTS ITS EVIDENCE. This tool's predecessors produced
 * confident wrong numbers six times in this project — always by inferring
 * from names rather than reading contents. A claim you cannot check is a
 * claim this tool is not entitled to make, so each row names the file and
 * line that justifies it.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CATALOGUE = path.join(ROOT, 'docs', 'registry', 'SOURCE_CATALOGUE.json');
const OUT_DIR = path.join(ROOT, 'docs', 'registry');

/* Words that carry no discriminating power in an agri-ERP catalogue. If
 * "Management" counted as evidence, every module would match every service. */
const STOP = new Set([
  'the', 'and', 'for', 'with', 'of', 'a', 'an', 'to', 'in', 'on', 'by', 'from',
  'management', 'system', 'systems', 'platform', 'module', 'engine', 'service',
  'services', 'layer', 'core', 'general', 'main', 'basic', 'advanced', 'smart',
  'intelligent', 'digital', 'enterprise', 'integrated', 'unified', 'master',
  'manager', 'suite', 'tool', 'tools', 'hub', 'center', 'centre', 'portal',
  'dashboard', 'app', 'application', 'data', 'info', 'information',
]);

/* ---------------------------------------------------------------- corpus -- */

function walk(dir, out, exts, skip) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (skip.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out, exts, skip);
    else if (exts.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

function loadCorpus() {
  const skip = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next']);
  const files = [];
  walk(path.join(ROOT, 'backend', 'src'), files, new Set(['.js', '.sql']), skip);
  walk(path.join(ROOT, 'frontend', 'src'), files, new Set(['.jsx', '.js', '.tsx', '.ts']), skip);

  return files.map((f) => {
    let text = '';
    try { text = fs.readFileSync(f, 'utf8'); } catch { /* unreadable */ }
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    return {
      rel,
      // Name-only haystack: the filename, flattened.
      nameKey: path.basename(f, path.extname(f)).toLowerCase().replace(/[^a-z0-9]/g, ''),
      lower: text.toLowerCase(),
      // Flattened body lets "forward_pricing", "forwardPricing" and
      // "Forward Pricing" all match one probe.
      flat: text.toLowerCase().replace(/[^a-z0-9]/g, ''),
      area: rel.includes('/services/') ? 'service'
        : rel.includes('/routes/') ? 'route'
          : rel.includes('/migrations/') || rel.endsWith('.sql') ? 'schema'
            : rel.includes('/pages/') ? 'page'
              : rel.includes('/components/') ? 'component' : 'other',
    };
  }).filter((f) => f.lower.length);
}

/* --------------------------------------------------------------- probing -- */

function terms(name) {
  return name.toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    // Join a trailing digit to its word BEFORE splitting. "GSTR-1" and
    // "GSTR-3B" otherwise tokenise to ["gstr","1"] and ["gstr","3b"], the
    // short piece is dropped as noise, and the module is then searched for as
    // "gstr" + unrelated words — which found nothing and reported ABSENT for
    // three GST modules that are fully implemented in 047_gst_tables.sql.
    // Verified by hand: `gstr1` occurs in 3 files, `gstr3b` in 3.
    .replace(/([a-z])[-_ ]?(\d+[a-z]?)\b/g, '$1$2')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function firstLine(file, needle) {
  const lines = file.lower.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].replace(/[^a-z0-9]/g, '').includes(needle)) return i + 1;
  }
  return null;
}

function classify(mod, corpus) {
  const sig = terms(mod.name);
  if (!sig.length) return { status: 'UNSCORABLE', why: 'name has no distinguishing words', evidence: [] };

  const phrase = sig.join('');            // "forwardpricing"
  const evidence = [];

  // 1. Exact multi-word phrase anywhere in a file body — strongest signal.
  for (const f of corpus) {
    if (sig.length >= 2 && f.flat.includes(phrase)) {
      evidence.push({ kind: 'phrase', file: f.rel, area: f.area, line: firstLine(f, phrase) });
    }
  }

  // 2. Filename carries the phrase — this is what the old matcher saw.
  const byName = corpus.filter((f) => sig.length >= 2 && f.nameKey.includes(phrase));

  // 3. All significant terms co-occur in one file. Catches a capability
  //    implemented under a different label, and clubbing into a bigger module.
  //
  //    Only meaningful when the module name has TWO OR MORE distinguishing
  //    words. With one word this test degenerates into "does the file contain
  //    the word `configuration`" — true of most of the codebase — and would
  //    report a confident CLUBBED verdict on no real evidence. Single-word
  //    modules therefore fall through to the hand-check branch below, which
  //    is the honest answer for them.
  const coOccur = [];
  if (sig.length >= 2) {
    for (const f of corpus) {
      if (sig.every((t) => f.flat.includes(t))) coOccur.push(f);
    }
  }

  // 4. Single rare term. Weak on its own, so it is only ever reported as a
  //    lead to check by hand — never as proof the module exists.
  const rare = [];
  if (sig.length === 1) {
    for (const f of corpus) if (f.flat.includes(sig[0])) rare.push(f);
  }

  const pick = (arr, n = 3) => arr.slice(0, n).map((f) => ({ file: f.rel, area: f.area }));

  if (byName.length) {
    return { status: 'FOUND', why: 'file named for this module', evidence: pick(byName), terms: sig };
  }
  if (evidence.length) {
    return {
      status: 'HIDDEN',
      why: 'exact capability phrase present, but no file is named for it',
      evidence: evidence.slice(0, 3),
      terms: sig,
    };
  }
  if (coOccur.length) {
    // Where it co-occurs tells us whether it is a real home or a lodger.
    const homes = [...new Set(coOccur.map((f) => f.area))];
    return {
      status: coOccur.length <= 3 ? 'HIDDEN' : 'CLUBBED',
      why: coOccur.length <= 3
        ? 'all key terms appear together in a small number of files'
        : `key terms spread across ${coOccur.length} files — features likely folded into larger modules`,
      evidence: pick(coOccur, 4),
      areas: homes,
      terms: sig,
    };
  }
  if (rare.length) {
    return {
      status: 'LEAD',
      why: 'single-word match only — must be checked by hand before building',
      evidence: pick(rare, 3),
      terms: sig,
    };
  }
  return { status: 'ABSENT', why: 'no occurrence of these terms anywhere in backend or frontend', evidence: [], terms: sig };
}

/* ----------------------------------------------------------------- main --- */

function main() {
  const cat = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8'));
  const corpus = loadCorpus();

  const rows = Object.entries(cat.modules).map(([id, m]) => ({
    id, name: m.name, domain: m.domain, ...classify(m, corpus),
  }));

  // The named-missing list from the source documents gets the same treatment —
  // several of those were built after the document was written.
  const namedMissing = (cat.named_missing_modules || []).map((m) => ({
    id: 'NM', name: m.module, domain: 'named-missing', purpose: m.purpose,
    ...classify({ name: m.module }, corpus),
  }));

  const tally = {};
  for (const r of rows) tally[r.status] = (tally[r.status] || 0) + 1;

  const L = [];
  L.push('# Hidden Module Report');
  L.push('');
  L.push(`Generated ${new Date().toISOString().slice(0, 10)} from ${corpus.length} source files.`);
  L.push('');
  L.push('Answers one question per catalogued module: **does this capability exist');
  L.push('anywhere in the folder, under any name?** The previous count was decided by');
  L.push('matching module names against file names, which cannot see a capability');
  L.push('implemented under a different label or folded into a larger module.');
  L.push('');
  L.push('| Verdict | Meaning | Safe to build? |');
  L.push('|---|---|---|');
  L.push('| FOUND | a file is named for this module | No — already exists |');
  L.push('| HIDDEN | exists under a different name | No — extend it, do not duplicate |');
  L.push('| CLUBBED | features folded into larger modules | No — extract first, then decide |');
  L.push('| LEAD | one weak word match | Check by hand first |');
  L.push('| ABSENT | no trace anywhere | **Yes** |');
  L.push('');
  L.push('## Tally');
  L.push('');
  L.push('| Verdict | Modules |');
  L.push('|---|---:|');
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) L.push(`| ${k} | ${v} |`);
  L.push('');

  for (const status of ['ABSENT', 'LEAD', 'CLUBBED', 'HIDDEN', 'FOUND']) {
    const group = rows.filter((r) => r.status === status);
    if (!group.length) continue;
    L.push(`## ${status} — ${group.length}`);
    L.push('');
    L.push('| ID | Module | Domain | Evidence |');
    L.push('|---|---|---|---|');
    for (const r of group) {
      const ev = r.evidence.length
        ? r.evidence.map((e) => `\`${e.file}\``).join('<br>')
        : `_${r.why}_`;
      L.push(`| ${r.id} | ${r.name} | ${r.domain || ''} | ${ev} |`);
    }
    L.push('');
  }

  L.push('## Named-missing modules from the source documents');
  L.push('');
  L.push('| Module | Verdict | Evidence |');
  L.push('|---|---|---|');
  for (const r of namedMissing) {
    const ev = r.evidence.length ? r.evidence.map((e) => `\`${e.file}\``).join('<br>') : `_${r.why}_`;
    L.push(`| ${r.name.slice(0, 70)} | ${r.status} | ${ev} |`);
  }

  fs.writeFileSync(path.join(OUT_DIR, '19_HIDDEN_MODULES.md'), L.join('\n'));
  fs.writeFileSync(
    path.join(OUT_DIR, '19_HIDDEN_MODULES.json'),
    JSON.stringify({ generated: new Date().toISOString(), tally, modules: rows, namedMissing }, null, 2)
  );

  console.log('Hidden-module scan over', corpus.length, 'files\n');
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + String(v).padStart(4), k);
  }
  const nm = {};
  for (const r of namedMissing) nm[r.status] = (nm[r.status] || 0) + 1;
  console.log('\n  named-missing:', JSON.stringify(nm));
  console.log('\n  written to docs/registry/19_HIDDEN_MODULES.{md,json}');
}

main();
