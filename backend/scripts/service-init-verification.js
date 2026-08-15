/**
 * Service Initialization Verification Script
 * Verifies that all services are properly initialized and configured
 */

const fs = require('fs');
const path = require('path');

const verificationResults = {
  services: [],
  initializedServices: 0,
  uninitializedServices: 0,
  issues: [],
  recommendations: []
};

function verifyServiceInitialization(directory) {
  const items = fs.readdirSync(directory);
  
  items.forEach(item => {
    const itemPath = path.join(directory, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      verifyServiceInitialization(itemPath);
    } else if (item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
      verifyFile(itemPath);
    }
  });
}

function verifyFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Only check service files
    if (!relativePath.includes('services') && !relativePath.includes('modules')) {
      return;
    }
    
    const verification = {
      path: relativePath,
      hasInit: false,
      hasSetupRoutes: false,
      hasConfig: false,
      hasErrorHandling: false,
      issues: [],
      recommendations: []
    };
    
    // Check for initialization function
    if (content.includes('initialize') || content.includes('init') || content.includes('setup')) {
      verification.hasInit = true;
    }
    
    // Check for setupRoutes function
    if (content.includes('setupRoutes')) {
      verification.hasSetupRoutes = true;
    }
    
    // Check for configuration
    if (content.includes('config') || content.includes('Config') || content.includes('process.env')) {
      verification.hasConfig = true;
    }
    
    // Check for error handling
    if (content.includes('try') && content.includes('catch')) {
      verification.hasErrorHandling = true;
    }
    
    // Check for module exports
    if (content.includes('module.exports') || content.includes('export')) {
      verification.hasExports = true;
    } else {
      verification.issues.push('Service may not be properly exported');
      verification.recommendations.push('Add module.exports for service');
    }
    
    // Check for initialization in index.js
    const indexJsPath = path.join(process.cwd(), 'src/index.js');
    if (fs.existsSync(indexJsPath)) {
      const indexContent = fs.readFileSync(indexJsPath, 'utf8');
      const serviceName = path.basename(filePath, '.js');
      const isInitialized = indexContent.includes(serviceName);
      
      if (!isInitialized && verification.hasInit) {
        verification.issues.push('Service has init function but may not be initialized in index.js');
        verification.recommendations.push('Ensure service is initialized in index.js');
      }
    }
    
    if (verification.issues.length > 0 || verification.recommendations.length > 0) {
      verificationResults.services.push(verification);
      verificationResults.issues.push(...verification.issues);
      verificationResults.recommendations.push(...verification.recommendations);
    }
    
    if (verification.hasInit || verification.hasSetupRoutes) {
      verificationResults.initializedServices++;
    } else {
      verificationResults.uninitializedServices++;
    }
    
  } catch (error) {
    console.error(`Error verifying ${filePath}:`, error.message);
  }
}

function generateReport() {
  console.log('\n=== SERVICE INITIALIZATION VERIFICATION REPORT ===\n');
  
  console.log(`Services Verified: ${verificationResults.services.length}`);
  console.log(`Initialized Services: ${verificationResults.initializedServices}`);
  console.log(`Uninitialized Services: ${verificationResults.uninitializedServices}`);
  console.log(`Total Issues Found: ${verificationResults.issues.length}`);
  console.log(`Total Recommendations: ${verificationResults.recommendations.length}\n`);
  
  if (verificationResults.services.length > 0) {
    console.log('=== SERVICES WITH ISSUES ===\n');
    verificationResults.services.forEach(service => {
      console.log(`Service: ${service.path}`);
      console.log(`Has Init: ${service.hasInit ? '✓' : '✗'}`);
      console.log(`Has SetupRoutes: ${service.hasSetupRoutes ? '✓' : '✗'}`);
      console.log(`Has Config: ${service.hasConfig ? '✓' : '✗'}`);
      console.log(`Has Error Handling: ${service.hasErrorHandling ? '✓' : '✗'}`);
      console.log(`Issues: ${service.issues.join(', ')}`);
      console.log(`Recommendations: ${service.recommendations.join(', ')}`);
      console.log('');
    });
  }
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'service-init-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(verificationResults, null, 2));
  console.log(`Detailed report saved to: ${reportPath}`);
}

function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  console.log('Starting service initialization verification...');
  console.log(`Verifying directory: ${srcDir}`);
  
  if (fs.existsSync(srcDir)) {
    verifyServiceInitialization(srcDir);
  }
  
  generateReport();
}

if (require.main === module) {
  main();
}

module.exports = { verifyServiceInitialization, verifyFile, generateReport };
