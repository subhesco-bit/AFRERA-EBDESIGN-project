/**
 * API Call Audit Script
 * Audits frontend pages for API calls and verifies backend route mounting
 * Usage: node scripts/api_audit.js
 */

const fs = require('fs');
const path = require('path');

const frontendPagesPath = path.join(__dirname, '../../frontend/src/pages');
const backendRoutesPath = path.join(__dirname, '../src/routes');
const backendIndexPath = path.join(__dirname, '../src/index.js');

console.log('🔍 Starting API Call Audit...');
console.log('');

// Get all frontend pages
const frontendPages = fs.readdirSync(frontendPagesPath)
  .filter(file => file.endsWith('.jsx'))
  .map(file => path.join(frontendPagesPath, file));

console.log('📊 Frontend Pages Found: ' + frontendPages.length);
console.log('');

// Get all backend route files
const backendRoutes = fs.existsSync(backendRoutesPath) 
  ? fs.readdirSync(backendRoutesPath)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(backendRoutesPath, file))
  : [];

console.log('📊 Backend Route Files Found: ' + backendRoutes.length);
console.log('');

// Analyze API calls in frontend pages
const apiCallResults = [];
const brokenAPIs = [];

frontendPages.forEach(pagePath => {
  const pageName = path.basename(pagePath);
  const content = fs.readFileSync(pagePath, 'utf8');
  
  // Find API calls (basic patterns)
  const apiPatterns = [
    /axios\.(get|post|put|delete|patch)\s*\(/g,
    /fetch\s*\(/g,
    /api\./g,
    /API\./g,
    /\/api\//g
  ];
  
  let hasAPICalls = false;
  const apiCalls = [];
  
  apiPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      hasAPICalls = true;
      apiCalls.push(...matches);
    }
  });
  
  if (hasAPICalls) {
    apiCallResults.push({
      page: pageName,
      hasAPICalls: true,
      apiCallCount: apiCalls.length,
      calls: apiCalls
    });
  } else {
    apiCallResults.push({
      page: pageName,
      hasAPICalls: false,
      apiCallCount: 0,
      calls: []
    });
  }
});

// Analyze backend route mounting
let backendIndexContent = '';
if (fs.existsSync(backendIndexPath)) {
  backendIndexContent = fs.readFileSync(backendIndexPath, 'utf8');
}

const mountedRoutes = [];
backendRoutes.forEach(routePath => {
  const routeName = path.basename(routePath);
  const routeContent = fs.readFileSync(routePath, 'utf8');
  
  // Check if route is mounted in index.js
  const isMounted = backendIndexContent.includes(routeName.replace('.js', ''));
  
  mountedRoutes.push({
    route: routeName,
    isMounted: isMounted
  });
});

// Generate report
console.log('📋 API CALL AUDIT REPORT');
console.log('========================');
console.log('');

const pagesWithAPI = apiCallResults.filter(r => r.hasAPICalls);
const pagesWithoutAPI = apiCallResults.filter(r => !r.hasAPICalls);

console.log('Pages with API calls: ' + pagesWithAPI.length);
console.log('Pages without API calls: ' + pagesWithoutAPI.length);
console.log('');

console.log('📱 PAGES WITHOUT API CALLS:');
console.log('==========================');
pagesWithoutAPI.forEach(result => {
  console.log('  - ' + result.page);
});
console.log('');

console.log('🔧 BACKEND ROUTE MOUNTING:');
console.log('==========================');
const unmountedRoutes = mountedRoutes.filter(r => !r.isMounted);
console.log('Mounted routes: ' + (mountedRoutes.length - unmountedRoutes.length));
console.log('Unmounted routes: ' + unmountedRoutes.length);

if (unmountedRoutes.length > 0) {
  console.log('');
  console.log('⚠️  UNMOUNTED ROUTES:');
  unmountedRoutes.forEach(route => {
    console.log('  - ' + route.route);
  });
}
console.log('');

// Save detailed report
const report = {
  auditDate: new Date().toISOString(),
  frontendPagesCount: frontendPages.length,
  backendRoutesCount: backendRoutes.length,
  pagesWithAPICalls: pagesWithAPI.length,
  pagesWithoutAPICalls: pagesWithoutAPI.length,
  mountedRoutes: mountedRoutes.length - unmountedRoutes.length,
  unmountedRoutes: unmountedRoutes.length,
  details: {
    apiCallResults,
    mountedRoutes
  }
};

fs.writeFileSync(
  path.join(__dirname, '../api_audit_report.json'),
  JSON.stringify(report, null, 2)
);

console.log('✅ Detailed report saved to backend/api_audit_report.json');
console.log('');
console.log('🎯 NEXT STEPS:');
console.log('1. Review pages without API calls - determine if API integration needed');
console.log('2. Verify unmounted backend routes should be mounted');
console.log('3. Test API connectivity for critical pages');
console.log('4. Fix any broken API integrations (like ordersAPI bug)');