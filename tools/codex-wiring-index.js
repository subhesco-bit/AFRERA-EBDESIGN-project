#!/usr/bin/env node
/*
 * Builds one reusable import/require index across the canonical runtime trees
 * (backend/, frontend/) so wiring checks are O(1) lookups instead of re-walking
 * the whole tree per file. Only internal relative imports are indexed (external
 * npm packages are irrelevant to "is this module wired into the app").
 *
 * Output: _MERGE_LAB/reports/wiring-index.json
 *   twoSegmentIndex: "<parentDir>/<basename>" (lowercased) -> [importer files]
 *   basenameIndex:   "<basename>" (lowercased)             -> [importer files]
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const SCAN_ROOTS = ['backend', 'frontend'];
const CODE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage']);

const IMPORT_RES = [
  /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  /from\s+['"]([^'"]+)['"]/g,
  /import\(\s*['"]([^'"]+)['"]\s*\)/g
];

function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full, out); continue; }
    if (!CODE_EXT.has(path.extname(e.name))) continue;
    out.push(full);
  }
}

function specifierKeys(specifier) {
  // Only relative/internal imports matter for wiring; skip bare package names.
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) return [];
  const clean = specifier.replace(/\\/g, '/').replace(/\/$/, '');
  const segs = clean.split('/').filter((s) => s && s !== '.' && s !== '..');
  if (segs.length === 0) return [];
  let last = segs[segs.length - 1].toLowerCase();
  last = last.replace(/\.(js|jsx|ts|tsx|json)$/i, '');
  const keys = [];
  if (last === 'index' && segs.length >= 2) {
    // require('./services/authService') resolving to authService/index.js —
    // the meaningful name is the directory, not "index".
    const dir = segs[segs.length - 2].toLowerCase();
    keys.push(dir);
    keys.push(`${dir}/index`);
  } else {
    keys.push(last);
    if (segs.length >= 2) keys.push(`${segs[segs.length - 2].toLowerCase()}/${last}`);
  }
  return keys;
}

function main() {
  const files = [];
  for (const sr of SCAN_ROOTS) {
    const abs = path.join(root, sr);
    if (fs.existsSync(abs)) walk(abs, files);
  }

  const twoSegmentIndex = new Map();
  const basenameIndex = new Map();

  for (const abs of files) {
    let text;
    try { text = fs.readFileSync(abs, 'utf8'); } catch { continue; }
    const rel = path.relative(root, abs);
    const foundKeys = new Set();
    for (const re of IMPORT_RES) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        for (const key of specifierKeys(m[1])) foundKeys.add(key);
      }
    }
    for (const key of foundKeys) {
      const isTwoSeg = key.includes('/');
      const map = isTwoSeg ? twoSegmentIndex : basenameIndex;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(rel);
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    filesScanned: files.length,
    twoSegmentIndex: Object.fromEntries([...twoSegmentIndex].map(([k, v]) => [k, [...v]])),
    basenameIndex: Object.fromEntries([...basenameIndex].map(([k, v]) => [k, [...v]]))
  };

  const outPath = path.join(root, '_MERGE_LAB', 'reports', 'wiring-index.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log(JSON.stringify({
    filesScanned: files.length,
    twoSegmentKeys: twoSegmentIndex.size,
    basenameKeys: basenameIndex.size,
    outPath: path.relative(root, outPath)
  }, null, 2));
}

main();
