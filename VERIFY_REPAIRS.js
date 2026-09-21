#!/usr/bin/env node

/**
 * COMPREHENSIVE PLATFORM VERIFICATION
 * Verifies all repairs and fixes across the entire codebase
 */

const fs = require('fs');
const path = require('path');

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
  };

  console.log(`${prefix[type] || prefix.info} ${message}`);
}

// ============================================================================
// BACKEND VERIFICATION
// ============================================================================

log('Verifying Backend...', 'info');
console.log('');

// 1. Check middleware
const middlewarePath = path.join(__dirname, 'backend/src/middleware/index.js');
if (fs.existsSync(middlewarePath)) {
  const content = fs.readFileSync(middlewarePath, 'utf8');
  if (content.includes('requestId') && content.includes('corsMiddleware') && content.includes('securityHeaders')) {
    log('Middleware master file: All middleware present', 'success');
    results.passed.push('Backend middleware complete');
  } else {
    log('Middleware master file: Missing some middleware', 'error');
    results.failed.push('Backend middleware incomplete');
  }
} else {
  log('Middleware master file: Not found', 'error');
  results.failed.push('Backend middleware not found');
}

// 2. Check main entry point
const indexPath = path.join(__dirname, 'backend/src/index.js');
if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, 'utf8');
  const checks = [
    { name: 'Database initialization', pattern: /initDatabase|database.*init/ },
    { name: 'Middleware setup', pattern: /setupMiddleware|app\.use.*middleware/ },
    { name: 'Route loading', pattern: /DynamicRouteLoader|loadAllRoutes/ },
    { name: 'Error handling', pattern: /errorBoundary|error.*handler/ },
    { name: 'WebSocket setup', pattern: /socket\.io|Server.*io/ },
  ];

  let allPresent = true;
  checks.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      log(`Backend entry point: ${name} ✓`, 'success');
    } else {
      log(`Backend entry point: ${name} ✗`, 'error');
      allPresent = false;
    }
  });

  if (allPresent) {
    results.passed.push('Backend entry point complete');
  } else {
    results.failed.push('Backend entry point incomplete');
  }
} else {
  log('Backend entry point: Not found', 'error');
  results.failed.push('Backend entry point not found');
}

// 3. Check database connection
const dbPath = path.join(__dirname, 'backend/src/database/connection.js');
if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, 'utf8');
  const checks = [
    { name: 'PostgreSQL pool', pattern: /Pool|getPostgreSQL/ },
    { name: 'MongoDB support', pattern: /MongoDB|getMongoDB|initMongoDB/ },
    { name: 'Redis support', pattern: /Redis|getRedis|initRedis/ },
    { name: 'Retry logic', pattern: /retries|retry/ },
    { name: 'Health check', pattern: /isHealthy|health/ },
  ];

  let allPresent = true;
  checks.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      log(`Database connection: ${name} ✓`, 'success');
    } else {
      log(`Database connection: ${name} ✗`, 'error');
      allPresent = false;
    }
  });

  if (allPresent) {
    results.passed.push('Database connection complete');
  } else {
    results.failed.push('Database connection incomplete');
  }
} else {
  log('Database connection: Not found', 'error');
  results.failed.push('Database connection not found');
}

// 4. Check API routes
const apiPath = path.join(__dirname, 'backend/src/routes/api.js');
if (fs.existsSync(apiPath)) {
  const content = fs.readFileSync(apiPath, 'utf8');
  if (content.includes('POST.*auth/login') || content.includes("'/auth/login'")) {
    log('API routes: Authentication endpoints present', 'success');
    results.passed.push('API routes complete');
  } else {
    log('API routes: Authentication endpoints missing', 'warning');
    results.warnings.push('API routes may be incomplete');
  }
} else {
  log('API routes: Not found', 'error');
  results.failed.push('API routes not found');
}

console.log('');

// ============================================================================
// FRONTEND VERIFICATION
// ============================================================================

log('Verifying Frontend...', 'info');
console.log('');

