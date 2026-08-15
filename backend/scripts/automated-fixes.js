/**
 * Automated Fixes Script
 * Automatically fixes common issues in routes and services
 */

const fs = require('fs');
const path = require('path');

const fixResults = {
  filesProcessed: 0,
  authenticationAdded: 0,
  errorHandlingAdded: 0,
  loggingAdded: 0,
  transactionWrappingAdded: 0,
  validationAdded: 0,
  errors: []
};

function addAuthenticationMiddleware(content) {
  // Check if auth middleware is already present
  if (content.includes('authMiddleware') || content.includes('auth')) {
    return { content, added: false };
  }

  // Add auth middleware import if not present
  if (!content.includes("require('./middleware/auth')")) {
    content = `const { authMiddleware } = require('./middleware/auth');\n` + content;
  }

  // Add auth middleware to route definitions
  const routerPattern = /router\.(get|post|put|delete|patch)\(/g;
  let modified = false;
  
  content = content.replace(routerPattern, (match) => {
    modified = true;
    return `router.${match.slice(7)}, authMiddleware, `;
  });

  return { content, added: modified };
}

function addErrorHandling(content) {
  // Check if error handling is already present
  if (content.includes('try') && content.includes('catch')) {
    return { content, added: false };
  }

  // Find function definitions and wrap them in try-catch
  const functionPattern = /(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  let modified = false;
  let currentFuncName = '';
  
  content = content.replace(functionPattern, (match, isAsync, funcName) => {
    modified = true;
    currentFuncName = funcName;
    const indent = '  ';
    return `${match}\n${indent}try {\n${indent}  `;
  });

  // Add catch blocks at function ends - use the captured function name
  const closingBracePattern = /\n\s*\}\s*(?=(?:\/\/|\/\*|\n|$))/g;
  content = content.replace(closingBracePattern, (match) => {
    if (modified && currentFuncName) {
      const funcName = currentFuncName;
      currentFuncName = ''; // Reset for next function
      return `\n  } catch (error) {\n    logger.error(\`Error in ${funcName}:\`, { error: error.message });\n    throw error;\n  }${match}`;
    }
    return match;
  });

  return { content, added: modified };
}

function addLogging(content) {
  // Check if logging is already present
  if (content.includes('logger') || content.includes('winston')) {
    return { content, added: false };
  }

  // Add logger import if not present
  if (!content.includes("require('./utils/logger')")) {
    content = `const { logger } = require('./utils/logger');\n` + content;
  }

  // Add logging to function starts
  const functionPattern = /(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  let modified = false;
  
  content = content.replace(functionPattern, (match, isAsync, funcName) => {
    modified = true;
    return `${match}\n  logger.info(\`${funcName} called\`);\n`;
  });

  return { content, added: modified };
}

function addTransactionWrapping(content) {
  // Check if transaction wrapping is already present
  if (content.includes('transaction') || content.includes('withTransaction')) {
    return { content, added: false };
  }

  // Add transaction manager import if not present
  if (!content.includes("require('./database/transactions/transaction_manager')")) {
    content = `const { transactionManager } = require('./database/transactions/transaction_manager');\n` + content;
  }

  // Wrap pool.query calls with transactions
  const queryPattern = /pool\.query\(/g;
  let modified = false;
  
  content = content.replace(queryPattern, (match) => {
    modified = true;
    return 'await transactionManager.execute(async (client) => client.query(';
  });

  return { content, added: modified };
}

function addInputValidation(content) {
  // Check if validation is already present
  if (content.includes('validate') || content.includes('joi') || content.includes('zod')) {
    return { content, added: false };
  }

  // Add validation middleware import if not present
  if (!content.includes("require('./middleware/validation')")) {
    content = `const { validateBody, validateQuery, validateParams } = require('./middleware/validation');\n` + content;
  }

  // Add validation to routes with body parameters
  const bodyPattern = /router\.(post|put|patch)\(([^,]+),\s*(async\s+)?\([^)]*\)\s*=>/g;
  let modified = false;
  
  content = content.replace(bodyPattern, (match, method, path, isAsync) => {
    modified = true;
    return `router.${method}(${path}, validateBody, ${isAsync || ''}(`;
  });

  return { content, added: modified };
}

function fixFile(filePath, fixes) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let fileModified = false;

    if (fixes.authentication) {
      const result = addAuthenticationMiddleware(modifiedContent);
      modifiedContent = result.content;
      if (result.added) {
        fixResults.authenticationAdded++;
        fileModified = true;
      }
    }

    if (fixes.errorHandling) {
      const result = addErrorHandling(modifiedContent);
      modifiedContent = result.content;
      if (result.added) {
        fixResults.errorHandlingAdded++;
        fileModified = true;
      }
    }

    if (fixes.logging) {
      const result = addLogging(modifiedContent);
      modifiedContent = result.content;
      if (result.added) {
        fixResults.loggingAdded++;
        fileModified = true;
      }
    }

    if (fixes.transactionWrapping) {
      const result = addTransactionWrapping(modifiedContent);
      modifiedContent = result.content;
      if (result.added) {
        fixResults.transactionWrappingAdded++;
        fileModified = true;
      }
    }

    if (fixes.validation) {
      const result = addInputValidation(modifiedContent);
      modifiedContent = result.content;
      if (result.added) {
        fixResults.validationAdded++;
        fileModified = true;
      }
    }

    if (fileModified) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      fixResults.filesProcessed++;
      console.log(`Fixed: ${filePath}`);
    }

  } catch (error) {
    fixResults.errors.push({ file: filePath, error: error.message });
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

function processFixes(directories, fixes) {
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      return;
    }

    const processDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const itemPath = path.join(currentDir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          processDir(itemPath);
        } else if (item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
          fixFile(itemPath, fixes);
        }
      });
    };

    processDir(dir);
  });
}

