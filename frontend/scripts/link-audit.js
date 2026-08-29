/**
 * Frontend Link Audit Script
 * Audits all links and routes in the frontend for production readiness
 */

const fs = require('fs');
const path = require('path');

const auditResults = {
  routes: [],
  links: [],
  issues: [],
  recommendations: []
};

function auditDirectory(directory) {
  const items = fs.readdirSync(directory);
  
  items.forEach(item => {
    const itemPath = path.join(directory, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      auditDirectory(itemPath);
    } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
      auditFile(itemPath);
    }
  });
}

function auditFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const audit = {
      path: relativePath,
      issues: [],
      recommendations: []
    };
    
    // Check for hardcoded routes
    if (content.includes('/api/v1/') && !content.includes('config/env')) {
      audit.issues.push('Hardcoded API routes found');
      audit.recommendations.push('Use environment variables for API base URL');
    }
    
    // Check for broken links
    const linkPattern = /to=["']([^"']+)["']/g;
    const links = content.match(linkPattern);
    if (links) {
      links.forEach(link => {
        const linkPath = link.match(/to=["']([^"']+)["']/)[1];
        if (linkPath.startsWith('/') && !linkPath.startsWith('/http')) {
          // Check if route exists in routes config
          if (!fs.existsSync(path.join(process.cwd(), 'src/config/routes.js'))) {
            audit.issues.push(`Link to ${linkPath} may not have corresponding route`);
          }
        }
      });
    }
    
    // Check for missing lazy loading
    if (content.includes('import ') && !content.includes('lazy(') && content.includes('from ')) {
      const importPattern = /import\s+(\w+)\s+from\s+['"]([^"']+)['"]/g;
      const imports = content.match(importPattern);
      if (imports && imports.length > 5) {
        audit.issues.push('Multiple imports without lazy loading');
        audit.recommendations.push('Consider lazy loading for better performance');
      }
    }
    
    // Check for missing error boundaries
    if (content.includes('component') && !content.includes('ErrorBoundary')) {
      audit.issues.push('Component may not have error boundary');
      audit.recommendations.push('Add ErrorBoundary wrapper for better error handling');
    }
    
    if (audit.issues.length > 0 || audit.recommendations.length > 0) {
      auditResults.links.push(audit);
      auditResults.issues.push(...audit.issues);
      auditResults.recommendations.push(...audit.recommendations);
    }
  } catch (error) {
    console.error(`Error auditing ${filePath}:`, error.message);
  }
}

function auditRoutesConfig() {
  const routesPath = path.join(process.cwd(), 'src/config/routes.js');
  if (!fs.existsSync(routesPath)) {
    auditResults.issues.push('Routes configuration file not found');
    auditResults.recommendations.push('Create routes configuration file');
    return;
  }
  
  try {
    const content = fs.readFileSync(routesPath, 'utf8');
    
    // Check for duplicate routes
    const routePattern = /path:\s*["']([^"']+)["']/g;
    const routes = content.match(routePattern);
    if (routes) {
      const routePaths = routes.map(r => r.match(/path:\s*["']([^"']+)["']/)[1]);
      const duplicates = routePaths.filter((item, index) => routePaths.indexOf(item) !== index);
      if (duplicates.length > 0) {
        auditResults.issues.push(`Duplicate routes found: ${duplicates.join(', ')}`);
        auditResults.recommendations.push('Remove duplicate route definitions');
      }
    }
    
    // Check for missing authentication
    if (!content.includes('ProtectedRoute') && !content.includes('auth')) {
      auditResults.issues.push('Routes may not have authentication');
      auditResults.recommendations.add('Add ProtectedRoute wrapper for authenticated routes');
    }
    
  } catch (error) {
    console.error(`Error auditing routes config:`, error.message);
  }
}

function generateReport() {
  console.log('\n=== FRONTEND LINK AUDIT REPORT ===\n');
  
  console.log(`Files Audited: ${auditResults.links.length}`);
  console.log(`Total Issues Found: ${auditResults.issues.length}`);
  console.log(`Total Recommendations: ${auditResults.recommendations.length}\n`);
  
  if (auditResults.links.length > 0) {
    console.log('=== FILES WITH ISSUES ===\n');
    auditResults.links.forEach(link => {
      console.log(`File: ${link.path}`);
      console.log(`Issues: ${link.issues.join(', ')}`);
      console.log(`Recommendations: ${link.recommendations.join(', ')}`);
      console.log('');
    });
  }
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'frontend-link-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`Detailed report saved to: ${reportPath}`);
}

function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  console.log('Starting frontend link audit...');
  console.log(`Auditing directory: ${srcDir}`);
  
  if (fs.existsSync(srcDir)) {
    auditDirectory(srcDir);
  }
  
  auditRoutesConfig();
  generateReport();
}

if (require.main === module) {
  main();
}

module.exports = { auditDirectory, auditFile, generateReport };
