/**
 * Frontend Issues Fix Script
 * Automatically fixes common frontend issues
 */

const fs = require('fs');
const path = require('path');

const fixResults = {
  filesProcessed: 0,
  hardcodedRoutesFixed: 0,
  errorBoundariesAdded: 0,
  errors: []
};

function fixHardcodedRoutes(content) {
  // Replace hardcoded API routes with environment variables
  const hardcodedPatterns = [
    { pattern: /http:\/\/localhost:3001/g, replacement: 'import.meta.env.VITE_API_BASE_URL' },
    { pattern: /http:\/\/localhost:3000/g, replacement: 'import.meta.env.VITE_FRONTEND_URL' },
    { pattern: /'\/api\/v1\//g, replacement: '`${import.meta.env.VITE_API_BASE_URL}/' },
    { pattern: /"\/api\/v1\//g, replacement: '`${import.meta.env.VITE_API_BASE_URL}/' }
  ];

  let modified = false;
  let modifiedContent = content;

  hardcodedPatterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(pattern, replacement);
      modified = true;
    }
  });

  return { content: modifiedContent, added: modified };
}

function addErrorBoundaryImport(content) {
  // Check if ErrorBoundary is already imported
  if (content.includes('ErrorBoundary') || content.includes('error-boundary')) {
    return { content, added: false };
  }

  // Add ErrorBoundary import at the top
  const importStatement = "import ErrorBoundary from '../components/ErrorBoundary'\n";
  
  // Find the first import statement and add after it
  const importPattern = /^import\s+.*from\s+['"][^'"]+['"]\s*$/m;
  if (importPattern.test(content)) {
    const modifiedContent = content.replace(importPattern, (match) => match + '\n' + importStatement);
    return { content: modifiedContent, added: true };
  }

  // If no import found, add at the beginning
  return { content: importStatement + content, added: true };
}

function wrapWithErrorBoundary(content) {
  // Check if already wrapped
  if (content.includes('<ErrorBoundary>')) {
    return { content, added: false };
  }

  // Find the main component export and wrap it
  const exportPattern = /(export\s+(default\s+)?(?:const|function)\s+\w+\s*=\s*\(?)([\s\S]*?)(\)?\s*=>\s*)/g;
  
  if (exportPattern.test(content)) {
    const modifiedContent = content.replace(exportPattern, (match, p1, p2, p3) => {
      return `${p1}${p2}${p3}return (\n    <ErrorBoundary>\n      {existingContent}\n    </ErrorBoundary>\n  )`;
    });
    
    // This is a simple approach - for complex components, manual review needed
    return { content: modifiedContent, added: true };
  }

  return { content, added: false };
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let fileModified = false;

    // Fix hardcoded routes
    const routeResult = fixHardcodedRoutes(modifiedContent);
    modifiedContent = routeResult.content;
    if (routeResult.added) {
      fixResults.hardcodedRoutesFixed++;
      fileModified = true;
    }

    // Add ErrorBoundary import
    const importResult = addErrorBoundaryImport(modifiedContent);
    modifiedContent = importResult.content;
    if (importResult.added) {
      fileModified = true;
    }

    // Wrap with ErrorBoundary (simplified approach)
    const boundaryResult = wrapWithErrorBoundary(modifiedContent);
    modifiedContent = boundaryResult.content;
    if (boundaryResult.added) {
      fixResults.errorBoundariesAdded++;
      fileModified = true;
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

function processFixes(directory) {
  if (!fs.existsSync(directory)) {
    console.warn(`Directory not found: ${directory}`);
    return;
  }

  const processDir = (currentDir) => {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        processDir(itemPath);
      } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
        fixFile(itemPath);
      }
    });
  };

  processDir(directory);
}

function generateReport() {
  console.log('\n=== FRONTEND FIXES REPORT ===\n');
  console.log(`Files Processed: ${fixResults.filesProcessed}`);
  console.log(`Hardcoded Routes Fixed: ${fixResults.hardcodedRoutesFixed}`);
  console.log(`Error Boundaries Added: ${fixResults.errorBoundariesAdded}`);
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
  const reportPath = path.join(process.cwd(), 'frontend-fixes-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(fixResults, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  console.log('Starting frontend fixes...');
  console.log(`Processing directory: ${srcDir}`);

  processFixes(srcDir);
  generateReport();
}

if (require.main === module) {
  main();
}

module.exports = { fixHardcodedRoutes, addErrorBoundaryImport, wrapWithErrorBoundary };
