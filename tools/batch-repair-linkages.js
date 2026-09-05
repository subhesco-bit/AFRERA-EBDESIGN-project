#!/usr/bin/env node

/**
 * BATCH REPAIR - All Broken Linkages
 * Fixes import paths, missing dependencies, and broken references
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class BatchRepairLinkages {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.stats = {
      brokenImports: 0,
      fixedImports: 0,
      circularDeps: 0,
      missingExports: 0,
      fixed: 0
    };
  }

  // BATCH 1: Fix broken import paths
  fixBrokenImports() {
    console.log('\n🔧 BATCH 1: Fixing Broken Import Paths\n');

    const patterns = [
      'backend/src/services/**/*.js',
      'backend/src/routes/**/*.js',
      'backend/src/controllers/**/*.js',
      'frontend/src/**/*.jsx'
    ];

    let fixed = 0;

    patterns.forEach(pattern => {
      const files = glob.sync(pattern, {
        cwd: this.rootDir,
        ignore: ['**/node_modules/**', '**/*.test.*']
      });

      files.forEach(file => {
        try {
          let content = fs.readFileSync(path.join(this.rootDir, file), 'utf8');
          let modified = false;

          // Fix: Incorrect relative paths
          content = content.replace(
            /require\(['"]\.\.\/\.\.\/services\/(\w+)['"]\)/g,
            "require('../services/$1')"
          );
          if (content.match(/require\(['"]\.\.\/\.\.\/services\//)) {
            modified = true;
            fixed++;
          }

          // Fix: Missing file extensions
          content = content.replace(
            /require\(['"]([^'"]+)(?<!\.js)['"]\)/g,
            "require('$1.js')"
          );

          // Fix: Wrong path separators (Windows vs Unix)
          content = content.replace(
            /require\(['"]([^'"]*\\[^'"]*)['"]\)/g,
            (match, path) => `require('${path.replace(/\\/g, '/')}')`
          );

          // Fix: Circular import detection
          if (this.hasCircularImport(content)) {
            console.log(`⚠️ ${path.basename(file)}: Circular dependency detected`);
            this.stats.circularDeps++;
          }

          if (modified) {
            fs.writeFileSync(path.join(this.rootDir, file), content);
            console.log(`✅ ${path.basename(file)}: Fixed import paths`);
          }
        } catch (e) {
          console.log(`⚠️ ${path.basename(file)}: ${e.message}`);
        }
      });
    });

    this.stats.fixedImports = fixed;
    console.log(`\n✅ Fixed ${fixed} broken import paths\n`);
  }

  // BATCH 2: Fix missing service exports
  fixMissingExports() {
    console.log('🔧 BATCH 2: Ensuring All Services Export Properly\n');

    const serviceFiles = glob.sync('backend/src/services/**/*.js', {
      cwd: this.rootDir,
      ignore: ['**/index.js', '**/*.test.js', '**/strategic/**']
    });

    let fixed = 0;

    serviceFiles.forEach(file => {
      try {
        let content = fs.readFileSync(path.join(this.rootDir, file), 'utf8');

        // Check if already exports
        if (/module\.exports\s*=|export\s+(default|{)/.test(content)) {
          return; // Already has export
        }

        // Try to extract class or function name and add export
        const classMatch = content.match(/class\s+(\w+)/);
        const functionMatch = content.match(/(?:async\s+)?function\s+(\w+)/);
        const constMatch = content.match(/const\s+(\w+)\s*=\s*(?:async\s*)?\(/);

        const exportName = classMatch?.[1] || functionMatch?.[1] || constMatch?.[1];

        if (exportName) {
          // Add export at end
          if (!content.trim().endsWith('}\n')) {
            content = content.trimEnd() + '\n';
          }
          content += `\nmodule.exports = ${exportName};\n`;
          fs.writeFileSync(path.join(this.rootDir, file), content);
          fixed++;
          console.log(`✅ ${path.basename(file)}: Added export for ${exportName}`);
        }
      } catch (e) {
        // Skip on error
      }
    });

    this.stats.missingExports = fixed;
    console.log(`\n✅ Fixed ${fixed} missing exports\n`);
  }

  // BATCH 3: Verify all route wiring
  verifyRouteWiring() {
    console.log('🔧 BATCH 3: Verifying Route Wiring\n');

    const backendIndex = path.join(this.rootDir, 'backend/src/index.js');
    let indexContent = fs.readFileSync(backendIndex, 'utf8');

    const routeFiles = glob.sync('backend/src/routes/**/*.js', {
      cwd: this.rootDir,
      ignore: ['**/index.js', '**/*.test.js']
    });

    let mounted = 0;
    let orphaned = [];

    routeFiles.forEach(file => {
      const routeName = path.basename(file, '.js');
      const isRouteImported = indexContent.includes(`const ${routeName}`);
      const isRouteMounted = indexContent.includes(`app.use`) && indexContent.includes(routeName);

      if (isRouteImported && isRouteMounted) {
        mounted++;
      } else if (isRouteImported && !isRouteMounted) {
        orphaned.push(routeName);
      }
    });

    console.log(`✅ Routes mounted: ${mounted}/${routeFiles.length}`);
    if (orphaned.length > 0) {
      console.log(`⚠️ Orphaned routes (imported but not mounted): ${orphaned.length}`);
      orphaned.slice(0, 5).forEach(r => console.log(`  - ${r}`));
    }

    console.log();
    return { mounted, orphaned };
  }

  // BATCH 4: Fix missing database references
  fixDatabaseReferences() {
    console.log('🔧 BATCH 4: Verifying Database References\n');

    const serviceFiles = glob.sync('backend/src/services/**/*.js', {
      cwd: this.rootDir,
      ignore: ['**/index.js', '**/*.test.js']
    });

    let fixed = 0;

    serviceFiles.forEach(file => {
      try {
        let content = fs.readFileSync(path.join(this.rootDir, file), 'utf8');

        // Check if uses database but doesn't import it
        if ((content.includes('getPostgreSQL()') || content.includes('this.db')) &&
            !content.includes("require('../database") &&
            !content.includes("import.*database")) {

          // Check if it's in a service that should have database
          if (!content.includes('// No database needed')) {
            console.log(`⚠️ ${path.basename(file)}: May need database connection`);
            fixed++;
          }
        }
      } catch (e) {
        // Skip
      }
    });

    console.log(`\n✅ Database reference check complete (${fixed} potential issues)\n`);
  }

  // BATCH 5: Fix API endpoint consistency
  fixAPIEndpoints() {
    console.log('🔧 BATCH 5: Verifying API Endpoint Consistency\n');

    const routeFiles = glob.sync('backend/src/routes/**/*.js', {
      cwd: this.rootDir,
      ignore: ['**/index.js', '**/*.test.js']
    });

    let fixed = 0;

    routeFiles.forEach(file => {
      try {
        let content = fs.readFileSync(path.join(this.rootDir, file), 'utf8');

        // Check for proper route definition
        if (!content.includes('module.exports') && !content.includes('export default')) {
          console.log(`⚠️ ${path.basename(file)}: Missing module export`);
          fixed++;
        }

        // Check for proper route mounting
        if (!content.includes('router.get') && !content.includes('router.post') &&
            !content.includes('router.put') && !content.includes('router.delete')) {
          console.log(`⚠️ ${path.basename(file)}: No route methods defined`);
        }
      } catch (e) {
        // Skip
      }
    });

    console.log(`\n✅ API endpoint check complete\n`);
  }

  hasCircularImport(content) {
    // Simple circular import detection
    const lines = content.split('\n');
    return lines.some(line =>
      line.includes('require') && line.includes('../') &&
      lines.some(otherLine =>
        otherLine.includes('require') &&
        otherLine.includes(path.basename(path.dirname(line)))
      )
    );
  }

  // Run all batches
  runAllBatches() {
    console.log('='.repeat(70));
    console.log('🔧 BATCH REPAIR - BROKEN LINKAGES');
    console.log('='.repeat(70));

    this.fixBrokenImports();
    this.fixMissingExports();
    const wiringStat = this.verifyRouteWiring();
    this.fixDatabaseReferences();
    this.fixAPIEndpoints();

    console.log('='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70) + '\n');

    console.log('Fixed Imports: ' + this.stats.fixedImports);
    console.log('Fixed Exports: ' + this.stats.missingExports);
    console.log('Routes Wired: ' + wiringStat.mounted);
    console.log('Orphaned Routes: ' + wiringStat.orphaned.length);
    console.log('Circular Dependencies Found: ' + this.stats.circularDeps);

    const totalFixed = this.stats.fixedImports + this.stats.missingExports;
    console.log(`\n✅ TOTAL LINKAGE REPAIRS: ${totalFixed}\n`);
    console.log('='.repeat(70) + '\n');
  }
}

if (require.main === module) {
  const repairer = new BatchRepairLinkages(process.cwd());
  repairer.runAllBatches();
}

module.exports = BatchRepairLinkages;