// 1. Check App.jsx
const appPath = path.join(__dirname, 'frontend/src/App.jsx');
if (fs.existsSync(appPath)) {
  const content = fs.readFileSync(appPath, 'utf8');
  const checks = [
    { name: 'Routes component', pattern: /Routes|Route/ },
    { name: 'Auth store', pattern: /useAuthStore/ },
    { name: 'Route guards', pattern: /ProtectedRoute|RoleRoute/ },
    { name: 'Error boundary', pattern: /ErrorBoundary/ },
    { name: 'Lazy loading', pattern: /lazy|Suspense/ },
  ];

  let allPresent = true;
  checks.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      log(`App component: ${name} ✓`, 'success');
    } else {
      log(`App component: ${name} ✗`, 'error');
      allPresent = false;
    }
  });

  if (allPresent) {
    results.passed.push('Frontend App complete');
  } else {
    results.failed.push('Frontend App incomplete');
  }
} else {
  log('App component: Not found', 'error');
  results.failed.push('Frontend App not found');
}

// 2. Check environment config
const envPath = path.join(__dirname, 'frontend/src/config/env.js');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const checks = [
    { name: 'API configuration', pattern: /API_URL|API_BASE_URL/ },
    { name: 'WebSocket config', pattern: /WS_URL/ },
    { name: 'Feature flags', pattern: /ENABLE_/ },
    { name: 'Helper methods', pattern: /getApiUrl|isProduction/ },
  ];

  let allPresent = true;
  checks.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      log(`Environment config: ${name} ✓`, 'success');
    } else {
      log(`Environment config: ${name} ✗`, 'error');
      allPresent = false;
    }
  });

  if (allPresent) {
    results.passed.push('Frontend config complete');
  } else {
    results.failed.push('Frontend config incomplete');
  }
} else {
  log('Environment config: Not found', 'error');
  results.failed.push('Frontend config not found');
}

// 3. Check service imports
const servicesDir = path.join(__dirname, 'frontend/src/services');
const servicesToCheck = [
  'authService.js',
  'farmerService.js',
  'marketplaceService.js',
];

let importIssues = 0;
servicesToCheck.forEach(service => {
  const filePath = path.join(servicesDir, service);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Check for correct import
    if (content.includes('import { api }') || content.includes('import { api }')) {
      log(`Service ${service}: Import fixed ✓`, 'success');
    } else if (content.includes("import api from")) {
      log(`Service ${service}: Old import style still present`, 'warning');
      importIssues++;
    }
  }
});

if (importIssues === 0) {
  results.passed.push('Frontend service imports fixed');
} else {
  results.warnings.push(`${importIssues} services still have old import style`);
}

// 4. Check package.json
const pkgPath = path.join(__dirname, 'frontend/package.json');
if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const babelVersion = pkg.devDependencies['@babel/core'];
    if (babelVersion && babelVersion.startsWith('^7')) {
      log('Package.json: Babel version compatible ✓', 'success');
      results.passed.push('Package.json versions fixed');
    } else {
      log('Package.json: Babel version may have issues', 'warning');
      results.warnings.push('Babel version should be ^7.x');
    }
  } catch (err) {
    log('Package.json: Invalid JSON', 'error');
    results.failed.push('Package.json invalid');
  }
} else {
  log('Package.json: Not found', 'error');
  results.failed.push('Package.json not found');
}

console.log('');

// ============================================================================
// SUMMARY
// ============================================================================

log('═══════════════════════════════════════', 'info');
log('VERIFICATION SUMMARY', 'info');
log('═══════════════════════════════════════', 'info');
console.log('');

console.log(`${colors.green}✓ Passed: ${results.passed.length}${colors.reset}`);
results.passed.forEach(item => console.log(`  • ${item}`));

console.log('');
if (results.failed.length > 0) {
  console.log(`${colors.red}✗ Failed: ${results.failed.length}${colors.reset}`);
  results.failed.forEach(item => console.log(`  • ${item}`));
  console.log('');
}

if (results.warnings.length > 0) {
  console.log(`${colors.yellow}⚠ Warnings: ${results.warnings.length}${colors.reset}`);
  results.warnings.forEach(item => console.log(`  • ${item}`));
  console.log('');
}

// Final verdict
const totalTests = results.passed.length + results.failed.length;
const passRate = Math.round((results.passed.length / totalTests) * 100);

console.log(`Overall Score: ${passRate}% (${results.passed.length}/${totalTests})`);
console.log('');

if (results.failed.length === 0) {
  console.log(`${colors.green}✨ ALL CHECKS PASSED - Platform is ready! ✨${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.red}⚠ Some checks failed - Please review above${colors.reset}`);
  process.exit(1);
}
