#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.audit', 'phase-program', 'conflict-regression');
const activeRoots = ['backend/src', 'frontend/src', 'modules', 'afrera', 'tools', 'scripts']
  .map((value) => path.join(root, value))
  .filter(fs.existsSync);
const skip = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.cache', '.vite', '.next', 'out']);
const codeExt = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.sql']);
fs.mkdirSync(outDir, { recursive: true });

function listFiles(dir, target) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) listFiles(full, target);
    else if (ent.isFile() && codeExt.has(path.extname(ent.name).toLowerCase())) target.push(full);
  }
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

const files = [];
for (const dir of activeRoots) listFiles(dir, files);

const findings = [];
function add(type, severity, file, line, evidence, rationale) {
  findings.push({ type, severity, file: rel(file), line, evidence, rationale });
}

for (const file of files) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const n = index + 1;
    if (/Route operational|message:\s*['"]Operational['"]/.test(line)) {
      add('route_stub', 'high', file, n, line.trim(), 'Route advertises operational status without domain behavior evidence.');
    }
    if (/TODO|FIXME|HACK|XXX/.test(line) && !/test|fixture/i.test(rel(file))) {
      add('unfinished_marker', 'medium', file, n, line.trim(), 'Authored unfinished-work marker in active source.');
    }
    if (/not implemented|placeholder|dummy|mock response/i.test(line) && !/test|fixture|example/i.test(rel(file))) {
      add('placeholder_behavior', 'high', file, n, line.trim(), 'Active source contains placeholder or unimplemented behavior.');
    }
    if (/Math\.random\s*\(/.test(line) && /(id|token|claim|order|payment|decision|transaction|invoice|policy|settlement|audit)/i.test(text.slice(Math.max(0, text.indexOf(line) - 300), text.indexOf(line) + 600))) {
      add('random_auditable_identifier', 'high', file, n, line.trim(), 'Math.random is unsuitable for auditable/security-sensitive identifiers.');
    }
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
      add('swallowed_error', 'high', file, n, line.trim(), 'Empty catch hides operational failure.');
    }
    if (/Auth optional|authentication optional|auth optional/i.test(line)) {
      add('optional_auth', 'critical', file, n, line.trim(), 'Production API security must fail closed unless endpoint is explicitly public.');
    }
    if (/new\s+Map\s*\(\s*\)|\[\]\s*;\s*\/\/.*(?:database|persist|storage)/i.test(line)) {
      add('in_memory_state', 'medium', file, n, line.trim(), 'Potential in-memory operational state requires persistence classification.');
    }
  });
}

const routesDir = path.join(root, 'backend', 'src', 'routes');
if (fs.existsSync(routesDir)) {
  for (const ent of fs.readdirSync(routesDir, { withFileTypes: true })) {
    if (!ent.isFile() || !ent.name.endsWith('.js')) continue;
    const file = path.join(routesDir, ent.name);
    const text = fs.readFileSync(file, 'utf8');
    const serviceRequires = [...text.matchAll(/require\(['"]\.\.\/services\/([^'"]+)['"]\)/g)].map((m) => m[1]);
    const routerOps = [...text.matchAll(/router\.(get|post|put|patch|delete)\s*\(/g)].length;
    const healthOnly = routerOps <= 2 && /health/.test(text) && /Route operational|message:\s*['"]Operational['"]/.test(text);
    if (healthOnly && serviceRequires.length === 0) {
      add('disconnected_route_stub', 'critical', file, 1, ent.name, 'Route has only health/stub behavior and no service dependency.');
    }
  }
}

const servicesDir = path.join(root, 'backend', 'src', 'services');
if (fs.existsSync(servicesDir)) {
  const current = new Map();
  const legacyDir = path.join(servicesDir, 'legacy');
  for (const ent of fs.readdirSync(servicesDir, { withFileTypes: true })) {
    if (ent.isFile() && ent.name.endsWith('.js')) current.set(ent.name.toLowerCase(), path.join(servicesDir, ent.name));
  }
  if (fs.existsSync(legacyDir)) {
    for (const ent of fs.readdirSync(legacyDir, { withFileTypes: true })) {
      if (!ent.isFile() || !ent.name.endsWith('.js')) continue;
      const live = current.get(ent.name.toLowerCase());
      if (!live) continue;
      const a = fs.readFileSync(live);
      const b = fs.readFileSync(path.join(legacyDir, ent.name));
      if (!a.equals(b)) {
        findings.push({
          type: 'legacy_current_divergence',
          severity: 'medium',
          file: rel(live),
          counterpart: rel(path.join(legacyDir, ent.name)),
          rationale: 'Current and legacy service copies share basename but differ in content; authority must be proven by reachability/tests.'
        });
      }
    }
  }
}

let consolidated = null;
const comparisonPath = path.join(root, '.audit', 'phase-program', 'phase-011-compare', 'summary.json');
if (fs.existsSync(comparisonPath)) {
  consolidated = JSON.parse(fs.readFileSync(comparisonPath, 'utf8'));
}

let syntax = null;
const structuralManifest = path.join(root, '.audit', 'phase-program', 'structural-code', 'manifest.json');
if (fs.existsSync(structuralManifest)) syntax = JSON.parse(fs.readFileSync(structuralManifest, 'utf8'));

const severityCounts = {};
const typeCounts = {};
for (const finding of findings) {
  severityCounts[finding.severity] = (severityCounts[finding.severity] || 0) + 1;
  typeCounts[finding.type] = (typeCounts[finding.type] || 0) + 1;
}

findings.sort((a, b) => {
  const rank = { critical: 0, high: 1, medium: 2, low: 3 };
  return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9) || a.file.localeCompare(b.file);
});

const detailsPath = path.join(outDir, 'findings.jsonl');
fs.writeFileSync(detailsPath, findings.map((item) => JSON.stringify(item)).join('\n') + (findings.length ? '\n' : ''));

const summary = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  filesScanned: files.length,
  findingCount: findings.length,
  severityCounts,
  typeCounts,
  consolidatedDivergence: consolidated ? consolidated.counts : null,
  structuralParse: syntax ? {
    filesParsed: syntax.filesParsed,
    filesWithParseErrors: syntax.filesWithParseErrors,
    totalRoutes: syntax.totalRoutes,
    totalDependencyEdges: syntax.totalDependencyEdges,
  } : null,
  remediationRule: 'Detection does not authorize deletion. Critical/high findings must be repaired or explicitly reconciled in implementation phases before production certification.',
  details: path.basename(detailsPath),
  sample: findings.slice(0, 200),
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({
  ok: true,
  filesScanned: files.length,
  findingCount: findings.length,
  severityCounts,
  typeCounts,
  bytes: fs.statSync(detailsPath).size,
}));
