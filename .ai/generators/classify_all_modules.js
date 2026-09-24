// Batch inventory of every module across both trees (modules/, backend/src/modules/).
// For each unique id, classify: which locations it exists in, whether it has
// real backend code vs just a manifest, and whether anything currently
// requires/mounts it. One pass, no manual per-module reads.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const TREES = [
  { label: 'modules', dir: path.join(ROOT, 'modules') },
  { label: 'backend/src/modules', dir: path.join(ROOT, 'backend', 'src', 'modules') },
];

function readJsonSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function dirSize(dir) {
  let count = 0, bytes = 0;
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) walk(fp);
      else { count++; try { bytes += fs.statSync(fp).size; } catch {} }
    }
  }
  try { walk(dir); } catch {}
  return { count, bytes };
}

const entries = [];
for (const tree of TREES) {
  if (!fs.existsSync(tree.dir)) continue;
  for (const name of fs.readdirSync(tree.dir)) {
    const full = path.join(tree.dir, name);
    if (!fs.statSync(full).isDirectory()) continue;
    const manifestPath = path.join(full, 'module.json');
    const manifest = fs.existsSync(manifestPath) ? readJsonSafe(manifestPath) : null;
    const idMatch = name.match(/^M\d+/);
    const { count: fileCount, bytes } = dirSize(full);
    entries.push({
      tree: tree.label,
      dirName: name,
      id: idMatch ? idMatch[0] : (manifest && manifest.id) || name,
      hasManifest: !!manifest,
      declaredStatus: manifest && manifest.status,
      fileCount,
      bytes,
      hasBackend: fs.existsSync(path.join(full, 'backend')) || fs.existsSync(path.join(full, 'service.js')),
      hasRoutes: fs.existsSync(path.join(full, 'routes.js')) || fs.existsSync(path.join(full, 'backend', 'routes.js')),
    });
  }
}

// Group by numeric id across both trees
const byId = new Map();
for (const e of entries) {
  if (!byId.has(e.id)) byId.set(e.id, []);
  byId.get(e.id).push(e);
}

const dualLocation = [...byId.entries()].filter(([, list]) => list.length > 1);
const thin = entries.filter((e) => e.fileCount <= 2);        // manifest + maybe one file
const substantial = entries.filter((e) => e.fileCount > 2);
const noManifest = entries.filter((e) => !e.hasManifest);

console.error('SUMMARY:', JSON.stringify({
  totalEntries: entries.length,
  uniqueIds: byId.size,
  idsInBothTrees: dualLocation.length,
  thinEntries: thin.length,
  substantialEntries: substantial.length,
  noManifest: noManifest.length,
}));

console.log(JSON.stringify({ entries, dualLocationIds: dualLocation.map(([id]) => id) }, null, 2));
