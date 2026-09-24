/**
 * Generate concept/runtime hints from filesystem — reduces hand-drift.
 * Does not delete anything; only discovers paths for classification.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function safeList(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function scanModules(modulesRoot) {
  const root = modulesRoot || path.join(__dirname, '../../../modules');
  const entries = safeList(root);
  return entries
    .filter((d) => d.isDirectory() && /^M\d/.test(d.name))
    .map((d) => {
      const base = path.join(root, d.name);
      const hasBackend = fs.existsSync(path.join(base, 'backend')) || fs.existsSync(path.join(base, 'service.js'));
      const hasFrontend = fs.existsSync(path.join(base, 'frontend'));
      const hasJson = fs.existsSync(path.join(base, 'module.json'));
      let status = 'scaffolded';
      if (hasBackend && hasJson) status = 'partial';
      if (hasBackend && hasFrontend && hasJson) status = 'partial';
      return {
        id: `module.${d.name}`,
        name: d.name,
        path: `modules/${d.name}`,
        hasBackend,
        hasFrontend,
        hasJson,
        status,
        layer: 'module',
        source: 'code_scan',
      };
    });
}

function scanServices(servicesRoot) {
  const root = servicesRoot || path.join(__dirname, '../services');
  const entries = safeList(root);
  return entries
    .filter((d) => d.isFile() && d.name.endsWith('Service.js') || (d.isFile() && d.name.endsWith('.js') && !d.name.startsWith('_')))
    .slice(0, 400)
    .map((d) => ({
      id: `service.${d.name.replace(/\.js$/, '')}`,
      name: d.name,
      path: `backend/src/services/${d.name}`,
      status: 'partial',
      layer: 'service',
      source: 'code_scan',
    }));
}

function scanRoutes(routesRoot) {
  const root = routesRoot || path.join(__dirname, '../routes');
  return safeList(root)
    .filter((d) => d.isFile() && d.name.endsWith('.js'))
    .slice(0, 400)
    .map((d) => ({
      id: `route.${d.name.replace(/\.js$/, '')}`,
      name: d.name,
      path: `backend/src/routes/${d.name}`,
      status: 'partial',
      layer: 'route',
      source: 'code_scan',
    }));
}

function fullScan(opts = {}) {
  const modules = scanModules(opts.modulesRoot);
  const services = scanServices(opts.servicesRoot);
  const routes = scanRoutes(opts.routesRoot);
  const byStatus = {};
  for (const row of [...modules, ...services, ...routes]) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
  }
  return {
    generated_at: new Date().toISOString(),
    counts: {
      modules: modules.length,
      services: services.length,
      routes: routes.length,
      total: modules.length + services.length + routes.length,
    },
    by_status: byStatus,
    modules: modules.slice(0, opts.limit || 100),
    note: 'Full lists truncated in default response; pass limit. Classification starts as partial/scaffolded — human verify to verified.',
    source: 'code_scan',
  };
}

module.exports = { scanModules, scanServices, scanRoutes, fullScan };
