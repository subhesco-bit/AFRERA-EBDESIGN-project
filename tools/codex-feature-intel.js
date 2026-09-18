#!/usr/bin/env node
/*
 * Intelligent-merge layer: symbol-level diff + wiring check.
 * Usage:
 *   node tools/codex-feature-intel.js <feature-name>   (one track)
 *   node tools/codex-feature-intel.js ALL              (every track under _MERGE_LAB/features)
 *
 * For every candidate file copied into _MERGE_LAB/features/<feature>/:
 *  - group by "stem" (the original filename, stripped of source/hash prefix)
 *  - extract exported symbols (functions, classes, module.exports keys, route verbs+paths)
 *  - report which symbols are shared across all sources vs unique to one source
 *  - check whether the stem is actually wired into the live canonical tree using
 *    a prebuilt import/require index (tools/codex-wiring-index.js), not a per-file
 *    tree walk — this makes an ALL-tracks run tractable.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const target = process.argv[2];
if (!target) {
  console.error('Usage: node tools/codex-feature-intel.js <feature-name>|ALL');
  process.exit(1);
}

const featuresRoot = path.join(root, '_MERGE_LAB', 'features');
const wiringIndexPath = path.join(root, '_MERGE_LAB', 'reports', 'wiring-index.json');
const renamePlanCsv = path.join(root, 'docs', 'codex-duplicate-rename-plan.csv');

const CODE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
      else if (ch === '"') { quoted = false; }
      else { cur += ch; }
    } else if (ch === '"') { quoted = true; }
    else if (ch === ',') { out.push(cur); cur = ''; }
    else { cur += ch; }
  }
  out.push(cur);
  return out;
}

function loadRenamePlanIndex() {
  const map = new Map(); // proposed_merge_lab_path (normalized) -> original_path
  if (!fs.existsSync(renamePlanCsv)) return map;
  const lines = fs.readFileSync(renamePlanCsv, 'utf8').split(/\r?\n/);
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    const [, , originalPath, , proposedPath] = parseCsvLine(line);
    if (!proposedPath) continue;
    map.set(proposedPath.replace(/\\/g, '/'), originalPath);
  }
  return map;
}

function loadWiringIndex() {
  if (!fs.existsSync(wiringIndexPath)) {
    console.error(`Missing ${wiringIndexPath} — run tools/codex-wiring-index.js first.`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(wiringIndexPath, 'utf8'));
  return {
    twoSegmentIndex: new Map(Object.entries(raw.twoSegmentIndex)),
    basenameIndex: new Map(Object.entries(raw.basenameIndex))
  };
}

function parseFilename(name) {
  const ext = path.extname(name);
  const base = name.slice(0, -ext.length || undefined);
  const parts = base.split('__');
  if (parts.length < 3) return { source: 'unknown', hash: '', stem: base + ext };
  const source = parts[0];
  const hash = parts[1];
  const stem = parts.slice(2).join('__') + ext;
  return { source, hash, stem };
}

function extractSymbols(content) {
  const symbols = new Set();
  const patterns = [
    /function\s+(\w+)\s*\(/g,
    /class\s+(\w+)/g,
    /module\.exports\.(\w+)\s*=/g,
    /exports\.(\w+)\s*=/g,
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    /export\s+const\s+(\w+)/g,
    /export\s+class\s+(\w+)/g,
    /export\s+default\s+(?:function\s+)?(\w+)/g,
    /router\.(get|post|put|delete|patch|use)\(\s*['"]([^'"]+)['"]/g,
    /const\s+(\w+)\s*=\s*(?:async\s*)?\(/g
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) {
      if (m.length === 3) symbols.add(`route:${m[1].toUpperCase()}:${m[2]}`);
      else symbols.add(m[1]);
    }
  }
  const moduleExportsObjMatch = content.match(/module\.exports\s*=\s*\{([^}]*)\}/s);
  if (moduleExportsObjMatch) {
    const keys = moduleExportsObjMatch[1].match(/(\w+)\s*[,:]/g) || [];
    for (const k of keys) symbols.add(k.replace(/[,:]/g, '').trim());
  }
  return symbols;
}

function wiringLookup(originalPath, stem, indexes) {
  const ext = path.extname(stem);
  const base = path.basename(stem, ext).toLowerCase();
  if (!base || base.length < 3) return [];

  let twoSegKey = null;
  if (originalPath) {
    const norm = originalPath.replace(/\\/g, '/');
    const segs = norm.split('/').filter(Boolean);
    if (segs.length >= 2) {
      const parent = segs[segs.length - 2].toLowerCase();
      twoSegKey = `${parent}/${base}`;
    }
  }

  if (twoSegKey && indexes.twoSegmentIndex.has(twoSegKey)) {
    return indexes.twoSegmentIndex.get(twoSegKey);
  }
  if (indexes.basenameIndex.has(base)) {
    return indexes.basenameIndex.get(base);
  }
  return [];
}

function runFeature(feature, indexes, renamePlanIndex) {
  const featureDir = path.join(featuresRoot, feature);
  const files = fs.readdirSync(featureDir).filter((f) => fs.statSync(path.join(featureDir, f)).isFile());
  const groups = new Map();

  for (const f of files) {
    const { source, hash, stem } = parseFilename(f);
    if (!groups.has(stem)) groups.set(stem, []);
    const abs = path.join(featureDir, f);
    const ext = path.extname(stem);
    let symbols = new Set();
    if (CODE_EXT.has(ext)) {
      try { symbols = extractSymbols(fs.readFileSync(abs, 'utf8')); } catch { /* ignore */ }
    }
    const bytes = fs.statSync(abs).size;
    const proposedKey = `_MERGE_LAB/features/${feature}/${f}`;
    const originalPath = renamePlanIndex.get(proposedKey);
    groups.get(stem).push({ source, hash, file: f, bytes, symbols, originalPath });
  }

  const report = [];
  for (const [stem, candidates] of groups) {
    const allSymbols = new Map();
    for (const c of candidates) {
      for (const s of c.symbols) {
        if (!allSymbols.has(s)) allSymbols.set(s, new Set());
        allSymbols.get(s).add(c.source);
      }
    }
    const totalSources = new Set(candidates.map((c) => c.source)).size;
    const uniquePerSource = new Map();
    let sharedCount = 0;
    for (const [sym, sources] of allSymbols) {
      if (sources.size === totalSources && totalSources > 1) sharedCount += 1;
      else if (sources.size === 1) {
        const src = [...sources][0];
        if (!uniquePerSource.has(src)) uniquePerSource.set(src, []);
        uniquePerSource.get(src).push(sym);
      }
    }
    const anyOriginal = candidates.find((c) => c.originalPath)?.originalPath || null;
    const wired = wiringLookup(anyOriginal, stem, indexes);
    report.push({
      stem,
      candidateCount: candidates.length,
      sources: [...new Set(candidates.map((c) => c.source))],
      sharedSymbolCount: sharedCount,
      uniquePerSource: Object.fromEntries(uniquePerSource),
      wiredReferences: wired
    });
  }
  return report;
}

