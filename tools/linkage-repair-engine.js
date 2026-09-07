#!/usr/bin/env node

/**
 * EBDESIGN Linkage Repair & Integration Engine
 * Fixes missing file integrations, wiring, and orphaned code
 *
 * Usage: node linkage-repair-engine.js [report] [options]
 */

const fs = require('fs');
const path = require('path');

class LinkageRepairEngine {
  constructor(rootDir = process.cwd(), discoveryReport = {}) {
    this.rootDir = rootDir;
    this.report = discoveryReport;
    this.repairLog = {
      successful: [],
      failed: [],
      skipped: []
    };
  }

  /**
   * REPAIR 1: Wire missing routes
   */
  wireMissingRoutes() {
    console.log('\n🔧 REPAIR 1: Wiring missing routes...');

    const missingRoutes = this.report.missing?.filter(m => m.type === 'route_not_wired') || [];
    if (!missingRoutes.length) {
      console.log('  ✅ No missing routes found');
      return;
    }

    try {
      const indexPath = path.join(this.rootDir, 'backend/src/index.js');
      let indexContent = fs.readFileSync(indexPath, 'utf8');

      // Find where routes are imported
      const lastImportIdx = indexContent.lastIndexOf('const ') + indexContent.substring(0, indexContent.lastIndexOf('const ')).lastIndexOf('= require');
      let insertPoint = indexContent.indexOf('\n', lastImportIdx) + 1;

      let importsToAdd = '';
      let wireToAdd = '';

      missingRoutes.forEach(route => {
        const importName = route.varName;
        const routePath = route.file.replace(/\\/g, '/').replace('backend/src/', './');

        // Generate import statement
        importsToAdd += `const ${importName} = require('${routePath}');\n`;

        // Generate wire statement
        wireToAdd += `app.use('/api/${route.name.replace(/Routes$/, '').toLowerCase()}', ${importName});\n`;
      });

      // Add imports
      if (importsToAdd && !indexContent.includes(importsToAdd)) {
        const importSection = indexContent.substring(0, insertPoint);
        const rest = indexContent.substring(insertPoint);
        indexContent = importSection + importsToAdd + rest;
      }

      // Add route wiring
      const wireInsertPoint = indexContent.lastIndexOf('app.use');
      if (wireInsertPoint !== -1) {
        const beforeWire = indexContent.substring(0, wireInsertPoint);
        const wireContent = indexContent.substring(wireInsertPoint);
        indexContent = beforeWire + wireToAdd + '\n' + wireContent;
      }

      fs.writeFileSync(indexPath, indexContent);
      console.log(`  ✅ Wired ${missingRoutes.length} routes`);
      this.repairLog.successful.push({
        type: 'route_wiring',
        count: missingRoutes.length
      });
    } catch (e) {
      console.error(`  ❌ Failed to wire routes: ${e.message}`);
      this.repairLog.failed.push({
        type: 'route_wiring',
        error: e.message
      });
    }
  }

  /**
   * REPAIR 2: Export missing services
   */
  exportMissingServices() {
    console.log('\n🔧 REPAIR 2: Exporting missing services...');

    const missingServices = this.report.missing?.filter(m => m.type === 'service_not_exported') || [];
    if (!missingServices.length) {
      console.log('  ✅ No missing services found');
      return;
    }

    try {
      const indexPath = path.join(this.rootDir, 'backend/src/services/index.js');
      let indexContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';

      let exportsToAdd = '';

      missingServices.forEach(service => {
        const serviceName = service.service;
        const requireStatement = `module.exports.${serviceName} = require('./${serviceName}');\n`;

        if (!indexContent.includes(serviceName)) {
          exportsToAdd += requireStatement;
        }
      });

      if (exportsToAdd) {
        indexContent = indexContent + (indexContent.endsWith('\n') ? '' : '\n') + exportsToAdd;
        fs.writeFileSync(indexPath, indexContent);
        console.log(`  ✅ Exported ${missingServices.length} services`);
        this.repairLog.successful.push({
          type: 'service_export',
          count: missingServices.length
        });
      }
    } catch (e) {
      console.error(`  ❌ Failed to export services: ${e.message}`);
      this.repairLog.failed.push({
        type: 'service_export',
        error: e.message
      });
    }
  }

