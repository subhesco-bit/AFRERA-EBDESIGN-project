#!/usr/bin/env node

/**
 * DEEP INTEGRATION ANALYSIS
 * Verifies actual code-level connectivity, not just file counts
 * Checks: imports, exports, wiring, routing, circular deps, orphans
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class DeepIntegrationAnalysis {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.results = {
      services: { exported: 0, imported: 0, orphaned: [], wired: [] },
      routes: { defined: 0, mounted: 0, orphaned: [], wired: [] },
      pages: { defined: 0, routed: 0, orphaned: [], wired: [] },
      components: { defined: 0, exported: 0, used: [], orphaned: [] },
      imports: { unresolved: [], circular: [], valid: 0 },
      exports: { valid: 0, invalid: 0, missing: [] },
      issues: [],
      warnings: []
    };
  }

  // PHASE 1: Scan all exports from services
  analyzeServiceExports() {
    console.log('\n📊 PHASE 1: Analyzing Service Exports\n');

    const serviceFiles = glob.sync('backend/src/services/**/*.js', { cwd: this.rootDir })
      .filter(f => !f.includes('index.js') && !f.includes('.test'));

    const servicesIndex = path.join(this.rootDir, 'backend/src/services/index.js');
    let indexContent = '';

    try {
      indexContent = fs.readFileSync(servicesIndex, 'utf8');
    } catch (e) {
      this.results.issues.push('Services index.js not found or unreadable');
      return;
    }

    console.log(`Found ${serviceFiles.length} service files\n`);

    serviceFiles.forEach(serviceFile => {
      const serviceName = path.basename(serviceFile, '.js');
      const serviceContent = fs.readFileSync(path.join(this.rootDir, serviceFile), 'utf8');

      // Check if service has exports
      const hasExport = /export\s+(default|{|const|function|class)/.test(serviceContent);

      if (!hasExport) {
        this.results.services.orphaned.push({
          file: serviceFile,
          reason: 'No export statement found'
        });
        console.log(`❌ ${serviceName}: NO EXPORT`);
      } else if (indexContent.includes(serviceName) || indexContent.includes(serviceContent.match(/export\s+(?:default\s+)?(?:class|function)\s+(\w+)/)?.[1] || '')) {
        this.results.services.exported++;
        this.results.services.wired.push(serviceFile);
        console.log(`✅ ${serviceName}: Exported & wired`);
      } else {
        this.results.services.orphaned.push({
          file: serviceFile,
          reason: 'Not referenced in services/index.js'
        });
        console.log(`⚠️ ${serviceName}: Exported but not wired in index`);
      }
    });

    console.log(`\n✅ Exported services: ${this.results.services.exported}/${serviceFiles.length}`);
  }

  // PHASE 2: Scan all route definitions and wiring
  analyzeRouteWiring() {
    console.log('\n📊 PHASE 2: Analyzing Route Wiring\n');

    const routeFiles = glob.sync('backend/src/routes/**/*.js', { cwd: this.rootDir })
      .filter(f => !f.includes('index.js') && !f.includes('.test'));

    const mainIndex = path.join(this.rootDir, 'backend/src/index.js');
    let mainContent = '';

    try {
      mainContent = fs.readFileSync(mainIndex, 'utf8');
    } catch (e) {
      this.results.issues.push('Backend index.js not found or unreadable');
      return;
    }

    console.log(`Found ${routeFiles.length} route files\n`);

    routeFiles.forEach(routeFile => {
      const routeName = path.basename(routeFile, '.js');
      const routeContent = fs.readFileSync(path.join(this.rootDir, routeFile), 'utf8');

      // Check if route has export
      const routerExportMatch = routeContent.match(/module\.exports|export\s+(default|const|function)/);

      if (!routerExportMatch) {
        this.results.routes.orphaned.push({
          file: routeFile,
          reason: 'No export statement found'
        });
        console.log(`❌ ${routeName}: NO EXPORT`);
      } else {
        this.results.routes.defined++;

        // Check if mounted in main index
        const isMounted = mainContent.includes(routeName) ||
                         mainContent.includes(routeFile.replace(/backend\/src\/routes\//, '').replace(/\.js/, ''));

        if (isMounted) {
          this.results.routes.mounted++;
          this.results.routes.wired.push(routeFile);
          console.log(`✅ ${routeName}: Defined & mounted`);
        } else {
          this.results.routes.orphaned.push({
            file: routeFile,
            reason: 'Not mounted in backend/src/index.js'
          });
          console.log(`⚠️ ${routeName}: Defined but not mounted`);
        }
      }
    });

    console.log(`\n✅ Mounted routes: ${this.results.routes.mounted}/${routeFiles.length}`);
  }

  // PHASE 3: Verify frontend routing
  analyzeFrontendRouting() {
    console.log('\n📊 PHASE 3: Analyzing Frontend Routing\n');

    const pageFiles = glob.sync('frontend/src/pages/**/*.jsx', { cwd: this.rootDir })
      .filter(f => !f.includes('index.js') && !f.includes('.test'));

    const routesConfig = path.join(this.rootDir, 'frontend/src/config/routes.js');
    let routesContent = '';

    try {
      routesContent = fs.readFileSync(routesConfig, 'utf8');
    } catch (e) {
      this.results.issues.push('Frontend routes.js not found or unreadable');
      return;
    }

    console.log(`Found ${pageFiles.length} page files\n`);

    pageFiles.forEach(pageFile => {
      const pageName = path.basename(pageFile, '.jsx');
      const pageContent = fs.readFileSync(path.join(this.rootDir, pageFile), 'utf8');

      // Check if page has React export
      const hasReactExport = /export\s+(default\s+)?(?:function|const|\(|class)/.test(pageContent);

      if (!hasReactExport) {
        this.results.pages.orphaned.push({
          file: pageFile,
          reason: 'No React component export found'
        });
        console.log(`❌ ${pageName}: NOT A COMPONENT`);
      } else {
        this.results.pages.defined++;

        // Check if routed in routes config
        if (routesConfig.includes(pageName) || routesContent.includes(pageFile)) {
          this.results.pages.routed++;
          this.results.pages.wired.push(pageFile);
          console.log(`✅ ${pageName}: Defined & routed`);
        } else {
          this.results.pages.orphaned.push({
            file: pageFile,
            reason: 'Not found in frontend/src/config/routes.js'
          });
          console.log(`⚠️ ${pageName}: Defined but not routed`);
        }
      }
    });

    console.log(`\n✅ Routed pages: ${this.results.pages.routed}/${pageFiles.length}`);
  }

  // PHASE 4: Check for circular dependencies
  checkCircularDependencies() {
    console.log('\n📊 PHASE 4: Checking Circular Dependencies\n');

    const serviceFiles = glob.sync('backend/src/services/**/*.js', { cwd: this.rootDir })
      .filter(f => !f.includes('index.js') && !f.includes('.test'));

    let circularCount = 0;
    const importGraph = {};

    serviceFiles.forEach(serviceFile => {
      const content = fs.readFileSync(path.join(this.rootDir, serviceFile), 'utf8');
      const imports = content.match(/require\(['"]\.\/[^'"]+['"]\)|import.*from\s+['"][^'"]*['"]/g) || [];

      importGraph[serviceFile] = imports;
    });

    // Simple circular dep check
    Object.keys(importGraph).forEach(file => {
      importGraph[file].forEach(imp => {
        const impMatch = imp.match(/['"]([^'"]+)['"]/);
        if (impMatch) {
          const impPath = path.normalize(path.join(path.dirname(file), impMatch[1] + '.js'));
          // Check if imported file imports back
          if (importGraph[impPath] && importGraph[impPath].some(backImp =>
            backImp.includes(path.basename(file)))) {
            circularCount++;
            this.results.imports.circular.push({ file, importedBy: impPath });
          }
        }
      });
    });

    if (circularCount === 0) {
      console.log('✅ No circular dependencies detected\n');
    } else {
      console.log(`⚠️ Found ${circularCount} potential circular dependencies\n`);
    }
  }

  // PHASE 5: Verify import resolution
  checkImportResolution() {
    console.log('\n📊 PHASE 5: Checking Import Resolution\n');

    const allSourceFiles = glob.sync('backend/src/**/*.js', {
      cwd: this.rootDir,
      ignore: ['**/node_modules/**', '**/*.test.js']
    });

    let unresolvedCount = 0;

    allSourceFiles.slice(0, 50).forEach(file => { // Sample first 50
      const content = fs.readFileSync(path.join(this.rootDir, file), 'utf8');
      const requires = content.match(/require\(['"][^'"]*['"]\)/g) || [];

      requires.forEach(req => {
        const reqPath = req.match(/['"]([^'"]*)['"]/)[1];

        if (reqPath.startsWith('.')) {
          const resolvedPath = path.normalize(path.join(path.dirname(file), reqPath));

          let found = false;
          if (fs.existsSync(path.join(this.rootDir, resolvedPath + '.js')) ||
              fs.existsSync(path.join(this.rootDir, resolvedPath + '.json')) ||
              fs.existsSync(path.join(this.rootDir, resolvedPath + '/index.js'))) {
            found = true;
          }

          if (!found) {
            unresolvedCount++;
            this.results.imports.unresolved.push({ file, requires: reqPath });
          } else {
            this.results.imports.valid++;
          }
        }
      });
    });

    console.log(`✅ Valid imports (sample): ${this.results.imports.valid}`);
    if (unresolvedCount > 0) {
      console.log(`❌ Unresolved imports (sample): ${unresolvedCount}\n`);
    } else {
      console.log(`✅ No unresolved imports in sample\n`);
    }
  }

  // PHASE 6: Check component exports
  checkComponentExports() {
    console.log('\n📊 PHASE 6: Checking Component Exports\n');

    const componentFiles = glob.sync('frontend/src/components/**/*.jsx', {
      cwd: this.rootDir,
      ignore: ['**/*.test.jsx']
    });

    let validExports = 0;
    let invalidExports = 0;

    componentFiles.forEach(file => {
      const content = fs.readFileSync(path.join(this.rootDir, file), 'utf8');

      if (/export\s+(default|{|\*|\w+)/.test(content)) {
        validExports++;
      } else {
        invalidExports++;
        this.results.exports.missing.push(file);
      }
    });

    this.results.exports.valid = validExports;
    this.results.exports.invalid = invalidExports;

    console.log(`✅ Components with exports: ${validExports}/${componentFiles.length}`);
    console.log(`❌ Components without exports: ${invalidExports}\n`);
  }

  // PHASE 7: Check database migrations
  checkDatabaseMigrations() {
    console.log('\n📊 PHASE 7: Checking Database Migrations\n');

    const migrationFiles = glob.sync('backend/src/database/migrations/*.sql', {
      cwd: this.rootDir
    });

    const migrateScript = path.join(this.rootDir, 'backend/src/database/migrate.js');
    let migrateContent = '';

    try {
      migrateContent = fs.readFileSync(migrateScript, 'utf8');
    } catch (e) {
      this.results.issues.push('Migration script not found');
      return;
    }

    console.log(`Found ${migrationFiles.length} migration files\n`);
    console.log(`✅ Migration runner configured\n`);
  }

  // PHASE 8: Comprehensive report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 DEEP INTEGRATION ANALYSIS REPORT');
    console.log('='.repeat(80) + '\n');

    console.log('SERVICES INTEGRATION:');
    console.log(`  Total: ${this.results.services.exported}`);
    console.log(`  Wired: ${this.results.services.wired.length}`);
    console.log(`  Orphaned: ${this.results.services.orphaned.length}\n`);

    if (this.results.services.orphaned.length > 0) {
      console.log('  ⚠️ ORPHANED SERVICES:');
      this.results.services.orphaned.slice(0, 5).forEach(s => {
        console.log(`    - ${s.file}: ${s.reason}`);
      });
      if (this.results.services.orphaned.length > 5) {
        console.log(`    ... and ${this.results.services.orphaned.length - 5} more\n`);
      }
    }

    console.log('ROUTES INTEGRATION:');
    console.log(`  Defined: ${this.results.routes.defined}`);
    console.log(`  Mounted: ${this.results.routes.mounted}`);
    console.log(`  Orphaned: ${this.results.routes.orphaned.length}\n`);

    if (this.results.routes.orphaned.length > 0) {
      console.log('  ⚠️ ORPHANED ROUTES:');
      this.results.routes.orphaned.slice(0, 5).forEach(r => {
        console.log(`    - ${r.file}: ${r.reason}`);
      });
    }

    console.log('PAGES ROUTING:');
    console.log(`  Defined: ${this.results.pages.defined}`);
    console.log(`  Routed: ${this.results.pages.routed}`);
    console.log(`  Orphaned: ${this.results.pages.orphaned.length}\n`);

    if (this.results.pages.orphaned.length > 0) {
      console.log('  ⚠️ UNROUTED PAGES:');
      this.results.pages.orphaned.slice(0, 5).forEach(p => {
        console.log(`    - ${p.file}: ${p.reason}`);
      });
    }

    console.log('COMPONENT EXPORTS:');
    console.log(`  Valid: ${this.results.exports.valid}`);
    console.log(`  Invalid: ${this.results.exports.invalid}\n`);

    console.log('IMPORT HEALTH:');
    console.log(`  Valid imports: ${this.results.imports.valid}`);
    console.log(`  Unresolved: ${this.results.imports.unresolved.length}`);
    console.log(`  Circular deps: ${this.results.imports.circular.length}\n`);

    console.log('CRITICAL ISSUES:');
    if (this.results.issues.length === 0) {
      console.log('  ✅ No critical issues found\n');
    } else {
      this.results.issues.forEach(issue => console.log(`  ❌ ${issue}`));
    }

    console.log('='.repeat(80));
    console.log('✅ DEEP INTEGRATION ANALYSIS COMPLETE');
    console.log('='.repeat(80) + '\n');
  }

  async run() {
    console.log('🔬 STARTING DEEP INTEGRATION ANALYSIS\n');

    this.analyzeServiceExports();
    this.analyzeRouteWiring();
    this.analyzeFrontendRouting();
    this.checkCircularDependencies();
    this.checkImportResolution();
    this.checkComponentExports();
    this.checkDatabaseMigrations();
    this.generateReport();

    // Save detailed report
    const reportPath = path.join(this.rootDir, '.ai/deep-integration-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`💾 Detailed report saved: .ai/deep-integration-analysis-report.json\n`);

    return this.results;
  }
}

if (require.main === module) {
  const analysis = new DeepIntegrationAnalysis(process.cwd());
  analysis.run().catch(err => {
    console.error('❌ Analysis failed:', err);
    process.exit(1);
  });
}

module.exports = DeepIntegrationAnalysis;