function main() {
  const indexes = loadWiringIndex();
  const renamePlanIndex = loadRenamePlanIndex();

  const features = target === 'ALL'
    ? fs.readdirSync(featuresRoot).filter((f) => fs.statSync(path.join(featuresRoot, f)).isDirectory())
    : [target];

  const summary = [];
  for (const feature of features) {
    const featureDir = path.join(featuresRoot, feature);
    if (!fs.existsSync(featureDir)) continue;
    const report = runFeature(feature, indexes, renamePlanIndex);
    const outPath = path.join(root, '_MERGE_LAB', 'reports', `intel-${feature}.json`);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

    const orphaned = report.filter((r) => r.wiredReferences.length === 0);
    const withUnique = report.filter((r) => Object.keys(r.uniquePerSource).length > 0);
    summary.push({
      feature,
      stems: report.length,
      orphanedStems: orphaned.length,
      orphanedStemNames: orphaned.map((r) => r.stem),
      stemsWithUniquePerSourceSymbols: withUnique.length
    });
  }

  if (target === 'ALL') {
    summary.sort((a, b) => b.orphanedStems - a.orphanedStems);
    const summaryPath = path.join(root, '_MERGE_LAB', 'reports', 'intel-summary-all.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    const totalStems = summary.reduce((n, s) => n + s.stems, 0);
    const totalOrphaned = summary.reduce((n, s) => n + s.orphanedStems, 0);
    const totalUnique = summary.reduce((n, s) => n + s.stemsWithUniquePerSourceSymbols, 0);
    console.log(JSON.stringify({
      featuresProcessed: summary.length,
      totalStems,
      totalOrphanedStems: totalOrphaned,
      totalStemsWithUniqueSymbols: totalUnique,
      summaryPath: path.relative(root, summaryPath)
    }, null, 2));
  } else {
    console.log(JSON.stringify(summary[0], null, 2));
  }
}

main();
