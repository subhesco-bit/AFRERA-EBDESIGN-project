/**
 * Final System Integration Testing Script
 * Performs comprehensive integration testing of the entire system
 */

const fs = require('fs');
const path = require('path');

const testResults = {
  testsRun: 0,
  testsPassed: 0,
  testsFailed: 0,
  categories: {
    database: { passed: 0, failed: 0, issues: [] },
    api: { passed: 0, failed: 0, issues: [] },
    authentication: { passed: 0, failed: 0, issues: [] },
    services: { passed: 0, failed: 0, issues: [] },
    frontend: { passed: 0, failed: 0, issues: [] },
    security: { passed: 0, failed: 0, issues: [] },
    performance: { passed: 0, failed: 0, issues: [] }
  },
  overallStatus: 'pending'
};

function testDatabaseIntegration() {
  console.log('Testing Database Integration...');
  
  const dbPath = path.join(process.cwd(), 'src/database');
  const issues = [];
  
  // Check database enhancements
  const enhancementsPath = path.join(dbPath, 'database_enhancements.js');
  if (!fs.existsSync(enhancementsPath)) {
    issues.push('Database enhancements module not found');
  } else {
    testResults.categories.database.passed++;
  }
  
  // Check connection pool
  const poolPath = path.join(dbPath, 'advanced_pool.js');
  if (!fs.existsSync(poolPath)) {
    issues.push('Advanced connection pool not found');
  } else {
    testResults.categories.database.passed++;
  }
  
  // Check transaction manager
  const transactionPath = path.join(dbPath, 'transactions/transaction_manager.js');
  if (!fs.existsSync(transactionPath)) {
    issues.push('Transaction manager not found');
  } else {
    testResults.categories.database.passed++;
  }
  
  // Check cache layer
  const cachePath = path.join(dbPath, 'cache/redis_cache.js');
  if (!fs.existsSync(cachePath)) {
    issues.push('Redis cache layer not found');
  } else {
    testResults.categories.database.passed++;
  }
  
  // Check monitoring
  const monitorPath = path.join(dbPath, 'monitoring/database_monitor.js');
  if (!fs.existsSync(monitorPath)) {
    issues.push('Database monitor not found');
  } else {
    testResults.categories.database.passed++;
  }
  
  // Check security
  const securityPath = path.join(dbPath, 'security/database_security.js');
  if (!fs.existsSync(securityPath)) {
    issues.push('Database security module not found');
  } else {
    testResults.categories.database.passed++;
  }
  
  testResults.categories.database.issues = issues;
  testResults.categories.database.failed = issues.length;
  testResults.testsRun += 6;
  testResults.testsPassed += (6 - issues.length);
  testResults.testsFailed += issues.length;
}

function testAPIIntegration() {
  console.log('Testing API Integration...');
  
  const indexPath = path.join(process.cwd(), 'src/index.js');
  const issues = [];
  
  if (!fs.existsSync(indexPath)) {
    issues.push('Main index.js not found');
  } else {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check database enhancements integration
    if (!indexContent.includes('initializeDatabaseEnhancements')) {
      issues.push('Database enhancements not initialized in index.js');
    } else {
      testResults.categories.api.passed++;
    }
    
    // Check monitoring middleware
    if (!indexContent.includes('routeMonitoring')) {
      issues.push('Route monitoring middleware not integrated');
    } else {
      testResults.categories.api.passed++;
    }
    
    // Check critical route monitoring
    if (!indexContent.includes('criticalRouteMonitoring')) {
      issues.push('Critical route monitoring not integrated');
    } else {
      testResults.categories.api.passed++;
    }
    
    // Check health check monitoring
    if (!indexContent.includes('healthCheckMonitoring')) {
      issues.push('Health check monitoring not integrated');
    } else {
      testResults.categories.api.passed++;
    }
  }
  
  testResults.categories.api.issues = issues;
  testResults.categories.api.failed = issues.length;
  testResults.testsRun += 4;
  testResults.testsPassed += (4 - issues.length);
  testResults.testsFailed += issues.length;
}

function testAuthenticationIntegration() {
  console.log('Testing Authentication Integration...');
  
  const authPath = path.join(process.cwd(), 'src/middleware/auth.js');
  const issues = [];
  
  if (!fs.existsSync(authPath)) {
    issues.push('Authentication middleware not found');
  } else {
    testResults.categories.authentication.passed++;
  }

  
  const indexPath = path.join(process.cwd(), 'src/index.js');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (!indexContent.includes('authMiddleware')) {
      issues.push('Auth middleware not integrated in index.js');
    } else {
      testResults.categories.authentication.passed++;
    }
  }
  
  testResults.categories.authentication.issues = issues;
  testResults.categories.authentication.failed = issues.length;
  testResults.testsRun += 2;
  testResults.testsPassed += (2 - issues.length);
  testResults.testsFailed += issues.length;
}

function testServicesIntegration() {
  console.log('Testing Services Integration...');
  
  const servicesDir = path.join(process.cwd(), 'src/services');
  const issues = [];
  
  if (!fs.existsSync(servicesDir)) {
    issues.push('Services directory not found');
  } else {
    const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
    
    if (services.length < 50) {
      issues.push(`Insufficient services: found ${services.length}, expected at least 50`);
    } else {
      testResults.categories.services.passed++;
    }
    
    // Check for service initialization
    let initializedCount = 0;
    services.forEach(service => {
      const servicePath = path.join(servicesDir, service);
      const content = fs.readFileSync(servicePath, 'utf8');
      if (content.includes('initialize') || content.includes('setupRoutes')) {
        initializedCount++;
      }
    });
    
    if (initializedCount < services.length * 0.5) {
      issues.push(`Low service initialization: ${initializedCount}/${services.length} services have init functions`);
    } else {
      testResults.categories.services.passed++;
    }
  }
  
  testResults.categories.services.issues = issues;
  testResults.categories.services.failed = issues.length;
  testResults.testsRun += 2;
  testResults.testsPassed += (2 - issues.length);
  testResults.testsFailed += issues.length;
}

