/**
 * Comprehensive Route and Service Audit Script
 * Audits all routes and services for production readiness
 */

const fs = require('fs');
const path = require('path');

const auditResults = {
  routes: [],
  services: [],
  issues: [],
  recommendations: []
};

function auditDirectory(directory, type = 'routes') {
  const items = fs.readdirSync(directory);
  
  items.forEach(item => {
    const itemPath = path.join(directory, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      auditDirectory(itemPath, type);
    } else if (item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
      auditFile(itemPath, type);
    }
  });
}

function auditFile(filePath, type) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const audit = {
      path: relativePath,
      type: type,
      issues: [],
      recommendations: []
    };
    
    // Check for proper error handling
    if (!content.includes('try') && !content.includes('catch')) {
      audit.issues.push('Missing error handling');
      audit.recommendations.push('Add try-catch blocks for error handling');
    }
    
    // Check for authentication middleware
    if (type === 'routes' && content.includes('app.') && !content.includes('authMiddleware') && !content.includes('auth')) {
      audit.issues.push('Missing authentication middleware');
      audit.recommendations.push('Add authentication middleware to protected routes');
    }
    
    // Check for input validation
    if (type === 'routes' && content.includes('req.body') && !content.includes('validate')) {
      audit.issues.push('Missing input validation');
      audit.recommendations.push('Add input validation middleware');
    }
    
    // Check for logging
    if (!content.includes('logger') && !content.includes('console')) {
      audit.issues.push('Missing logging');
      audit.recommendations.push('Add proper logging using logger');
    }
    
    // Check for database connection wrapping
    if (content.includes('pool.query') && !content.includes('transaction') && !content.includes('withTransaction')) {
      audit.issues.push('Database queries not wrapped in transactions');
      audit.recommendations.push('Wrap database operations in transactions');
    }
    
    if (audit.issues.length > 0 || audit.recommendations.length > 0) {
      if (type === 'routes') {
        auditResults.routes.push(audit);
      } else {
        auditResults.services.push(audit);
      }
      auditResults.issues.push(...audit.issues);
      auditResults.recommendations.push(...audit.recommendations);
    }
  } catch (error) {
    console.error(`Error auditing ${filePath}:`, error.message);
  }
}

function generateReport() {
  console.log('\n=== ROUTE AND SERVICE AUDIT REPORT ===\n');
  
  console.log(`Routes Audited: ${auditResults.routes.length}`);
  console.log(`Services Audited: ${auditResults.services.length}`);
  console.log(`Total Issues Found: ${auditResults.issues.length}`);
  console.log(`Total Recommendations: ${auditResults.recommendations.length}\n`);
  
  if (auditResults.routes.length > 0) {
    console.log('=== ROUTES WITH ISSUES ===\n');
    auditResults.routes.forEach(route => {
      console.log(`Route: ${route.path}`);
      console.log(`Issues: ${route.issues.join(', ')}`);
      console.log(`Recommendations: ${route.recommendations.join(', ')}`);
      console.log('');
    });
  }
  
  if (auditResults.services.length > 0) {
    console.log('=== SERVICES WITH ISSUES ===\n');
    auditResults.services.forEach(service => {
      console.log(`Service: ${service.path}`);
      console.log(`Issues: ${service.issues.join(', ')}`);
      console.log(`Recommendations: ${service.recommendations.join(', ')}`);
      console.log('');
    });
  }
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'route-service-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`Detailed report saved to: ${reportPath}`);
}

function main() {
  const routesDir = path.join(process.cwd(), 'src/routes');
  const servicesDir = path.join(process.cwd(), 'src/services');
  
  console.log('Starting comprehensive route and service audit...');
  
  if (fs.existsSync(routesDir)) {
    console.log(`Auditing routes directory: ${routesDir}`);
    auditDirectory(routesDir, 'routes');
  }
  
  if (fs.existsSync(servicesDir)) {
    console.log(`Auditing services directory: ${servicesDir}`);
    auditDirectory(servicesDir, 'services');
  }
  
  generateReport();
}

if (require.main === module) {
  main();
}

module.exports = { auditDirectory, auditFile, generateReport };
