/**
 * Console Statement Cleanup Script
 * Removes console.log, console.error, console.warn, console.info, console.debug
 * from production code and replaces with proper logging where appropriate
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../src/utils/logger');

const consolePatterns = [
  /console\.log\([^)]*\)/g,
  /console\.error\([^)]*\)/g,
  /console\.warn\([^)]*\)/g,
  /console\.info\([^)]*\)/g,
  /console\.debug\([^)]*\)/g,
];

const filesToSkip = [
  'node_modules',
  'coverage',
  'dist',
  'test',
  'tests',
  '__tests__',
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
    } else if (file.endsWith('.js') && !shouldSkipFile(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const { cleaned, removedCount } = cleanConsoleStatements(content);

        if (removedCount > 0) {
          fs.writeFileSync(filePath, cleaned, 'utf8');
          results.filesProcessed++;
          results.consolesRemoved += removedCount;
          logger.info(`Cleaned ${removedCount} console statements from ${filePath}`);
        }
      } catch (error) {
        logger.error(`Error processing ${filePath}:`, error.message);
      }
    }
  });

  return results;
}

function main() {
  const srcDirectory = path.join(__dirname, '../src');
  
  logger.info('Starting console statement cleanup...');
  logger.info(`Processing directory: ${srcDirectory}`);

  const results = processDirectory(srcDirectory);

  logger.info('Console statement cleanup complete');
  logger.info(`Files processed: ${results.filesProcessed}`);
  logger.info(`Console statements removed: ${results.consolesRemoved}`);

  if (results.consolesRemoved === 0) {
    logger.info('No console statements found to remove');
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanConsoleStatements, processDirectory };