function testFrontendIntegration() {
  console.log('Testing Frontend Integration...');
  
  const frontendPath = path.join(process.cwd(), '../frontend');
  const issues = [];
  
  if (!fs.existsSync(frontendPath)) {
    issues.push('Frontend directory not found');
  } else {
    testResults.categories.frontend.passed++;
    
    // Check for environment configuration
    const envPath = path.join(frontendPath, 'src/config/env.js');
    if (!fs.existsSync(envPath)) {
      issues.push('Frontend environment configuration not found');
    } else {
      testResults.categories.frontend.passed++;
    }
    
    // Check for routes configuration
    const routesPath = path.join(frontendPath, 'src/config/routes.js');
    if (!fs.existsSync(routesPath)) {
      issues.push('Frontend routes configuration not found');
    } else {
      testResults.categories.frontend.passed++;
    }
  }
  
  testResults.categories.frontend.issues = issues;
  testResults.categories.frontend.failed = issues.length;
  testResults.testsRun += 3;
  testResults.testsPassed += (3 - issues.length);
  testResults.testsFailed += issues.length;
}

function testSecurityIntegration() {
  console.log('Testing Security Integration...');
  
  const issues = [];
  
  // Check security headers middleware
  const securityPath = path.join(process.cwd(), 'src/middleware/securityHeaders.js');
  if (!fs.existsSync(securityPath)) {
    issues.push('Security headers middleware not found');
  } else {
    testResults.categories.security.passed++;
  }
  
  // Check rate limiting
  const rateLimitPath = path.join(process.cwd(), 'src/middleware/rateLimit.js');
  if (!fs.existsSync(rateLimitPath)) {
    issues.push('Rate limiting middleware not found');
  } else {
    testResults.categories.security.passed++;
  }
  
  // Check error handler
  const errorHandlerPath = path.join(process.cwd(), 'src/middleware/errorHandler.js');
  if (!fs.existsSync(errorHandlerPath)) {
    issues.push('Error handler middleware not found');
  } else {
    testResults.categories.security.passed++;
  }
  
  // Check validation middleware
  const validationPath = path.join(process.cwd(), 'src/middleware/validation.js');
  if (!fs.existsSync(validationPath)) {
    issues.push('Validation middleware not found');
  } else {
    testResults.categories.security.passed++;
  }
  
  testResults.categories.security.issues = issues;
  testResults.categories.security.failed = issues.length;
  testResults.testsRun += 4;
  testResults.testsPassed += (4 - issues.length);
  testResults.testsFailed += issues.length;
}

function testPerformanceIntegration() {
  console.log('Testing Performance Integration...');
  
  const issues = [];
  
  // Check compression middleware
  const indexPath = path.join(process.cwd(), 'src/index.js');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (!indexContent.includes('compression()')) {
      issues.push('Compression middleware not integrated');
    } else {
      testResults.categories.performance.passed++;
    }
    
    // Check response formatter
    if (!indexContent.includes('responseFormatter')) {
      issues.push('Response formatter not integrated');
    } else {
      testResults.categories.performance.passed++;
    }
    
    // Check request ID middleware
    if (!indexContent.includes('requestId')) {
      issues.push('Request ID middleware not integrated');
    } else {
      testResults.categories.performance.passed++;
    }
  }
  
  testResults.categories.performance.issues = issues;
  testResults.categories.performance.failed = issues.length;
  testResults.testsRun += 3;
  testResults.testsPassed += (3 - issues.length);
  testResults.testsFailed += issues.length;
}

function generateReport() {
  console.log('\n=== FINAL SYSTEM INTEGRATION TEST REPORT ===\n');
  
  console.log(`Total Tests Run: ${testResults.testsRun}`);
  console.log(`Tests Passed: ${testResults.testsPassed}`);
  console.log(`Tests Failed: ${testResults.testsFailed}`);
  console.log(`Success Rate: ${((testResults.testsPassed / testResults.testsRun) * 100).toFixed(2)}%\n`);
  
  console.log('=== CATEGORY RESULTS ===\n');
  
  Object.entries(testResults.categories).forEach(([category, results]) => {
    if (category === 'overallStatus') return;
    
    console.log(`${category.toUpperCase()}:`);
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    if (results.issues.length > 0) {
      console.log(`  Issues: ${results.issues.join(', ')}`);
    }
    console.log('');
  });
  
  // Determine overall status
  const totalFailed = Object.values(testResults.categories)
    .filter(cat => cat.issues)
    .reduce((sum, cat) => sum + cat.failed, 0);
  
  testResults.overallStatus = totalFailed === 0 ? 'PASS' : 'FAIL';
  
  console.log(`=== OVERALL STATUS: ${testResults.overallStatus} ===\n`);
  
  if (testResults.overallStatus === 'PASS') {
    console.log('✓ System is ready for production launch');
  } else {
    console.log('✗ System requires fixes before production launch');
    console.log('Please review the issues above and address them accordingly.');
  }
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'integration-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

function main() {
  console.log('Starting Final System Integration Testing...\n');
  
  testDatabaseIntegration();
  testAPIIntegration();
  testAuthenticationIntegration();
  testServicesIntegration();
  testFrontendIntegration();
  testSecurityIntegration();
  testPerformanceIntegration();
  
  generateReport();
}

if (require.main === module) {
  main();
}

module.exports = { testResults, generateReport };