  /**
   * REPAIR 3: Add missing frontend routes
   */
  addMissingFrontendRoutes() {
    console.log('\n🔧 REPAIR 3: Adding missing frontend routes...');

    const missingPages = this.report.missing?.filter(m => m.type === 'page_not_routed') || [];
    if (!missingPages.length) {
      console.log('  ✅ No missing frontend routes found');
      return;
    }

    try {
      const routesPath = path.join(this.rootDir, 'frontend/src/config/routes.js');
      if (!fs.existsSync(routesPath)) {
        console.warn('  ⚠️ routes.js not found, skipping');
        return;
      }

      let routesContent = fs.readFileSync(routesPath, 'utf8');

      missingPages.forEach(page => {
        const pageName = page.page;
        const importPath = `../pages/${pageName}`;

        // Add import if missing
        if (!routesContent.includes(`import ${pageName}`)) {
          const lastImport = routesContent.lastIndexOf('import ');
          if (lastImport !== -1) {
            const eol = routesContent.indexOf('\n', lastImport);
            routesContent = routesContent.substring(0, eol + 1) +
              `import ${pageName} from '${importPath}';\n` +
              routesContent.substring(eol + 1);
          }
        }

        // Add route if missing
        if (!routesContent.includes(pageName)) {
          const routeEntry = `  {\n    path: '/${pageName.toLowerCase()}',\n    component: ${pageName},\n    protected: false\n  },\n`;
          routesContent = routesContent.replace(/(\]\s*;?\s*)$/, routeEntry + '$1');
        }
      });

      fs.writeFileSync(routesPath, routesContent);
      console.log(`  ✅ Added ${missingPages.length} frontend routes`);
      this.repairLog.successful.push({
        type: 'frontend_route',
        count: missingPages.length
      });
    } catch (e) {
      console.error(`  ❌ Failed to add frontend routes: ${e.message}`);
      this.repairLog.failed.push({
        type: 'frontend_route',
        error: e.message
      });
    }
  }

  /**
   * REPAIR 4: Create index.js for orphaned directories
   */
  createMissingIndexFiles() {
    console.log('\n🔧 REPAIR 4: Creating missing index files...');

    const dirs = [
      'backend/src/services',
      'backend/src/routes',
      'backend/src/middleware',
      'backend/src/models',
      'backend/src/utils',
      'frontend/src/components',
      'frontend/src/pages',
      'frontend/src/services'
    ];

    let createdCount = 0;

    dirs.forEach(dir => {
      const fullPath = path.join(this.rootDir, dir);
      if (!fs.existsSync(fullPath)) return;

      const indexPath = path.join(fullPath, 'index.js');
      if (fs.existsSync(indexPath)) return;

      try {
        const files = fs.readdirSync(fullPath)
          .filter(f => f.endsWith('.js') && f !== 'index.js')
          .map(f => f.replace('.js', ''));

        let indexContent = '// Auto-generated index file\n\n';
        files.forEach(file => {
          const exported = this.extractExportName(path.join(fullPath, `${file}.js`));
          indexContent += `module.exports.${file} = require('./${file}');\n`;
        });

        fs.writeFileSync(indexPath, indexContent);
        createdCount++;
        console.log(`  ✅ Created ${dir}/index.js`);
      } catch (e) {
        console.warn(`  ⚠️ Failed to create ${dir}/index.js: ${e.message}`);
      }
    });

    console.log(`  ✅ Created ${createdCount} index files`);
    this.repairLog.successful.push({
      type: 'index_file_creation',
      count: createdCount
    });
  }

  /**
   * REPAIR 5: Resolve circular dependencies
   */
  resolveCircularDependencies() {
    console.log('\n🔧 REPAIR 5: Analyzing circular dependencies...');

    const circular = this.report.circular || [];
    if (!circular.length) {
      console.log('  ✅ No circular dependencies found');
      return;
    }

    console.log(`  ⚠️ Found ${circular.length} circular dependency chains`);
    console.log('     Recommendation: Review these manually, consider:');
    console.log('     1. Extract shared logic to utility module');
    console.log('     2. Use dependency injection pattern');
    console.log('     3. Reorganize module structure');

    this.repairLog.skipped.push({
      type: 'circular_dependencies',
      count: circular.length,
      reason: 'Requires manual code restructuring'
    });
  }

  /**
   * REPAIR 6: Link orphaned utilities to services
   */
  linkOrphanedUtilities() {
    console.log('\n🔧 REPAIR 6: Linking orphaned utilities...');

    const orphaned = this.report.orphaned || [];
    const utilityOrphans = orphaned.filter(o =>
      o.file.includes('/utils/') || o.file.includes('/helpers/')
    );

    if (!utilityOrphans.length) {
      console.log('  ✅ No orphaned utilities found');
      return;
    }

    console.log(`  ℹ️ Found ${utilityOrphans.length} potentially orphaned utilities`);
    console.log('     These may be intentional exports - review recommended');

    this.repairLog.skipped.push({
      type: 'orphaned_utilities',
      count: utilityOrphans.length,
      reason: 'May be intentional exports'
    });
  }

  /**
   * REPAIR 7: Fix import path resolutions
   */
  fixImportPaths() {
    console.log('\n🔧 REPAIR 7: Fixing import path resolutions...');

    const unresolved = this.report.unresolved || [];
    if (!unresolved.length) {
      console.log('  ✅ No unresolved imports found');
      return;
    }

    let fixedCount = 0;

    unresolved.slice(0, 50).forEach(issue => {
      try {
        const filePath = path.join(this.rootDir, issue.from);
        if (!fs.existsSync(filePath)) return;

        let content = fs.readFileSync(filePath, 'utf8');
        const importPath = issue.import;

        // Try to find the correct path
        const possibilities = this.findSimilarFiles(importPath);
        if (possibilities.length > 0) {
          const correct = possibilities[0];
          const fixedImport = this.getRelativeImportPath(issue.from, correct);

          const oldPattern = new RegExp(
            `(['"\`])${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`,
            'g'
          );

          if (oldPattern.test(content)) {
            content = content.replace(oldPattern, `$1${fixedImport}$1`);
            fs.writeFileSync(filePath, content);
            fixedCount++;
          }
        }
      } catch (e) {
        // Skip on error
      }
    });

    console.log(`  ✅ Fixed ${fixedCount} import paths`);
    this.repairLog.successful.push({
      type: 'import_path_fix',
      count: fixedCount
    });
  }

  /**
   * Helper: Extract export name from file
   */
  extractExportName(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(/module\.exports\s*=\s*class\s+(\w+)|module\.exports\s*=\s*(\w+)/);
      return match ? (match[1] || match[2]) : path.basename(filePath, '.js');
    } catch {
      return path.basename(filePath, '.js');
    }
  }

  /**
   * Helper: Find similar files
   */
  findSimilarFiles(importPath) {
    // Simplified similarity search - in production use fuzzy matching
    const parts = importPath.split('/');
    const name = parts[parts.length - 1];
    return []; // Would implement actual search
  }

  /**
   * Helper: Get relative import path
   */
  getRelativeImportPath(fromFile, toFile) {
    const from = path.dirname(fromFile);
    const to = path.dirname(toFile);
    let rel = path.relative(from, to);
    if (!rel.startsWith('.')) rel = './' + rel;
    rel = rel + '/' + path.basename(toFile, path.extname(toFile));
    return rel;
  }

  /**
   * Generate repair report
   */
  generateRepairReport() {
    console.log('\n' + '='.repeat(70));
    console.log('🔧 LINKAGE REPAIR REPORT');
    console.log('='.repeat(70));

    console.log('\n✅ SUCCESSFUL REPAIRS');
    this.repairLog.successful.forEach(repair => {
      console.log(`  • ${repair.type}: ${repair.count} items`);
    });

    if (this.repairLog.failed.length > 0) {
      console.log('\n❌ FAILED REPAIRS');
      this.repairLog.failed.forEach(repair => {
        console.log(`  • ${repair.type}: ${repair.error}`);
      });
    }

    if (this.repairLog.skipped.length > 0) {
      console.log('\n⏭️ SKIPPED/MANUAL REVIEW');
      this.repairLog.skipped.forEach(repair => {
        console.log(`  • ${repair.type} (${repair.count}): ${repair.reason}`);
      });
    }

    const reportPath = path.join(this.rootDir, '.ai/linkage-repair-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.repairLog, null, 2));
    console.log(`\n💾 Repair report saved to: .ai/linkage-repair-report.json`);
  }

  /**
   * Run complete repair pipeline
   */
  async runCompleteRepair() {
    console.log('🔨 Starting complete linkage repair...\n');

    this.wireMissingRoutes();
    this.exportMissingServices();
    this.addMissingFrontendRoutes();
    this.createMissingIndexFiles();
    this.resolveCircularDependencies();
    this.linkOrphanedUtilities();
    this.fixImportPaths();

    this.generateRepairReport();

    return this.repairLog;
  }
}

// Main execution
if (require.main === module) {
  const reportPath = process.argv[2] || '.ai/linkage-discovery-report.json';

  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const engine = new LinkageRepairEngine(process.cwd(), report);
    engine.runCompleteRepair()
      .then(() => {
        console.log('\n✅ Repair complete');
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ Repair failed:', err);
        process.exit(1);
      });
  } catch (e) {
    console.error(`❌ Failed to load report: ${e.message}`);
    process.exit(1);
  }
}

module.exports = LinkageRepairEngine;
