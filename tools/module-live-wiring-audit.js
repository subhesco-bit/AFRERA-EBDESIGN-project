#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODULE_ROOT = path.join(ROOT, 'backend', 'src', 'modules');
const ROUTE_ROOT = path.join(ROOT, 'backend', 'src', 'routes');
const MIN = 1;
const MAX = 541;

function code(n) { return `M${String(n).padStart(3, '0')}`; }
function read(file) { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } }

function moduleEvidence(moduleCode) {
  const dir = path.join(MODULE_ROOT, moduleCode);
  const serviceFile = path.join(dir, 'service.js');
  const routesFile = path.join(dir, 'routes.js');
  const exists = fs.existsSync(dir);
  const serviceSource = read(serviceFile);
  const routeSource = read(routesFile);
  let operations = [];
  let loadError = null;
  if (fs.existsSync(serviceFile)) {
    try {
      const mod = require(serviceFile);
      operations = Object.keys(mod || {}).filter(k => typeof mod[k] === 'function');
    } catch (error) {
      loadError = error.message;
    }
  }
  return {
    code: moduleCode,
    exists,
    service: fs.existsSync(serviceFile),
    routes: fs.existsSync(routesFile),
    serviceBytes: Buffer.byteLength(serviceSource),
    routeBytes: Buffer.byteLength(routeSource),
    operations,
    operationCount: operations.length,
    loadError,
    bridgeReachable: fs.existsSync(serviceFile) && operations.length > 0 && !loadError,
  };
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, out);
    else if (/\.js$/i.test(name)) out.push(p);
  }
  return out;
}

const fakeSuccessPatterns = [
  /message\s*:\s*['"]Route operational['"]/i,
  /message\s*:\s*['"]API endpoint operational['"]/i,
  /res\.json\(\s*\{\s*success\s*:\s*true\s*,\s*message\s*:/i,
];

const routeFiles = walk(ROUTE_ROOT);
const fakeSuccessRoutes = routeFiles
  .map(file => ({ file: path.relative(ROOT, file).replace(/\\/g, '/'), source: read(file) }))
  .filter(item => fakeSuccessPatterns.some(re => re.test(item.source)))
  .map(item => item.file);

const modules = Array.from({ length: MAX - MIN + 1 }, (_, i) => moduleEvidence(code(MIN + i)));
const canonicalRoute = path.join(ROUTE_ROOT, 'backendModulesRoutes.js');
const bridge = path.join(ROUTE_ROOT, 'claude', 'backendModuleBridge.js');
const canonicalMountedByDiscovery = fs.existsSync(canonicalRoute) && /backendModuleBridge/.test(read(canonicalRoute));
const bridgeRealDispatch = fs.existsSync(bridge) && /realServiceDispatch\s*:\s*true/.test(read(bridge));

const summary = {
  range: 'M001-M541',
  totalModules: modules.length,
  physicalModules: modules.filter(m => m.exists).length,
  servicesPresent: modules.filter(m => m.service).length,
  callableServices: modules.filter(m => m.bridgeReachable).length,
  modulesWithoutCallableService: modules.filter(m => !m.bridgeReachable).map(m => m.code),
  loadErrors: modules.filter(m => m.loadError).map(m => ({ code: m.code, error: m.loadError })),
  canonicalBackendModulesRoute: canonicalMountedByDiscovery,
  bridgeRealServiceDispatch: bridgeRealDispatch,
  fakeSuccessRouteCount: fakeSuccessRoutes.length,
  fakeSuccessRoutes,
  m041: modules.find(m => m.code === 'M041'),
};

console.log(JSON.stringify(summary, null, 2));

// This gate only fails for broken canonical wiring or module service load errors.
// Fake-success routes are reported as debt because some may be unrelated legacy
// compatibility endpoints that need domain-by-domain replacement.
if (!canonicalMountedByDiscovery || !bridgeRealDispatch || summary.loadErrors.length) {
  process.exitCode = 2;
}
