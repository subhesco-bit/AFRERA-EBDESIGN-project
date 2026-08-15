/**
 * Database Connection Wrapping Verification Script
 * Verifies that all database connections are properly wrapped with enhancements
 */

const fs = require('fs');
const path = require('path');

const verificationResults = {
  files: [],
  wrappedConnections: 0,
  unwrappedConnections: 0,
  issues: [],
  recommendations: []
};

function verifyDatabaseWrapping(directory) {
  const items = fs.readdirSync(directory);
  
  items.forEach(item => {
    const itemPath = path.join(directory, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      verifyDatabaseWrapping(itemPath);
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
      hasPoolQuery: false,
      hasTransaction: false,
      hasEnhancement: false,
      issues: [],
      recommendations: []
    };
    
    // Check for direct pool.query usage
    if (content.includes('pool.query')) {
      verification.hasPoolQuery = true;
      
      // Check if wrapped in transaction
      if (content.includes('transaction') || content.includes('withTransaction') || content.includes('transactionManager')) {
        verification.hasTransaction = true;
        verificationResults.wrappedConnections++;
      } else {
        verification.issues.push('Direct pool.query usage without transaction wrapping');
        verification.recommendations.push('Wrap database operations with transactionManager');
        verificationResults.unwrappedConnections++;
      }
    }
    
    // Check for database enhancement usage
    if (content.includes('database_enhancements') || content.includes('getDatabaseEnhancements') || content.includes('executeQuery')) {
      verification.hasEnhancement = true;
    }
    
    // Check for proper connection handling
    if (content.includes('pool.connect') && !content.includes('finally')) {
      verification.issues.push('Pool connection without proper cleanup');
      verification.recommendations.push('Ensure connections are properly closed in finally block');
    }
    
    // Check for connection leaks
    if (content.includes('pool.connect') && !content.includes('client.release()')) {
      verification.issues.push('Potential connection leak - missing client.release()');
      verification.recommendations.push('Add client.release() in finally block');
    }
    
    if (verification.issues.length > 0 || verification.recommendations.length > 0) {
      verificationResults.files.push(verification);
      verificationResults.issues.push(...verification.issues);
      verificationResults.recommendations.push(...verification.recommendations);
    }
    
  } catch (error) {
    console.error(`Error verifying ${filePath}:`, error.message);
  }
}

function generateReport() {
  console.log('\n=== DATABASE CONNECTION WRAPPING VERIFICATION REPORT ===\n');
  
  console.log(`Files Verified: ${verificationResults.files.length}`);
  console.log(`Wrapped Connections: ${verificationResults.wrappedConnections}`);
  console.log(`Unwrapped Connections: ${verificationResults.unwrappedConnections}`);
  console.log(`Total Issues Found: ${verificationResults.issues.length}`);
  console.log(`Total Recommendations: ${verificationResults.recommendations.length}\n`);
  
  if (verificationResults.files.length > 0) {
    console.log('=== FILES WITH ISSUES ===\n');
    verificationResults.files.forEach(file => {
      console.log(`File: ${file.path}`);
      console.log(`Has Pool Query: ${file.hasPoolQuery ? '✓' : '✗'}`);
      console.log(`Has Transaction: ${file.hasTransaction ? '✓' : '✗'}`);
      console.log(`Has Enhancement: ${file.hasEnhancement ? '✓' : '✗'}`);
      console.log(`Issues: ${file.issues.join(', ')}`);
      console.log(`Recommendations: ${file.recommendations.join(', ')}`);
      console.log('');
    });
  }
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'db-connection-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(verificationResults, null, 2));
  console.log(`Detailed report saved to: ${reportPath}`);
}

function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  console.log('Starting database connection wrapping verification...');
  console.log(`Verifying directory: ${srcDir}`);
  
  if (fs.existsSync(srcDir)) {
    verifyDatabaseWrapping(srcDir);
  }
  
  generateReport();
}

if (require.main === module) {
  main();
}

module.exports = { verifyDatabaseWrapping, verifyFile, generateReport };
