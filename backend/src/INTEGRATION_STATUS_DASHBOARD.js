/**
 * INTEGRATION STATUS DASHBOARD
 * Central hub showing what's integrated, what's partial, what's missing
 * Accessible via: GET /api/debug/integration-status
 *
 * Rewritten 2026-09-20: the previous version of this file hardcoded every
 * number it returned (155/226 routes complete, 85/344 modules, 476 pages,
 * 1000 components, "422 migrations", "0 tables", a 7-10 week timeline, a
 * 4-6 person team roster) regardless of actual repo state, and served that
 * fiction from a live API endpoint. This version computes real values from
 * ROUTES_REGISTRY.js / SERVICES_REGISTRY.js / MODULES_REGISTRY.js (themselves
 * regenerated from a live boot + filesystem scan, not hand-typed) and from
 * direct filesystem checks. Anywhere a real answer cannot be mechanically
 * derived, it says so explicitly (`null` / "not derivable by static analysis")
 * rather than inventing a plausible-looking number.
 */

const fs = require('fs');
const path = require('path');
const { mountedRoutePaths, totalMounted } = require('./ROUTES_REGISTRY');
const { serviceFiles, totalFiles: totalServiceFiles } = require('./SERVICES_REGISTRY');
const { modules, totalModules } = require('./MODULES_REGISTRY');

const BACKEND_ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(BACKEND_ROOT, '..');

function countFilesRecursive(dir, extensions) {
  if (!fs.existsSync(dir)) return null;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFilesRecursive(full, extensions) || 0;
    else if (extensions.some(ext => entry.name.endsWith(ext))) count++;
  }
  return count;
}

function checkPackageDependency(pkgJsonPath, depName) {
  if (!fs.existsSync(pkgJsonPath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    return !!(pkg.dependencies?.[depName] || pkg.devDependencies?.[depName]);
  } catch {
    return null;
  }
}

class IntegrationStatusDashboard {
  /**
   * ROUTE STATUS -- from a real live-boot mount log (ROUTES_REGISTRY.js).
   * "Mounted" means the router loaded without error; it says nothing about
   * whether the handlers behind it contain real business logic.
   */
  getRoutesStatus() {
    return {
      mountedCount: totalMounted,
      note: 'Counts confirmed-mounted routes from a live boot (source: ROUTES_REGISTRY.js). Does not indicate handler completeness -- see modules status for that classification, and note most modules self-report as "generated".',
    };
  }

  /**
   * SERVICES STATUS -- real filesystem count. No complete/partial/skeleton
   * split is provided because that requires a per-file audit that hasn't
   * been done; the old version fabricated this split without doing one.
   */
  getServicesStatus() {
    return {
      totalServiceFiles,
      note: 'Real count of .js files under backend/src/services/ (source: SERVICES_REGISTRY.js, filesystem scan). Completeness classification per file has not been done -- do not treat file existence as feature completeness.',
    };
  }

  /**
   * MODULES STATUS -- real tally of each module's own module.json "status"
   * field. This is each module's own self-declaration, not an external audit.
   */
  getModulesStatus() {
    const byStatus = {};
    for (const m of modules) byStatus[m.declaredStatus] = (byStatus[m.declaredStatus] || 0) + 1;
    return {
      totalModules,
      byDeclaredStatus: byStatus,
      note: 'Tally of each module\'s own module.json "status" field (source: MODULES_REGISTRY.js). This is a self-declaration, not an independent audit -- module.json itself may be optimistic or stale for any given module.',
    };
  }

  /**
   * FRONTEND STATUS -- real recursive file counts.
   */
  getFrontendStatus() {
    const pagesDir = path.join(REPO_ROOT, 'frontend', 'src', 'pages');
    const componentsDir = path.join(REPO_ROOT, 'frontend', 'src', 'components');
    const modulesDir = path.join(REPO_ROOT, 'frontend', 'src', 'modules');
    return {
      pageFiles: countFilesRecursive(pagesDir, ['.jsx', '.tsx']),
      componentFiles: countFilesRecursive(componentsDir, ['.jsx', '.tsx']),
      moduleFiles: countFilesRecursive(modulesDir, ['.jsx', '.tsx']),
      note: 'Real recursive file counts under frontend/src/{pages,components,modules}. No completeness classification is attempted here.',
    };
  }

  /**
   * DATABASE STATUS -- real migration file count; execution status is a live
   * environment fact this process cannot assert without connecting, so it is
   * reported as unknown rather than guessed.
   */
  getDatabaseStatus() {
    const migrationsDir = path.join(BACKEND_ROOT, 'src', 'database', 'migrations');
    const migrationFileCount = fs.existsSync(migrationsDir)
      ? fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql') || f.endsWith('.js')).length
      : null;
    return {
      migrationFileCount,
      executionStatus: 'not checked by this endpoint -- query the live database connection to determine whether migrations have been applied',
    };
  }

  /**
   * INTEGRATIONS STATUS -- real check of whether each integration's SDK
   * package is declared as a dependency. This proves the package is
   * installed, not that the integration is correctly wired end-to-end.
   */
  getIntegrationsStatus() {
    const pkgPath = path.join(BACKEND_ROOT, 'package.json');
    const candidates = {
      stripe: 'stripe',
      aws_s3: 'aws-sdk',
      twilio: 'twilio',
      firebase: 'firebase-admin',
      razorpay: 'razorpay',
      elasticsearch: '@elastic/elasticsearch',
      mongodb: 'mongodb',
      redis: 'redis',
      socketio: 'socket.io',
      graphql: 'graphql',
    };
    const result = {};
    for (const [label, pkgName] of Object.entries(candidates)) {
      result[label] = { dependencyDeclared: checkPackageDependency(pkgPath, pkgName), package: pkgName };
    }
    return {
      dependencies: result,
      note: 'dependencyDeclared means the SDK package is listed in backend/package.json -- it does NOT confirm the integration is correctly wired, credentialed, or reachable at runtime.',
    };
  }

  /**
   * FULL DASHBOARD -- assembles the sections above. No fabricated phases,
   * timelines, team rosters, or blocker lists (the previous version's were
   * all hardcoded fiction); those require actual human/project-management
   * judgment, not something this endpoint should assert.
   */
  generateFullDashboard() {
    return {
      timestamp: new Date().toISOString(),
      routes: this.getRoutesStatus(),
      services: this.getServicesStatus(),
      modules: this.getModulesStatus(),
      frontend: this.getFrontendStatus(),
      database: this.getDatabaseStatus(),
      integrations: this.getIntegrationsStatus(),
    };
  }
}

/**
 * REGISTER DASHBOARD ENDPOINT
 * Endpoint surface preserved for existing callers; payloads are now honest.
 */
function registerDashboardEndpoint(router) {
  const dashboard = new IntegrationStatusDashboard();

  router.get('/api/debug/integration-status', (req, res) => {
    res.json(dashboard.generateFullDashboard());
  });

  router.get('/api/debug/status/routes', (req, res) => res.json(dashboard.getRoutesStatus()));
  router.get('/api/debug/status/services', (req, res) => res.json(dashboard.getServicesStatus()));
  router.get('/api/debug/status/modules', (req, res) => res.json(dashboard.getModulesStatus()));
  router.get('/api/debug/status/frontend', (req, res) => res.json(dashboard.getFrontendStatus()));
  router.get('/api/debug/status/database', (req, res) => res.json(dashboard.getDatabaseStatus()));
  router.get('/api/debug/status/integrations', (req, res) => res.json(dashboard.getIntegrationsStatus()));
}

module.exports = {
  IntegrationStatusDashboard,
  registerDashboardEndpoint,
};
