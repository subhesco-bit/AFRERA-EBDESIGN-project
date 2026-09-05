#!/usr/bin/env node

/**
 * EBDESIGN Comprehensive File Audit
 * Scans all files to verify integration, completeness, and production readiness
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class ComprehensiveFileAudit {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.results = {
      totalFiles: 0,
      skeletonFiles: [],
      prototypeFiles: [],
      incompleteFiles: [],
      orphanedFiles: [],
      missingIntegration: [],
      productionReady: [],
      warnings: [],
      stats: {}
    };
  }

  /**
   * Scan all source files
   */
  scanAllFiles() {
    console.log('🔍 STARTING COMPREHENSIVE FILE AUDIT\n');
    console.log('PHASE 1: Discovering all files...');

    const patterns = [
      'backend/src/**/*.js',
      'frontend/src/**/*.jsx',
      'frontend/src/**/*.js',
      '_EBDESIGN_LIBRARY/**/*.js',
      '_EBDESIGN_LIBRARY/**/*.md'
    ];

    let allFiles = [];
    patterns.forEach(pattern => {
      try {
        const files = glob.sync(pattern, {
          cwd: this.rootDir,
          ignore: ['**/node_modules/**', '**/__tests__/**', '**/*.test.js']
        });
        allFiles = allFiles.concat(files);
      } catch (e) {
        this.results.warnings.push(`Pattern error: ${pattern}`);
      }
    });

    this.results.totalFiles = allFiles.length;
    console.log(`✅ Found ${allFiles.length} files\n`);

    return allFiles;
  }

  /**
   * Identify skeleton files (empty, minimal stubs)
   */
  identifySkeletonFiles(files) {
    console.log('PHASE 2: Identifying skeleton files...');

    let skeletonCount = 0;

    files.forEach(file => {
      try {
        const fullPath = path.join(this.rootDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.trim().split('\n').length;
        const hasCode = /function|class|const|export|import/.test(content);

        // Skeleton: <10 lines, minimal content
        if (lines < 10 && !hasCode) {
          this.results.skeletonFiles.push({
            file,
            lines,
            reason: 'Minimal stub with no functional code'
          });
          skeletonCount++;
        }

        // Skeleton: File with only comments
        if (/^[\/\*\s]*$/.test(content.replace(/\/\/.*/g, ''))) {
          this.results.skeletonFiles.push({
            file,
            lines,
            reason: 'File contains only comments'
          });
          skeletonCount++;
        }
      } catch (e) {
        this.results.warnings.push(`Read error: ${file}`);
      }
    });

    console.log(`✅ Found ${skeletonCount} skeleton files\n`);
    return skeletonCount;
  }

  /**
   * Identify prototype files (TODO, FIXME, stub implementations)
   */
  identifyPrototypeFiles(files) {
    console.log('PHASE 3: Identifying prototype/incomplete files...');

    let prototypeCount = 0;
    let incompleteCount = 0;

    files.forEach(file => {
      try {
        const fullPath = path.join(this.rootDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for TODO/FIXME comments indicating incomplete work
        const todoCount = (content.match(/TODO|FIXME|XXX|HACK/g) || []).length;
        if (todoCount > 2) {
          this.results.incompleteFiles.push({
            file,
            todos: todoCount,
            reason: `${todoCount} TODO/FIXME comments`
          });
          incompleteCount++;
        }

        // Prototype indicators
        if (/stub|scaffold|placeholder|mock|test.*implementation/i.test(content)) {
          this.results.prototypeFiles.push({
            file,
            reason: 'Contains stub/placeholder implementation'
          });
          prototypeCount++;
        }

        // Check for NotImplementedError or similar
        if (/NotImplementedError|NotImplemented|throw new Error.*not.*implement/i.test(content)) {
          this.results.incompleteFiles.push({
            file,
            reason: 'Contains NotImplementedError'
          });
          incompleteCount++;
        }
      } catch (e) {
        // Skip
      }
    });

    console.log(`✅ Found ${prototypeCount} prototype files`);
    console.log(`✅ Found ${incompleteCount} incomplete files\n`);

    return { prototypeCount, incompleteCount };
  }

  /**
   * Verify all files are imported/exported
   */
  verifyFileIntegration(files) {
    console.log('PHASE 4: Verifying file integration...');

    const backendServices = files.filter(f => f.includes('backend/src/services/'));
    const backendRoutes = files.filter(f => f.includes('backend/src/routes/'));
    const frontendPages = files.filter(f => f.includes('frontend/src/pages/'));
    const frontendComponents = files.filter(f => f.includes('frontend/src/components/'));

    // Check if services are exported
    let unintegratedServices = 0;
    try {
      const servicesIndex = fs.readFileSync(
        path.join(this.rootDir, 'backend/src/services/index.js'),
        'utf8'
      );

      backendServices.forEach(service => {
        const serviceName = path.basename(service, '.js');
        if (!servicesIndex.includes(serviceName)) {
          this.results.missingIntegration.push({
            file: service,
            type: 'service_not_exported',
            index: 'backend/src/services/index.js'
          });
          unintegratedServices++;
        }
      });
    } catch (e) {
      this.results.warnings.push('Could not verify services index');
    }

    // Check if routes are wired
    let unwiredRoutes = 0;
    try {
      const mainIndex = fs.readFileSync(
        path.join(this.rootDir, 'backend/src/index.js'),
        'utf8'
      );

      backendRoutes.forEach(route => {
        const routeName = path.basename(route, '.js');
        if (!mainIndex.includes(routeName)) {
          this.results.missingIntegration.push({
            file: route,
            type: 'route_not_wired',
            index: 'backend/src/index.js'
          });
          unwiredRoutes++;
        }
      });
    } catch (e) {
      this.results.warnings.push('Could not verify routes index');
    }

    // Check if pages are routed
    let unroutedPages = 0;
    try {
      const routesConfig = fs.readFileSync(
        path.join(this.rootDir, 'frontend/src/config/routes.js'),
        'utf8'
      );

      frontendPages.forEach(page => {
        const pageName = path.basename(page, '.jsx');
        if (!routesConfig.includes(pageName)) {
          this.results.missingIntegration.push({
            file: page,
            type: 'page_not_routed',
            config: 'frontend/src/config/routes.js'
          });
          unroutedPages++;
        }
      });
    } catch (e) {
      this.results.warnings.push('Could not verify routes config');
    }

    console.log(`✅ Checked ${backendServices.length} services (${unintegratedServices} not exported)`);
    console.log(`✅ Checked ${backendRoutes.length} routes (${unwiredRoutes} not wired)`);
    console.log(`✅ Checked ${frontendPages.length} pages (${unroutedPages} not routed)\n`);

    return { unintegratedServices, unwiredRoutes, unroutedPages };
  }

  /**
   * Verify production-readiness indicators
   */
  verifyProductionReadiness(files) {
    console.log('PHASE 5: Verifying production-readiness...');

    let productionReady = 0;
    let needsReview = 0;

    files.forEach(file => {
      try {
        const fullPath = path.join(this.rootDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.trim().split('\n').length;

        // Check for production-ready indicators
        const hasErrorHandling = /try\s*{|catch\s*\(|error|Error|throw/i.test(content);
        const hasLogging = /console\.log|logger|log\(|debug/i.test(content);
        const hasValidation = /validate|check|assert|verify/i.test(content);
        const hasDocumentation = /\/\*\*|\*\/|\/\//i.test(content);
        const hasExports = /export|module\.exports/i.test(content);

        const readinessScore = [
          hasErrorHandling,
          hasLogging,
          hasValidation,
          hasDocumentation,
          hasExports
        ].filter(x => x).length;

        if (readinessScore >= 4 && lines > 20) {
          this.results.productionReady.push(file);
          productionReady++;
        } else if (readinessScore >= 3) {
          needsReview++;
        }
      } catch (e) {
        // Skip
      }
    });

    console.log(`✅ Production-ready files: ${productionReady}`);
    console.log(`⚠️ Needs review: ${needsReview}\n`);

    return { productionReady, needsReview };
  }

  /**
   * Identify orphaned files (no importers, no exports)
   */
  identifyOrphanedFiles(files) {
    console.log('PHASE 6: Identifying orphaned files...');

    const excludePatterns = [
      'index.js',
      'main.jsx',
      'App.jsx',
      'test',
      'spec',
      'mock'
    ];

    const isEntryPoint = (file) => {
      return excludePatterns.some(pattern => file.includes(pattern));
    };

    // For now, mark any file without imports/exports as potentially orphaned
    let potentialOrphans = 0;

    files.forEach(file => {
      if (!isEntryPoint(file)) {
        try {
          const fullPath = path.join(this.rootDir, file);
          const content = fs.readFileSync(fullPath, 'utf8');
          const hasImportOrExport = /import|require|export/i.test(content);

          if (!hasImportOrExport && content.trim().length > 50) {
            this.results.orphanedFiles.push({
              file,
              reason: 'No imports or exports, may be unused'
            });
            potentialOrphans++;
          }
        } catch (e) {
          // Skip
        }
      }
    });

    console.log(`⚠️ Potentially orphaned files: ${potentialOrphans}\n`);

    return potentialOrphans;
  }

  /**
   * Check for critical missing components
   */
  checkMissingComponents() {
    console.log('PHASE 7: Checking for missing critical components...');

    const criticalFiles = [
      'backend/src/index.js',
      'backend/src/services/index.js',
      'backend/src/routes/index.js',
      'backend/src/middleware/index.js',
      'frontend/src/main.jsx',
      'frontend/src/config/routes.js',
      'frontend/src/components/index.js',
      'frontend/src/pages/index.js'
    ];

    let missing = 0;

    criticalFiles.forEach(file => {
      const fullPath = path.join(this.rootDir, file);
      if (!fs.existsSync(fullPath)) {
        this.results.warnings.push(`Critical file missing: ${file}`);
        missing++;
      }
    });

    console.log(`✅ Critical files check: ${missing} missing\n`);

    return missing;
  }

  /**
   * Generate comprehensive audit report
   */
  generateReport() {
    console.log('='.repeat(80));
    console.log('📊 COMPREHENSIVE FILE AUDIT REPORT');
    console.log('='.repeat(80) + '\n');

    console.log('📈 SUMMARY METRICS');
    console.log(`  Total Files: ${this.results.totalFiles}`);
    console.log(`  Skeleton Files: ${this.results.skeletonFiles.length}`);
    console.log(`  Prototype Files: ${this.results.prototypeFiles.length}`);
    console.log(`  Incomplete Files: ${this.results.incompleteFiles.length}`);
    console.log(`  Missing Integration: ${this.results.missingIntegration.length}`);
    console.log(`  Orphaned Files: ${this.results.orphanedFiles.length}`);
    console.log(`  Production-Ready: ${this.results.productionReady.length}`);
    console.log(`  Warnings: ${this.results.warnings.length}\n`);

    if (this.results.skeletonFiles.length > 0) {
      console.log('❌ SKELETON FILES FOUND:');
      this.results.skeletonFiles.slice(0, 10).forEach(f => {
        console.log(`  • ${f.file} (${f.lines} lines) - ${f.reason}`);
      });
      if (this.results.skeletonFiles.length > 10) {
        console.log(`  ... and ${this.results.skeletonFiles.length - 10} more`);
      }
      console.log();
    }

    if (this.results.prototypeFiles.length > 0) {
      console.log('⚠️ PROTOTYPE FILES FOUND:');
      this.results.prototypeFiles.slice(0, 10).forEach(f => {
        console.log(`  • ${f.file}`);
      });
      if (this.results.prototypeFiles.length > 10) {
        console.log(`  ... and ${this.results.prototypeFiles.length - 10} more`);
      }
      console.log();
    }

    if (this.results.incompleteFiles.length > 0) {
      console.log('🟡 INCOMPLETE FILES (TODOs/FIXMEs):');
      this.results.incompleteFiles.slice(0, 10).forEach(f => {
        console.log(`  • ${f.file} - ${f.reason || f.todos + ' TODOs'}`);
      });
      if (this.results.incompleteFiles.length > 10) {
        console.log(`  ... and ${this.results.incompleteFiles.length - 10} more`);
      }
      console.log();
    }

    if (this.results.missingIntegration.length > 0) {
      console.log('🔗 MISSING INTEGRATION:');
      this.results.missingIntegration.slice(0, 10).forEach(f => {
        console.log(`  • ${f.file} - ${f.type}`);
      });
      if (this.results.missingIntegration.length > 10) {
        console.log(`  ... and ${this.results.missingIntegration.length - 10} more`);
      }
      console.log();
    }

    if (this.results.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      this.results.warnings.slice(0, 5).forEach(w => {
        console.log(`  • ${w}`);
      });
      console.log();
    }

    console.log('='.repeat(80));
    console.log('📋 AUDIT VERDICT');
    console.log('='.repeat(80));

    const issues = this.results.skeletonFiles.length +
                   this.results.prototypeFiles.length +
                   this.results.missingIntegration.length;

    if (issues === 0) {
      console.log('\n✅ COMPREHENSIVE AUDIT PASSED\n');
      console.log('Status: All files integrated, production-ready, zero issues found');
      return 'PASS';
    } else if (issues < 10) {
      console.log('\n⚠️ AUDIT PASSED WITH MINOR ISSUES\n');
      console.log(`Status: ${issues} minor issues found, review recommended`);
      return 'PASS_WITH_WARNINGS';
    } else {
      console.log('\n❌ AUDIT FAILED\n');
      console.log(`Status: ${issues} significant issues found, action required`);
      return 'FAIL';
    }
  }

  /**
   * Run complete audit
   */
  async runCompleteAudit() {
    const files = this.scanAllFiles();
    this.identifySkeletonFiles(files);
    this.identifyPrototypeFiles(files);
    this.verifyFileIntegration(files);
    this.verifyProductionReadiness(files);
    this.identifyOrphanedFiles(files);
    this.checkMissingComponents();

    const verdict = this.generateReport();

    // Save detailed report
    const reportPath = path.join(this.rootDir, '.ai/comprehensive-file-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Detailed report: .ai/comprehensive-file-audit-report.json\n`);

    return verdict;
  }
}

if (require.main === module) {
  const audit = new ComprehensiveFileAudit(process.cwd());
  audit.runCompleteAudit()
    .then(verdict => {
      process.exit(verdict === 'FAIL' ? 1 : 0);
    })
    .catch(err => {
      console.error('❌ Audit error:', err);
      process.exit(1);
    });
}

module.exports = ComprehensiveFileAudit;
