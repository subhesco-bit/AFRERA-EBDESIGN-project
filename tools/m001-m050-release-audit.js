#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const backend = path.join(ROOT, 'backend');
const frontend = path.join(ROOT, 'frontend');
const assurance = require(path.join(backend, 'src/services/moduleProductionAssuranceService'));
const enterprise = require(path.join(backend, 'src/services/m001m050EnterpriseProductService'));
const experience = require(path.join(backend, 'src/services/m001m050OperationalExperienceService'));
const ai = require(path.join(backend, 'src/services/m001m050HighestStandardEnhancementService'));
const workflow = require(path.join(backend, 'src/services/m001m050WorkflowOrchestrationService'));

const sharedRequired = [
  'backend/src/routes/m001m050EnterpriseProductRoutes.js',
  'backend/src/routes/m001m050OperationalExperienceRoutes.js',
  'backend/src/routes/m001m050WorkflowOrchestrationRoutes.js',
  'backend/src/routes/m001m050HighestStandardRoutes.js',
  'backend/src/services/m001m050EnterpriseProductService.js',
  'backend/src/services/m001m050OperationalExperienceService.js',
  'backend/src/services/m001m050WorkflowOrchestrationService.js',
  'backend/src/services/m001m050HighestStandardEnhancementService.js',
  'backend/src/database/migrations/20260911_m001_m050_operational_erp.sql',
  'backend/src/database/migrations/20260911_m001_m050_highest_standard.sql',
  'frontend/src/components/M001M050OperationalWorkspace.jsx',
  'frontend/src/components/M001M050HighestStandardPanel.jsx',
  'frontend/src/components/M001M050ProductionWiredPanel.jsx',
  'frontend/src/services/m001m050OperationalApi.js',
  'frontend/src/App.jsx'
];

function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function code(n) { return `M${String(n).padStart(3, '0')}`; }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function authProtected(rel) {
  if (!exists(rel)) return false;
  const s = read(rel);
  return /authMiddleware|router\.use\(auth|ProtectedRoute|RoleRoute/.test(s);
}
function hasExecutableExport(servicePath) {
  try {
    const mod = require(path.join(ROOT, servicePath));
    return Object.values(mod || {}).some(v => typeof v === 'function');
  } catch (error) {
    return { error: error.message };
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  batch: 'M001-M050',
  shared: [],
  modules: [],
  totals: { modules: 50, passed: 0, failed: 0 },
  releaseReady: false
};

for (const rel of sharedRequired) report.shared.push({ path: rel, exists: exists(rel) });

for (let n = 1; n <= 50; n += 1) {
  const c = code(n);
  const backendDir = `backend/src/modules/${c}`;
  const servicePath = `${backendDir}/service.js`;
  const routesPath = `${backendDir}/routes.js`;
  const pagePath = `frontend/src/modules/${c}/${c}Page.jsx`;
  const contract = assurance.CONTRACTS[c];
  const spec = enterprise.spec(c);
  const operational = experience.profile(c);
  const aiProfile = ai.profile(c);
  const executable = exists(servicePath) ? hasExecutableExport(servicePath) : false;
  const workflowDefined = Array.isArray(spec.workflow) && spec.workflow.length >= 4;
  let transitionRule = false;
  try { transitionRule = workflow.assertTransition(c, spec.workflow[0], spec.workflow[1]) === true; } catch { transitionRule = false; }
  const checks = {
    contract: Boolean(contract),
    service: exists(servicePath),
    routes: exists(routesPath),
    page: exists(pagePath),
    executableService: executable === true || (typeof executable === 'boolean' ? executable : false),
    workflow: workflowDefined && transitionRule,
    erpControls: Array.isArray(spec.erpControls) && spec.erpControls.length >= 6,
    uxStandards: Array.isArray(spec.uxStandards) && spec.uxStandards.length >= 8,
    middlewareContract: Array.isArray(spec.middleware) && spec.middleware.includes('authn') && spec.middleware.includes('rbac_abac'),
    decisions: Array.isArray(spec.decisionControls) && spec.decisionControls.includes('maker_checker'),
    integrations: Array.isArray(spec.integrations) && spec.integrations.length >= 4,
    visualizations: Array.isArray(spec.visualizations) && spec.visualizations.length >= 3,
    aiGoverned: aiProfile.authoritative === false || aiProfile.autonomousConsequentialAction === false,
    operationalProfile: Boolean(operational?.code),
    frontendProtected: authProtected('frontend/src/App.jsx'),
    sharedApiProtected: authProtected('backend/src/routes/m001m050EnterpriseProductRoutes.js') && authProtected('backend/src/routes/m001m050WorkflowOrchestrationRoutes.js')
  };
  const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  const passed = failures.length === 0;
  report.modules.push({ code: c, name: contract?.name, checks, failures, passed, serviceLoadError: executable?.error || null });
  if (passed) report.totals.passed += 1; else report.totals.failed += 1;
}

const missingShared = report.shared.filter(x => !x.exists).map(x => x.path);
report.releaseReady = report.totals.failed === 0 && missingShared.length === 0;
report.missingShared = missingShared;

const out = path.join(ROOT, '.ai/production-hardening/m001-m050-release');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'REPORT.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.releaseReady) process.exitCode = 2;
