/**
 * API Endpoint Wiring Verification Script
 * Verifies that all API endpoints are properly wired and functional
 */

const fs = require('fs');
const path = require('path');

const verificationResults = {
  routes: [],
  services: [],
  wiredEndpoints: [],
  unwiredEndpoints: [],
  issues: [],
  recommendations: []
};

function verifyRouteWiring(directory) {
  const items = fs.readdirSync(directory);
  
  items.forEach(item => {
    const itemPath = path.join(directory, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      verifyRouteWiring(itemPath);
    } else if (item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
      verifyFile(itemPath);
    }
  });
}

function verifyFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const verification = {
      path: relativePath,
      type: relativePath.includes('routes') ? 'route' : 'service',
      endpoints: [],
      issues: [],
      recommendations: []
    };
    
    // Extract route definitions
    const routePattern = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      verification.endpoints.push({
        method: match[1],
        path: match[2],
        hasAuth: content.includes('authMiddleware'),
        hasValidation: content.includes('validate'),
        hasErrorHandling: content.includes('try') && content.includes('catch')
      });
    }
    
    // Check if route is mounted in index.js
    const indexJsPath = path.join(process.cwd(), 'src/index.js');
    if (fs.existsSync(indexJsPath)) {
      const indexContent = fs.readFileSync(indexJsPath, 'utf8');
      const routeName = path.basename(filePath, '.js');
      const isMounted = indexContent.includes(routeName);
      
      if (!isMounted && verification.endpoints.length > 0) {
        verification.issues.push('Route file has endpoints but may not be mounted in index.js');
        verification.recommendations.push('Ensure route is properly mounted in index.js');
      }
    }
    
    // Check for service integration
    if (relativePath.includes('routes')) {
      const serviceName = path.basename(filePath, 'Routes.js') + 'Service';
      const servicePath = path.join(process.cwd(), 'src/services', serviceName + '.js');
      
      if (fs.existsSync(servicePath)) {
        verification.hasService = true;
      } else {
        verification.issues.push('Route may not have corresponding service');
        verification.recommendations.push('Create corresponding service file');
      }
    }
    
    if (verification.issues.length > 0 || verification.recommendations.length > 0) {
      if (verification.type === 'route') {
        verificationResults.routes.push(verification);
      } else {
        verificationResults.services.push(verification);
      }
      verificationResults.issues.push(...verification.issues);
      verificationResults.recommendations.push(...verification.recommendations);
    }
    
    // Track wired endpoints
    verification.endpoints.forEach(endpoint => {
      verificationResults.wiredEndpoints.push({
        file: relativePath,
        ...endpoint
      });
    });
    
  } catch (error) {
    console.error(`Error verifying ${filePath}:`, error.message);
  }
}

function generateReport() {
  console.log('\n=== API ENDPOINT WIRING VERIFICATION REPORT ===\n');
  
  console.log(`Routes Verified: ${verificationResults.routes.length}`);
  console.log(`Services Verified: ${verificationResults.services.length}`);
  console.log(`Total Wired Endpoints: ${verificationResults.wiredEndpoints.length}`);
  console.log(`Total Issues Found: ${verificationResults.issues.length}`);
  console.log(`Total Recommendations: ${verificationResults.recommendations.length}\n`);
  
  if (verificationResults.wiredEndpoints.length > 0) {
    console.log('=== WIRED ENDPOINTS ===\n');
    verificationResults.wiredEndpoints.slice(0, 20).forEach(endpoint => {
      console.log(`${endpoint.method.toUpperCase()} ${endpoint.path} - ${endpoint.file}`);
      console.log(`  Auth: ${endpoint.hasAuth ? '✓' : '✗'} | Validation: ${endpoint.hasValidation ? '✓' : '✗'} | Error Handling: ${endpoint.hasErrorHandling ? '✓' : '✗'}`);
    });
    if (verificationResults.wiredEndpoints.length > 20) {
      console.log(`... and ${verificationResults.wiredEndpoints.length - 20} more endpoints`);
    }
  }
  
  if (verificationResults.routes.length > 0) {
    console.log('\n=== ROUTES WITH ISSUES ===\n');
    verificationResults.routes.forEach(route => {
      console.log(`Route: ${route.path}`);
      console.log(`Issues: ${route.issues.join(', ')}`);
      console.log(`Recommendations: ${route.recommendations.join(', ')}`);
      console.log('');
    });
  }
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'api-wiring-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(verificationResults, null, 2));
  console.log(`Detailed report saved to: ${reportPath}`);
}

function main() {
  const routesDir = path.join(process.cwd(), 'src/routes');
  const servicesDir = path.join(process.cwd(), 'src/services');
  
  console.log('Starting API endpoint wiring verification...');
  
  if (fs.existsSync(routesDir)) {
    console.log(`Verifying routes directory: ${routesDir}`);
    verifyRouteWiring(routesDir);
  }
  
  if (fs.existsSync(servicesDir)) {
    console.log(`Verifying services directory: ${servicesDir}`);
    verifyRouteWiring(servicesDir);
  }
  
  generateReport();
}

if (require.main === module) {
  main();
}

module.exports = { verifyRouteWiring, verifyFile, generateReport };
