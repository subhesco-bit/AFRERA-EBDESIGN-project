#!/usr/bin/env node
/**
 * Full Modular System Assembly Orchestrator
 *
 * Phase 1: reconcile every discoverable module into a self-contained system.
 * Phase 2: account for remaining repository assets and identify candidates for
 * missing modules. Existing files are never deleted or rewritten by this tool.
 *
 * Work is performed in batches of five and persisted after every batch.
 */
const fs = require('fs');
const path = require('path');
const child = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(ROOT, '.ai', 'system-assembly');
const REPORT = path.join(STATE_DIR, 'FULL_ASSEMBLY_REPORT.md');
const ASSET_REPORT = path.join(STATE_DIR, 'REMAINING_ASSET_ANALYSIS.md');
const BATCH = Number(process.env.SYSTEM_BATCH_SIZE || 5);

function files(dir, re = /\.(js|jsx|ts|tsx|json|md|sql|yml|yaml)$/) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory() && !['node_modules', '.git', 'coverage', 'dist', 'build'].includes(e.name)) walk(p);
      else if (e.isFile() && re.test(e.name)) out.push(p);
    }
  };
  walk(dir);
  return out;
}

function dirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
}

function discoverModules() {
  const roots = [path.join(ROOT, 'modules'), path.join(ROOT, 'backend', 'src', 'modules')];
  const names = new Map();
  for (const root of roots) {
    for (const name of dirs(root)) {
      if (/^M\d+_/.test(name) || /SYSTEM$/i.test(name)) {
        const key = name.replace(/^(M\d+)_/, '$1');
        if (!names.has(key)) names.set(key, { name, roots: [path.relative(ROOT, path.join(root, name))] });
        else names.get(key).roots.push(path.relative(ROOT, path.join(root, name)));
      }
    }
  }
  return [...names.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

function discoverAssets(moduleRoots) {
  const roots = [
    path.join(ROOT, 'backend', 'src', 'services'),
    path.join(ROOT, 'backend', 'src', 'routes'),
    path.join(ROOT, 'backend', 'src', 'controllers'),
    path.join(ROOT, 'backend', 'src', 'models'),
    path.join(ROOT, 'backend', 'src', 'jobs'),
    path.join(ROOT, 'frontend', 'src'),
    path.join(ROOT, 'backend', 'src', 'database', 'migrations'),
  ];
  const assets = [];
  for (const root of roots) for (const p of files(root)) assets.push(path.relative(ROOT, p));
  return assets.filter(p => !moduleRoots.some(m => p.startsWith(m + path.sep) || p === m));
}

function classifyAsset(p) {
  const n = path.basename(p).toLowerCase();
  if (/service/.test(n)) return 'service';
  if (/route/.test(n)) return 'route';
  if (/controller/.test(n)) return 'controller';
  if (/model|schema/.test(n)) return 'data';
  if (/page|screen|view/.test(n)) return 'frontend-page';
  if (/component|hook/.test(n)) return 'frontend-component';
  if (/migration/.test(p)) return 'database-migration';
  if (/job|queue|worker/.test(n)) return 'workflow-job';
  return 'other';
}

function runPhase1() {
  const result = child.spawnSync(process.execPath, [path.join(__dirname, 'module-system-assembler.js')], {
    cwd: ROOT, env: { ...process.env, SYSTEM_BATCH_SIZE: String(BATCH) }, encoding: 'utf8'
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.status !== 0) throw new Error(`Phase 1 assembler exited with ${result.status}`);
}

function main() {
  if (!Number.isInteger(BATCH) || BATCH < 1) throw new Error('SYSTEM_BATCH_SIZE must be a positive integer');
  fs.mkdirSync(STATE_DIR, { recursive: true });

  // Phase 1 deliberately delegates to the existing five-at-a-time assembler.
  runPhase1();

  const modules = discoverModules();
  const moduleRoots = modules.flatMap(m => m.roots);
  const assets = discoverAssets(moduleRoots);
  const byType = {};
  for (const p of assets) (byType[classifyAsset(p)] ||= []).push(p);

  const missingCandidates = [];
  for (const [type, list] of Object.entries(byType)) {
    // Candidate means only that these assets are not accounted for by a module
    // root. It is not proof that a new module is required.
    if (list.length) missingCandidates.push({ type, count: list.length, assets: list });
  }

  const lines = [
    '# Full Modular System Assembly', '',
    `Generated: ${new Date().toISOString()}`, '',
    '## Phase 1 — Existing modules', '',
    `Discovered module/system directories: ${modules.length}`,
    `Batch size: ${BATCH}`,
    'Phase 1 completion is determined by the persisted module-system assembler state.', '',
    '## Phase 2 — Remaining repository assets', '',
    `Remaining assets outside discovered module roots: ${assets.length}`, '',
    '| Asset type | Count |', '|---|---:|',
    ...Object.entries(byType).map(([k, v]) => `| ${k} | ${v.length} |`), '',
    '## Governance', '',
    '- No files are deleted by this orchestrator.',
    '- Unassigned assets are candidates for reconciliation, not automatic new modules.',
    '- A new module is created only after the asset purpose is established and no existing module owns it.',
    '- Phase 1 and Phase 2 remain separate.', '',
  ];
  fs.writeFileSync(REPORT, lines.join('\n'));

  const assetLines = [
    '# Remaining Asset Analysis', '',
    `Generated: ${new Date().toISOString()}`, '',
    'These files are outside the discovered module roots. They must be mapped to an existing system or evaluated as a missing-module candidate.', '',
  ];
  for (const [type, list] of Object.entries(byType)) {
    assetLines.push(`## ${type} (${list.length})`, '', ...list.map(p => `- ${p}`), '');
  }
  fs.writeFileSync(ASSET_REPORT, assetLines.join('\n'));

  console.log(JSON.stringify({
    commandComplete: true,
    phase1: 'completed-or-resumed',
    discoveredModules: modules.length,
    remainingAssets: assets.length,
    missingModuleCandidates: missingCandidates.length,
    report: path.relative(ROOT, REPORT),
    remainingAssetReport: path.relative(ROOT, ASSET_REPORT),
  }, null, 2));
}
main();
