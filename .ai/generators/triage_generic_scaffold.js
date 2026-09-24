// Triage all modules matching the generic CRUD scaffold pattern
// (this.defaultLimit = 20 signature) for real reachability: is there a
// require() of this module's service.js anywhere under backend/src/routes/
// (which DynamicRouteLoader auto-mounts), vs only referenced in docs/metadata.
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MODULES_DIR = path.join(__dirname, '..', '..', 'backend', 'src', 'modules');
const ROUTES_DIR = path.join(__dirname, '..', '..', 'backend', 'src', 'routes');
const SERVICES_DIR = path.join(__dirname, '..', '..', 'backend', 'src', 'services');

const scaffoldIds = fs.readdirSync(MODULES_DIR).filter((name) => {
  const svc = path.join(MODULES_DIR, name, 'service.js');
  if (!fs.existsSync(svc)) return false;
  const src = fs.readFileSync(svc, 'utf8');
  return src.includes('this.defaultLimit = 20') && src.includes('validateInput(data, allowedFields)');
});

function grepRequirers(id) {
  try {
    const out = execSync(
      `grep -rl "modules/${id}/service\\|modules/${id}'\\|modules/${id}\\"" "${ROUTES_DIR}" "${SERVICES_DIR}" 2>/dev/null`,
      { encoding: 'utf8', shell: 'C:\\Program Files\\Git\\bin\\bash.exe' },
    ).trim();
    return out ? out.split('\n') : [];
  } catch {
    return [];
  }
}

const results = scaffoldIds.map((id) => {
  const requirers = grepRequirers(id);
  const mountedRouteRequirer = requirers.some((f) => f.replace(/\\/g, '/').includes('/routes/'));
  return { id, requirers, mountedRouteRequirer };
});

const reachable = results.filter((r) => r.mountedRouteRequirer);
const onlyServiceLayer = results.filter((r) => !r.mountedRouteRequirer && r.requirers.length > 0);
const unreferenced = results.filter((r) => r.requirers.length === 0);

console.error('SUMMARY:', JSON.stringify({
  totalScaffoldModules: scaffoldIds.length,
  reachableViaRoutes: reachable.length,
  onlyServiceLayerRef: onlyServiceLayer.length,
  unreferenced: unreferenced.length,
}));
console.log(JSON.stringify({ results, reachableIds: reachable.map((r) => r.id) }, null, 2));
