#!/usr/bin/env node

/**
 * LINKAGE REPAIR TOOL - Master Script
 * Identifies and repairs ALL broken linkages in the EBDESIGN platform
 * 
 * Usage: node linkageRepairTool.js
 */

'use strict';

const path = require('path');
const fs = require('fs');
const LinkageRepairSystem = require('./backend/src/utils/linkageRepairSystem');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${COLORS[color] || ''}${message}${COLORS.reset}`);
}

async function runRepairSystem() {
  log('cyan', '\n╔════════════════════════════════════════════════════════════════╗');
  log('cyan', '║     EBDESIGN PLATFORM - LINKAGE REPAIR SYSTEM v1.0             ║');
  log('cyan', '║     Comprehensive Linkage Validation & Auto-Fix                ║');
  log('cyan', '╚════════════════════════════════════════════════════════════════╝\n');

  const system = new LinkageRepairSystem();
  const backendDir = path.join(__dirname, 'backend/src');
  const frontendDir = path.join(__dirname, 'frontend/src');

  try {
    // STEP 1: Scan for broken imports
    log('blue', '━━━ STEP 1: Scanning for broken imports ━━━');
    const brokenImports = await system.scanBrokenImports(backendDir);
    if (brokenImports.length > 0) {
      log('yellow', `  Found ${brokenImports.length} broken imports`);
      brokenImports.slice(0, 5).forEach(imp => {
        log('yellow', `    - ${imp.file}: ${imp.importPath}`);
      });
    } else {
      log('green', '  ✓ No broken imports found');
    }

    // STEP 2: Detect circular dependencies
    log('blue', '\n━━━ STEP 2: Detecting circular dependencies ━━━');
    const cycles = await system.detectCircularDependencies(backendDir);
    if (cycles.length > 0) {
      log('yellow', `  Found ${cycles.length} circular dependency chains`);
    } else {
      log('green', '  ✓ No circular dependencies found');
    }

    // STEP 3: Validate exports
    log('blue', '\n━━━ STEP 3: Validating exports/imports ━━━');
    const exportMismatches = await system.validateExports(backendDir);
    if (exportMismatches.length > 0) {
      log('yellow', `  Found ${exportMismatches.length} export mismatches`);
    } else {
      log('green', '  ✓ All exports valid');
    }

    // STEP 4: Validate database connections
    log('blue', '\n━━━ STEP 4: Validating database connections ━━━');
    const dbIssues = await system.validateDatabaseConnections(
      path.join(backendDir, 'services')
    );
    if (dbIssues.length > 0) {
      log('yellow', `  Found ${dbIssues.length} database linkage issues`);
    } else {
      log('green', '  ✓ Database connections valid');
    }

    // STEP 5: Validate middleware chain
    log('blue', '\n━━━ STEP 5: Validating middleware chain ━━━');
    const middlewareIssues = await system.validateMiddlewareChain(
      path.join(backendDir, 'index.js')
    );
    if (middlewareIssues.length > 0) {
      log('yellow', `  Found ${middlewareIssues.length} middleware issues`);
      middlewareIssues.forEach(issue => {
        log('yellow', `    - ${issue}`);
      });
    } else {
      log('green', '  ✓ Middleware chain valid');
    }

    // STEP 6: Auto-fix broken imports
    if (brokenImports.length > 0) {
      log('blue', '\n━━━ STEP 6: Auto-fixing broken imports ━━━');
      await system.autoFixBrokenImports(brokenImports);
      log('green', `  ✓ Fixed ${system.fixes.length} imports`);
    }

    // STEP 7: Repair export mismatches
    if (exportMismatches.length > 0) {
      log('blue', '\n━━━ STEP 7: Repairing export mismatches ━━━');
      await system.repairExportMismatches(exportMismatches);
    }

    // STEP 8: Repair circular dependencies
    if (cycles.length > 0) {
      log('blue', '\n━━━ STEP 8: Analyzing circular dependencies ━━━');
      await system.repairCircularDependencies(cycles);
    }

    // FINAL REPORT
    log('cyan', '\n╔════════════════════════════════════════════════════════════════╗');
    log('cyan', '║                        REPAIR SUMMARY                          ║');
    log('cyan', '╚════════════════════════════════════════════════════════════════╝');

    const report = await system.generateReport();

    log('blue', `\nIssues Found:`);
    log('red', `  ✗ Errors:       ${report.totalErrors}`);
    log('yellow', `  ⚠ Warnings:     ${report.totalWarnings}`);
    log('green', `  ✓ Fixes Applied: ${report.totalFixes}`);

    if (report.warnings.length > 0) {
      log('yellow', `\nWarnings:`);
      report.warnings.slice(0, 10).forEach(w => {
        log('yellow', `  - ${w}`);
      });
    }

    if (report.fixes.length > 0) {
      log('green', `\nFixes Applied:`);
      report.fixes.forEach(f => {
        log('green', `  ✓ ${f}`);
      });
    }

    // Save report to file
    const reportFile = './LINKAGE_REPAIR_REPORT.json';
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    log('cyan', `\nFull report saved to: ${reportFile}`);

    log('cyan', '\n╔════════════════════════════════════════════════════════════════╗');
    if (report.totalErrors === 0 && report.totalWarnings === 0) {
      log('green', '║          ✓ ALL LINKAGES VALIDATED - SYSTEM HEALTHY           ║');
    } else if (report.totalErrors === 0) {
      log('yellow', '║        ⚠ SYSTEM OPERATIONAL - REVIEW WARNINGS               ║');
    } else {
      log('red', '║      ✗ CRITICAL ISSUES FOUND - MANUAL REVIEW REQUIRED       ║');
    }
    log('cyan', '╚════════════════════════════════════════════════════════════════╝\n');

    process.exit(report.totalErrors > 0 ? 1 : 0);

  } catch (error) {
    log('red', `\n✗ Repair system error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the system
runRepairSystem();
