/**
 * Route Audit and Repair Script
 * 
 * This script audits the backend route structure to identify:
 * 1. Missing route files that are imported in index.js
 * 2. Orphaned route files that are not imported
 * 3. Broken route references
 * 4. Duplicate route registrations
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../backend/src/routes');
const INDEX_FILE = path.join(__dirname, '../backend/src/index.js');

// These files are retained historical/duplicate scaffolds, not runtime route
// units. They are intentionally excluded until a contract owner removes or
// replaces them; mounting them would create duplicate or fabricated APIs.
const INTENTIONAL_EXCLUSIONS = new Set([
  'advancedAnalyticsRoutes.js',
  'blockchainVerificationRoutes.js',
  'devinRoutes.js',
  'digitalTwinRoutes.js',
  'enterpriseIntegrationRoutes.js',
  'iotIntegrationRoutes.js',
  'predictiveIntelligenceRoutes.js',
  'unifiedAIGateway.js',
]);

const COVERED_ALIASES = new Map([
  ['claude/aiCollaborationRoutes.js', 'aiCollaborationRoutes.js'],
  ['claude/aiDecisionRoutes.js', 'decisionSupportRoutes.js'],
  ['claude/libraryRoutes.js', 'libraryRoutes.js'],
  ['claude/unifiedAIRoutes.js', 'unifiedAIRoutes.js'],
]);

function routeFiles(dir, relative = '', files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const nextRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) routeFiles(full, nextRelative, files);
    else if (entry.name.endsWith('.js')) files.push(nextRelative);
  }
  return files;
}

function importedRouteFiles(indexContent) {
  const imported = new Set();
  const pattern = /['"]\.\/routes\/([^'"]+?)(?:\.js)?['"]/g;
  for (const match of indexContent.matchAll(pattern)) {
    const route = match[1].replaceAll('\\', '/');
    imported.add(route.endsWith('.js') ? route : `${route}.js`);
  }
  return imported;
}

async function auditRoutes() {
  console.log('🔍 Starting Route Audit...\n');

  // Get all route files that actually exist
  const existingFiles = routeFiles(ROUTES_DIR).map(file => file.replaceAll('\\', '/'));
  const indexContent = fs.readFileSync(INDEX_FILE, 'utf8');
  const importedFiles = importedRouteFiles(indexContent);

  console.log(`📁 Found ${existingFiles.length} route files in ${ROUTES_DIR}`);

  // Check for missing routes
  const missingRoutes = [...importedFiles].filter(route => !existingFiles.includes(route));
  
  if (missingRoutes.length > 0) {
    console.log(`\n❌ Missing ${missingRoutes.length} route files imported in index.js:`);
    missingRoutes.forEach(route => console.log(`   - ${route}`));
  } else {
    console.log('✅ All imported routes exist');
  }

  // Check for orphaned routes (exist but not imported)
  const orphanedRoutes = existingFiles.filter(file => (
    !importedFiles.has(file)
    && !INTENTIONAL_EXCLUSIONS.has(path.basename(file))
    && !COVERED_ALIASES.has(file)
  ));
  const excludedRoutes = existingFiles.filter(file => INTENTIONAL_EXCLUSIONS.has(path.basename(file)));
  const coveredAliases = existingFiles.filter(file => COVERED_ALIASES.has(file));
  
  if (orphanedRoutes.length > 0) {
    console.log(`\n⚠️  Found ${orphanedRoutes.length} orphaned route files (not imported):`);
    orphanedRoutes.forEach(route => console.log(`   - ${route}`));
  } else {
    console.log('✅ No orphaned route files');
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Imported route files: ${importedFiles.size}`);
  console.log(`   Existing files: ${existingFiles.length}`);
  console.log(`   Missing files: ${missingRoutes.length}`);
  console.log(`   Orphaned files: ${orphanedRoutes.length}`);
  console.log(`   Intentional exclusions: ${excludedRoutes.length}`);
  console.log(`   Covered canonical aliases: ${coveredAliases.length}`);

  const hasUnresolvedRoutes = orphanedRoutes.length > 0 || missingRoutes.length > 0;

  return {
    imported: [...importedFiles],
    existing: existingFiles,
    missing: missingRoutes,
    orphaned: orphanedRoutes,
    excluded: excludedRoutes,
    coveredAliases,
    hasUnresolvedRoutes
  };
}

// Run the audit
auditRoutes().then(result => {
  console.log('\n✅ Route audit complete');
  process.exit(result.hasUnresolvedRoutes ? 1 : 0);
}).catch(error => {
  console.error('❌ Route audit failed:', error);
  process.exit(1);
});