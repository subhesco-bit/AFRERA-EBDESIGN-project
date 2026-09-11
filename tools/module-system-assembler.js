#!/usr/bin/env node
/**
 * Complete Modular System Assembler
 *
 * Reconciles the existing repository into complete, self-contained systems
 * without deleting or replacing existing modules/files.
 *
 * Execution model:
 *   - discovers canonical modules under /modules
 *   - processes exactly five pending modules per batch by default
 *   - persists after every batch
 *   - automatically loops until every discovered module is classified
 *   - never fabricates completion
 *
 * The command is intentionally an assembler/reconciliation layer. It records
 * what is actually present and what remains incomplete; it does not turn a
 * missing implementation into a false COMPLETE status.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODULE_ROOT = path.join(ROOT, 'modules');
const STATE_DIR = path.join(ROOT, '.ai', 'system-assembly');
const STATE_FILE = path.join(STATE_DIR, 'ASSEMBLY_STATE.json');
const REPORT_FILE = path.join(STATE_DIR, 'ASSEMBLY_REPORT.md');
const BATCH_SIZE = Number(process.env.SYSTEM_BATCH_SIZE || 5);

const REQUIRED_LAYERS = [
  'purpose', 'requirements', 'features', 'backend', 'api', 'database',
  'frontend', 'workflow', 'security', 'testing',
];

const exists = (p) => fs.existsSync(p);
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; } };

function listDirs(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
}

function findFiles(dir) {
  const out = [];
  function walk(current) {
    if (!exists(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const p = path.join(current, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(js|jsx|ts|tsx|json|md|sql|yml|yaml)$/.test(p)) out.push(p);
    }
  }
  walk(dir);
  return out;
}

function discover() {
  return listDirs(MODULE_ROOT)
    .filter(name => /^M\d+_/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function assessModule(name) {
  const moduleDir = path.join(MODULE_ROOT, name);
  const manifest = readJson(path.join(moduleDir, 'module.json')) || {};
  const files = findFiles(moduleDir);
  const text = files.map(p => fs.readFileSync(p, 'utf8')).join('\n').toLowerCase();
  const moduleId = manifest.moduleId || name;
  const shortId = moduleId.match(/^M\d+/)?.[0];
  const backendCandidates = [
    path.join(ROOT, 'backend', 'src', 'modules', moduleId),
    path.join(ROOT, 'backend', 'src', 'modules', name),
    shortId && path.join(ROOT, 'backend', 'src', 'modules', shortId),
  ].filter(Boolean);
  const backendDir = backendCandidates.find(exists);

  const evidence = {
    moduleId,
    name: manifest.name || name,
    description: manifest.description || null,
    category: manifest.category || null,
    declaredStatus: manifest.status || null,
    dependencies: manifest.dependencies || {},
    purpose: Boolean(manifest.description || manifest.discovery?.aiContext || manifest.discovery?.useCases?.length),
    requirements: Boolean(manifest.requirements || manifest.discovery?.useCases?.length || /requirement|use case|needs/.test(text)),
    features: Boolean(manifest.discovery?.capabilities?.length || /feature|capabilit|crud|create|update|delete|list/.test(text)),
    backend: Boolean(backendDir) || /service\.js|controller\.js|routes\.js/.test(text),
    api: Boolean(manifest.execution?.api?.baseEndpoint) || /routes\.js|openapi|endpoint|api\/v1/.test(text),
    database: Boolean(manifest.dataModels) || /model\.sql|migration|create table|database|postgres/.test(text),
    frontend: Boolean(manifest.execution?.frontend) || /frontend|\.jsx|\.tsx|react|component/.test(text),
    workflow: /workflow|job|queue|event|scheduler|cron/.test(text),
    security: /auth|permission|role|rbac|security|encrypt/.test(text),
    testing: Boolean(manifest.testing) || /test|jest|supertest|coverage/.test(text),
    sourcePath: path.relative(ROOT, moduleDir),
    backendPath: backendDir ? path.relative(ROOT, backendDir) : null,
  };
  evidence.missing = REQUIRED_LAYERS.filter(k => !evidence[k]);
  evidence.status = evidence.missing.length === 0 ? 'COMPLETE' : 'INCOMPLETE';
  return evidence;
}

function loadState(modules) {
  const prior = exists(STATE_FILE) ? readJson(STATE_FILE) : null;
  if (prior && Array.isArray(prior.modules)) {
    const known = new Set(prior.modules.map(m => m.name));
    for (const name of modules) if (!known.has(name)) prior.modules.push({ name, status: 'PENDING', attempts: 0 });
    return prior;
  }
  return {
    schemaVersion: 1,
    batchSize: BATCH_SIZE,
    startedAt: new Date().toISOString(),
    cursor: 0,
    completed: false,
    modules: modules.map(name => ({ name, status: 'PENDING', attempts: 0 })),
    batchHistory: [],
  };
}

function persist(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
  const complete = state.modules.filter(m => m.status === 'COMPLETE').length;
  const incomplete = state.modules.filter(m => m.status === 'INCOMPLETE').length;
  const pending = state.modules.filter(m => m.status === 'PENDING').length;
  const rows = state.modules.map(m => `| ${m.moduleId || m.name} | ${m.systemName || '—'} | ${m.status} | ${(m.missing || []).join(', ') || '—'} |`);
  fs.writeFileSync(REPORT_FILE, [
    '# Complete Modular System Assembly', '',
    `Generated: ${new Date().toISOString()}`, '',
    '| Metric | Count |', '|---|---:|',
    `| Discovered modules | ${state.modules.length} |`,
    `| Complete systems | ${complete} |`,
    `| Incomplete systems | ${incomplete} |`,
    `| Pending systems | ${pending} |`, '',
    '## System Status', '',
    '| Module | System | Status | Missing layers |', '|---|---|---|---|',
    ...rows, '',
    '## Rule', '',
    'A system is COMPLETE only when evidence exists for purpose, requirements, features, backend, API, database, frontend, workflow, security and testing. Runtime correctness still requires verification/tests. The assembler never fabricates completion.', '',
    `## Overall: ${pending === 0 ? 'ASSEMBLY COMPLETE' : 'ASSEMBLY IN PROGRESS'}`, '',
  ].join('\n'));
}

function processBatch(state) {
  const pendingIndexes = state.modules.map((m, i) => m.status === 'PENDING' ? i : -1).filter(i => i >= 0);
  const indexes = pendingIndexes.slice(0, BATCH_SIZE);
  for (const index of indexes) {
    const item = state.modules[index];
    const result = assessModule(item.name);
    item.attempts = (item.attempts || 0) + 1;
    item.moduleId = result.moduleId;
    item.systemName = `${result.name} System`;
    item.status = result.status;
    item.missing = result.missing;
    item.evidence = result;
    item.lastCheckedAt = new Date().toISOString();
  }
  state.cursor = state.modules.findIndex(m => m.status === 'PENDING');
  if (state.cursor < 0) state.cursor = state.modules.length;
  state.completed = !state.modules.some(m => m.status === 'PENDING');
  state.batchHistory.push({
    batchNumber: state.batchHistory.length + 1,
    indexes,
    moduleNames: indexes.map(i => state.modules[i].name),
    completedAt: new Date().toISOString(),
  });
  return indexes.length;
}

function main() {
  if (!Number.isInteger(BATCH_SIZE) || BATCH_SIZE < 1) throw new Error('SYSTEM_BATCH_SIZE must be a positive integer');
  const modules = discover();
  const state = loadState(modules);
  let totalProcessedThisRun = 0;

  // Five-at-a-time loop. Persist after every batch so an interrupted run can
  // resume without repeating already classified modules.
  while (state.modules.some(m => m.status === 'PENDING')) {
    const processed = processBatch(state);
    totalProcessedThisRun += processed;
    persist(state);
    if (processed === 0) break;
  }

  const complete = state.modules.filter(m => m.status === 'COMPLETE').length;
  const incomplete = state.modules.filter(m => m.status === 'INCOMPLETE').length;
  const pending = state.modules.filter(m => m.status === 'PENDING').length;
  console.log(JSON.stringify({
    processedThisRun: totalProcessedThisRun,
    batchSize: BATCH_SIZE,
    batchesRunThisInvocation: Math.ceil(totalProcessedThisRun / BATCH_SIZE),
    totalDiscovered: state.modules.length,
    completeSystems: complete,
    incompleteSystems: incomplete,
    pendingSystems: pending,
    commandComplete: state.completed,
    report: path.relative(ROOT, REPORT_FILE),
    state: path.relative(ROOT, STATE_FILE),
  }, null, 2));
}
main();