function generateReport() {
  console.log('\n=== AUTOMATED FIXES REPORT ===\n');
  console.log(`Files Processed: ${fixResults.filesProcessed}`);
  console.log(`Authentication Middleware Added: ${fixResults.authenticationAdded}`);
  console.log(`Error Handling Added: ${fixResults.errorHandlingAdded}`);
  console.log(`Logging Added: ${fixResults.loggingAdded}`);
  console.log(`Transaction Wrapping Added: ${fixResults.transactionWrappingAdded}`);
  console.log(`Input Validation Added: ${fixResults.validationAdded}`);
  console.log(`Errors Encountered: ${fixResults.errors.length}`);

  if (fixResults.errors.length > 0) {
    console.log('\n=== ERRORS ===\n');
    fixResults.errors.forEach(err => {
      console.log(`File: ${err.file}`);
      console.log(`Error: ${err.error}`);
      console.log('');
    });
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'automated-fixes-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(fixResults, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

function main() {
  const args = process.argv.slice(2);
  const fixes = {
    authentication: args.includes('--auth'),
    errorHandling: args.includes('--error'),
    logging: args.includes('--logging'),
    transactionWrapping: args.includes('--transaction'),
    validation: args.includes('--validation')
  };

  // If no specific fixes requested, apply all
  const applyAll = Object.values(fixes).every(v => !v);
  if (applyAll) {
    Object.keys(fixes).forEach(key => fixes[key] = true);
  }

  console.log('Starting automated fixes...');
  console.log('Fixes to apply:', Object.entries(fixes).filter(([k, v]) => v).map(([k]) => k));

  const directories = [
    path.join(process.cwd(), 'src/routes'),
    path.join(process.cwd(), 'src/services')
  ];

  processFixes(directories, fixes);
  generateReport();
}

if (require.main === module) {
  main();
}

module.exports = { addAuthenticationMiddleware, addErrorHandling, addLogging, addTransactionWrapping, addInputValidation };
