/**
 * Console Statement Cleanup Script for Frontend
 * Removes console.log, console.error, console.warn, console.info, console.debug
 * from production code
 */

const fs = require('fs');
const path = require('path');

const consolePatterns = [
  /console\.log\([^)]*\)/g,
  /console\.error\([^)]*\)/g,
  /console\.warn\([^)]*\)/g,
  /console\.info\([^)]*\)/g,
  /console\.debug\([^)]*\)/g,
];

const filesToSkip = [
  'node_modules',
  'dist',
  'build',
  'test',
  'tests',
  '__tests__',
  '.test.jsx',
  '.spec.jsx',
  '.test.js',
  '.spec.js',
  'setup.js',
  'cleanup-console.js'
];

function shouldSkipFile(filePath) {
  return filesToSkip.some(pattern => filePath.includes(pattern));
}

function cleanConsoleStatements(content) {
  let cleaned = content;
  let removedCount = 0;

  consolePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      removedCount += matches.length;
      cleaned = cleaned.replace(pattern, '');
    }
  });

  return { cleaned, removedCount };
}

function processDirectory(directory, results = { filesProcessed: 0, consolesRemoved: 0 }) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldSkipFile(filePath)) {
        processDirectory(filePath, results);
      }
    } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && !shouldSkipFile(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const { cleaned, removedCount } = cleanConsoleStatements(content);

        if (removedCount > 0) {
          fs.writeFileSync(filePath, cleaned, 'utf8');
          results.filesProcessed++;
          results.consolesRemoved += removedCount;
          console.log(`Cleaned ${removedCount} console statements from ${filePath}`);
        }
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    }
  });

  return results;
}

function main() {
  const srcDirectory = path.join(__dirname, '../src');
  
  console.log('Starting console statement cleanup...');
  console.log(`Processing directory: ${srcDirectory}`);

  const results = processDirectory(srcDirectory);

  console.log('Console statement cleanup complete');
  console.log(`Files processed: ${results.filesProcessed}`);
  console.log(`Console statements removed: ${results.consolesRemoved}`);

  if (results.consolesRemoved === 0) {
    console.log('No console statements found to remove');
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanConsoleStatements, processDirectory };
