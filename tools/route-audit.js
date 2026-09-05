/**
 * Runtime route coverage audit.
 * The filesystem is the source of truth; hard-coded route lists go stale.
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.resolve(__dirname, '../backend/src/routes');
const indexFile = path.resolve(__dirname, '../backend/src/index.js');

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) return filesIn(fullPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

function audit() {
  const routeFiles = filesIn(routesDir);
  const failures = [];
  const loadableRoutes = [];

  for (const file of routeFiles) {
    try {
      const exported = require(file);
      const router = exported.router || exported.default || exported;
      if (typeof router !== 'function') {
        throw new TypeError('module does not export an Express router');
      }
      loadableRoutes.push(path.relative(process.cwd(), file));
    } catch (error) {
      failures.push({
        file: path.relative(process.cwd(), file),
        error: error.message.split('\n')[0]
      });
    }
  }

  const indexSource = fs.readFileSync(indexFile, 'utf8');
  const categories = {
    erp: routeFiles.filter(file => /erp|accounting|gst|cost|optimization/i.test(file)).length,
    ai: routeFiles.filter(file => /ai|intelligence|copilot|predictive/i.test(file)).length,
    analytics: routeFiles.filter(file => /analytic|report|dashboard/i.test(file)).length,
    admin: routeFiles.filter(file => /admin|governance|tenant|role/i.test(file)).length,
    notification: routeFiles.filter(file => /notification|message|alert/i.test(file)).length
  };

  const report = {
    routeFiles: routeFiles.length,
    loadableRoutes: loadableRoutes.length,
    failedRoutes: failures.length,
    dynamicLoaderConfigured: indexSource.includes('DynamicRouteLoader'),
    categories,
    failures
  };

  console.log(JSON.stringify(report, null, 2));
  return report;
}

if (require.main === module) {
  const report = audit();
  process.exitCode = report.failedRoutes > 0 || !report.dynamicLoaderConfigured ? 1 : 0;
}

module.exports = { audit };