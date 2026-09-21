/**
 * MODULE -> SYSTEM FACTORY
 * Phase 1 only: every existing module becomes a first-class runtime system.
 * Phase 2 (orphan-file / missing-module discovery) is intentionally separate.
 */
const fs = require('fs');
const path = require('path');
const SKIP = new Set(['node_modules', '.git']);

function walk(root, predicate, output = []) {
  if (!fs.existsSync(root)) return output;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) walk(full, predicate, output);
    else if (!predicate || predicate(full)) output.push(full);
  }
  return output;
}
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return {}; }
}
function rel(root, file) { return path.relative(root, file).replace(/\\/g, '/'); }
function findModuleManifests(root) { return walk(path.join(root, 'modules'), p => p.endsWith('module.json')); }
function findNumericModuleDirs(root) {
  const dir = path.join(root, 'backend', 'src', 'modules');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() && /^M\d+/i.test(e.name)).map(e => path.join(dir, e.name));
}
function inspectModuleDirectory(dir, root) {
  const files = walk(dir, p => /\.(js|jsx|ts|tsx|json|sql|md)$/i.test(p));
  const has = n => files.some(p => path.basename(p).toLowerCase() === n.toLowerCase());
  return {
    source: rel(root, dir),
    files: files.map(p => rel(root, p)),
    surfaces: {
      manifest: has('module.json'),
      service: has('service.js'),
      routes: files.some(p => /routes?\//i.test(p) || /routes?\.(js|ts)$/i.test(p)),
      controller: files.some(p => /controller/i.test(path.basename(p))),
      model: files.some(p => /model/i.test(path.basename(p)) || p.endsWith('.sql')),
      frontend: files.some(p => /frontend|ui/i.test(p)),
      tests: files.some(p => /test|spec/i.test(path.basename(p))),
      docs: files.some(p => /readme|docs/i.test(p))
    }
  };
}
function fromManifest(file, root) {
  const data = readJson(file); const dir = path.dirname(file);
  const moduleId = data.moduleId || data.id || path.basename(dir);
  const contract = inspectModuleDirectory(dir, root);
  return {
    systemId: `SYS-${String(moduleId).toUpperCase()}`, moduleId,
    name: data.name || data.displayName || moduleId.replace(/[_-]+/g, ' '),
    version: data.version || '0.0.0', category: data.category || data.domain || 'Unclassified',
    domain: data.domain || data.category || 'Unclassified', layer: data.layer || data.architectureLayer || 'Domain',
    purpose: data.purpose || data.description || '',
    capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
    dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
    source: rel(root, file), files: contract.files, surfaces: contract.surfaces,
    lifecycle: 'module-system'
  };
}
function fromNumericDir(dir, root) {
  const moduleId = path.basename(dir); const readme = path.join(dir, 'README.md');
  const purpose = fs.existsSync(readme) ? (fs.readFileSync(readme, 'utf8').split('\n').find(x => x.trim() && !x.startsWith('#')) || '').trim() : '';
  const contract = inspectModuleDirectory(dir, root);
  return {
    systemId: `SYS-${moduleId.toUpperCase()}`, moduleId, name: moduleId, version: 'unverified',
    category: 'Unclassified', domain: 'Unclassified', layer: 'Unclassified', purpose,
    capabilities: [], dependencies: [], source: contract.source, files: contract.files, surfaces: contract.surfaces,
    lifecycle: 'module-system-unverified'
  };
}
function buildModuleSystems(projectRoot = path.resolve(__dirname, '../../..')) {
  const byId = new Map();
  for (const file of findModuleManifests(projectRoot)) { const s = fromManifest(file, projectRoot); byId.set(s.moduleId.toUpperCase(), s); }
  for (const dir of findNumericModuleDirs(projectRoot)) { const key = path.basename(dir).toUpperCase(); if (!byId.has(key)) byId.set(key, fromNumericDir(dir, projectRoot)); }
  const systems = [...byId.values()].sort((a, b) => a.systemId.localeCompare(b.systemId));
  return {
    phase: 1,
    rule: 'Every existing module is represented as one first-class system. Remaining files are intentionally analyzed separately in Phase 2.',
    generatedAt: new Date().toISOString(), count: systems.length, systems,
    summary: systems.reduce((a, s) => {
      a.layers[s.layer] = (a.layers[s.layer] || 0) + 1;
      for (const k of ['service','routes','frontend','tests']) a[`with${k[0].toUpperCase()}${k.slice(1)}`] += s.surfaces[k] ? 1 : 0;
      return a;
    }, { layers: {}, withService: 0, withRoutes: 0, withFrontend: 0, withTests: 0 })
  };
}
module.exports = { buildModuleSystems, findModuleManifests, findNumericModuleDirs, inspectModuleDirectory };
