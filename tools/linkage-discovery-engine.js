#!/usr/bin/env node

/**
 * EBDESIGN File Linkage Discovery & Repair Engine
 * Discovers missing file integrations, orphaned code, and broken wiring
 *
 * Usage: node linkage-discovery-engine.js [options]
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');

class LinkageDiscoveryEngine {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.discovered = {
      files: [],
      imports: new Map(),
      exports: new Map(),
      unresolved: [],
      orphaned: [],
      circular: [],
      missing: []
    };
    this.stats = {
      totalFiles: 0,
      sourceFiles: 0,
      linkageCandidates: 0,
      discoveredIssues: 0
    };
  }

  /**
   * PHASE 1: Discover all source files
   */
  discoverAllFiles() {
    console.log('📍 PHASE 1: Discovering all source files...');

    const patterns = [
      'backend/src/**/*.js',
      '!backend/src/**/*.test.js',
      '!backend/node_modules/**',
      'frontend/src/**/*.jsx',
      'frontend/src/**/*.js',
      '!frontend/src/**/*.test.jsx',
      '!frontend/node_modules/**',
      '_EBDESIGN_LIBRARY/**/*.js',
      '!_EBDESIGN_LIBRARY/**/node_modules/**'
    ];

    let files = [];
    patterns.forEach(pattern => {
      try {
        const matches = glob.sync(pattern, { cwd: this.rootDir });
        files = files.concat(matches);
      } catch (e) {
        console.error(`Pattern error: ${pattern}`, e.message);
      }
    });

    this.discovered.files = [...new Set(files)];
    this.stats.totalFiles = this.discovered.files.length;
    console.log(`✅ Discovered ${this.stats.totalFiles} source files`);
    return this.discovered.files;
  }

  /**
   * PHASE 2: Map all imports and exports
   */
  mapDependencies() {
    console.log('📍 PHASE 2: Mapping dependencies...');

    const importRegex = /(?:import|require)\s*\(?(?:.*?from\s+)?['"`]([^'"`]+)['"`]/g;
    const exportRegex = /export\s+(?:default\s+)?(?:(?:const|function|class)\s+(\w+)|{\s*([^}]+)\s*})/g;

    let issueCount = 0;

    this.discovered.files.forEach((file, idx) => {
      if (idx % 100 === 0) console.log(`  Processing ${idx}/${this.discovered.files.length}...`);

      try {
        const content = fs.readFileSync(path.join(this.rootDir, file), 'utf8');

        // Map imports
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          if (!this.discovered.imports.has(file)) {
            this.discovered.imports.set(file, []);
          }
          this.discovered.imports.get(file).push(importPath);
          this.stats.linkageCandidates++;
        }

        // Map exports
        exportRegex.lastIndex = 0;
        while ((match = exportRegex.exec(content)) !== null) {
          if (!this.discovered.exports.has(file)) {
            this.discovered.exports.set(file, []);
          }
          this.discovered.exports.get(file).push(match[1] || match[2] || 'default');
        }
      } catch (e) {
        console.warn(`  ⚠️ Error reading ${file}: ${e.message}`);
        issueCount++;
      }
    });

    console.log(`✅ Mapped ${this.stats.linkageCandidates} dependency linkages`);
    console.log(`⚠️ ${issueCount} files had read errors`);
    return this.discovered;
  }

  /**
   * PHASE 3: Identify unresolved imports
   */
  findUnresolvedImports() {
    console.log('📍 PHASE 3: Finding unresolved imports...');

    const builtins = new Set([
      'fs', 'path', 'crypto', 'http', 'https', 'os', 'stream',
      'events', 'util', 'net', 'dgram', 'dns', 'buffer', 'url',
      'querystring', 'zlib', 'cluster', 'child_process'
    ]);

    let unresolvedCount = 0;

    this.discovered.imports.forEach((imports, fromFile) => {
      imports.forEach(importPath => {
        // Skip builtins, node_modules, and relative paths that likely exist
        if (builtins.has(importPath) || importPath.startsWith('node_modules')) return;

        // For relative imports, check if file exists
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          const resolvedPath = path.join(path.dirname(fromFile), importPath);

          // Try multiple extensions
          const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx'];
          let found = false;

          for (const ext of extensions) {
            const fullPath = path.join(this.rootDir, resolvedPath + ext);
            if (fs.existsSync(fullPath)) {
              found = true;
              break;
            }
          }

          if (!found) {
            this.discovered.unresolved.push({
              from: fromFile,
              import: importPath,
              type: 'relative_missing'
            });
            unresolvedCount++;
          }
        }
      });
    });

    console.log(`✅ Found ${unresolvedCount} unresolved imports`);
    this.stats.discoveredIssues += unresolvedCount;
    return this.discovered.unresolved;
  }

  /**
   * PHASE 4: Find orphaned files (no imports, not exported)
   */
  findOrphanedFiles() {
    console.log('📍 PHASE 4: Finding orphaned files...');

    const excludePatterns = [
      'index.js',
      'main.jsx',
      'App.jsx',
      '.test.js',
      '.spec.js',
      'test-setup.js',
      '__tests__',
      'mock'
    ];

    const isExcluded = (file) => {
      return excludePatterns.some(pattern => {
        if (pattern.includes('/')) return file.includes(pattern);
        return path.basename(file).match(new RegExp(pattern));
      });
    };

    let orphanedCount = 0;

    this.discovered.files.forEach(file => {
      if (isExcluded(file)) return;

      // Check if any file imports from this file
      let isImported = false;
      this.discovered.imports.forEach(imports => {
        if (imports.some(imp => {
          const normalized = imp.replace(/^\.\//, '').replace(/\/$/, '');
          return file.includes(normalized);
        })) {
          isImported = true;
        }
      });

      if (!isImported) {
        this.discovered.orphaned.push({
          file,
          type: 'potentially_unused'
        });
        orphanedCount++;
      }
    });

    console.log(`✅ Found ${orphanedCount} potentially orphaned files`);
    this.stats.discoveredIssues += orphanedCount;
    return this.discovered.orphaned;
  }

  /**
   * PHASE 5: Detect circular dependencies
   */
  detectCircularDependencies() {
    console.log('📍 PHASE 5: Detecting circular dependencies...');

    const visited = new Set();
    const recStack = new Set();
    let circularCount = 0;

    const dfs = (node, path = []) => {
      if (recStack.has(node)) {
        this.discovered.circular.push({
          cycle: [...path, node],
          severity: 'high'
        });
        circularCount++;
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recStack.add(node);

      const imports = this.discovered.imports.get(node) || [];
      imports.forEach(imp => {
        const normalized = imp.replace(/^\.\//, '');
        const depFile = Array.from(this.discovered.files).find(f =>
          f.includes(normalized)
        );
        if (depFile) {
          dfs(depFile, [...path, node]);
        }
      });

      recStack.delete(node);
    };

    this.discovered.files.forEach(file => {
      if (!visited.has(file)) {
        dfs(file);
      }
    });

    console.log(`✅ Found ${circularCount} circular dependency chains`);
    this.stats.discoveredIssues += circularCount;
    return this.discovered.circular;
  }

  /**
   * PHASE 6: Find missing route wiring
   */
  findMissingRouteWiring() {
    console.log('📍 PHASE 6: Finding missing route wiring...');

    try {
      const indexPath = path.join(this.rootDir, 'backend/src/index.js');
      if (!fs.existsSync(indexPath)) {
        console.warn('  ⚠️ index.js not found');
        return [];
      }

      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const routePattern = /use\(['"`]([^'"`]+)['"`],\s*(\w+)\)/g;

      const wiredRoutes = new Set();
      let match;
      while ((match = routePattern.exec(indexContent)) !== null) {
        wiredRoutes.add(match[2]);
      }

      // Find all route files
      const routeFiles = glob.sync('backend/src/routes/*.js', { cwd: this.rootDir });

      let missingCount = 0;
      const missing = routeFiles.map(file => {
        const name = path.basename(file, '.js');
        const varName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

        if (!wiredRoutes.has(varName)) {
          missingCount++;
          return {
            file,
            name,
            varName,
            type: 'route_not_wired'
          };
        }
        return null;
      }).filter(Boolean);

      this.discovered.missing.push(...missing);
      console.log(`✅ Found ${missingCount} unwired routes`);
      this.stats.discoveredIssues += missingCount;
      return missing;
    } catch (e) {
      console.error(`  ❌ Error finding route wiring: ${e.message}`);
      return [];
    }
  }

  /**
   * PHASE 7: Find missing service integrations
   */
  findMissingServiceIntegrations() {
    console.log('📍 PHASE 7: Finding missing service integrations...');

    try {
      const servicesDir = path.join(this.rootDir, 'backend/src/services');
      const serviceFiles = fs.readdirSync(servicesDir)
        .filter(f => f.endsWith('.js') && f !== 'index.js')
        .map(f => f.replace('.js', ''));

      const indexPath = path.join(servicesDir, 'index.js');
      let indexContent = '';

      if (fs.existsSync(indexPath)) {
        indexContent = fs.readFileSync(indexPath, 'utf8');
      }

      let missingCount = 0;
      const missing = serviceFiles.map(service => {
        if (!indexContent.includes(service) && !indexContent.includes(`require('./${service}`)) {
          missingCount++;
          return {
            file: `backend/src/services/${service}.js`,
            service,
            type: 'service_not_exported'
          };
        }
        return null;
      }).filter(Boolean);

      this.discovered.missing.push(...missing);
      console.log(`✅ Found ${missingCount} unintegrated services`);
      this.stats.discoveredIssues += missingCount;
      return missing;
    } catch (e) {
      console.error(`  ❌ Error finding service integrations: ${e.message}`);
      return [];
    }
  }

  /**
   * PHASE 8: Find missing frontend route wiring
   */
  findMissingFrontendRouting() {
    console.log('📍 PHASE 8: Finding missing frontend route wiring...');

    try {
      const pagesDir = path.join(this.rootDir, 'frontend/src/pages');
      if (!fs.existsSync(pagesDir)) {
        console.warn('  ⚠️ Pages directory not found');
        return [];
      }

      const pageFiles = glob.sync('**/*.jsx', { cwd: pagesDir })
        .map(f => path.basename(f, '.jsx'));

      const routesPath = path.join(this.rootDir, 'frontend/src/config/routes.js');
      let routesContent = '';

      if (fs.existsSync(routesPath)) {
        routesContent = fs.readFileSync(routesPath, 'utf8');
      }

      let missingCount = 0;
      const missing = pageFiles.map(page => {
        const patterns = [
          new RegExp(`component:\\s*${page}`, 'i'),
          new RegExp(`import.*${page}`, 'i'),
          new RegExp(`['"\`]${page}['"\`]`, 'i')
        ];

        if (!patterns.some(p => p.test(routesContent))) {
          missingCount++;
          return {
            file: `frontend/src/pages/${page}.jsx`,
            page,
            type: 'page_not_routed'
          };
        }
        return null;
      }).filter(Boolean);

      this.discovered.missing.push(...missing);
      console.log(`✅ Found ${missingCount} unrouted pages`);
      this.stats.discoveredIssues += missingCount;
      return missing;
    } catch (e) {
      console.error(`  ❌ Error finding frontend routing: ${e.message}`);
      return [];
    }
  }

  /**
   * Generate comprehensive discovery report
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 LINKAGE DISCOVERY REPORT');
    console.log('='.repeat(70));

    console.log('\n📈 STATISTICS');
    console.log(`  Total Files Discovered: ${this.stats.totalFiles}`);
    console.log(`  Linkage Candidates: ${this.stats.linkageCandidates}`);
    console.log(`  Issues Found: ${this.stats.discoveredIssues}`);

    console.log('\n🔴 CRITICAL ISSUES');
    console.log(`  Unresolved Imports: ${this.discovered.unresolved.length}`);
    this.discovered.unresolved.slice(0, 5).forEach(issue => {
      console.log(`    ❌ ${issue.from} → ${issue.import}`);
    });
    if (this.discovered.unresolved.length > 5) {
      console.log(`    ... and ${this.discovered.unresolved.length - 5} more`);
    }

    console.log(`\n  Circular Dependencies: ${this.discovered.circular.length}`);
    this.discovered.circular.slice(0, 3).forEach(issue => {
      console.log(`    🔁 ${issue.cycle.join(' → ')}`);
    });

    console.log(`\n  Missing Integrations: ${this.discovered.missing.length}`);
    const byType = {};
    this.discovered.missing.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
    });
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`    • ${type}: ${count}`);
    });

    console.log(`\n  Orphaned Files: ${this.discovered.orphaned.length}`);
    console.log(`    (Review needed - may be legitimate exports)`);

    return this.discovered;
  }

  /**
   * Run complete discovery pipeline
   */
  async runCompleteDiscovery() {
    console.log('🚀 Starting complete linkage discovery...\n');

    this.discoverAllFiles();
    this.mapDependencies();
    this.findUnresolvedImports();
    this.findOrphanedFiles();
    this.detectCircularDependencies();
    this.findMissingRouteWiring();
    this.findMissingServiceIntegrations();
    this.findMissingFrontendRouting();

    this.generateReport();

    // Save detailed report
    const reportPath = path.join(this.rootDir, '.ai/linkage-discovery-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.discovered, null, 2));
    console.log(`\n💾 Detailed report saved to: .ai/linkage-discovery-report.json`);

    return this.discovered;
  }
}

// Main execution
if (require.main === module) {
  const engine = new LinkageDiscoveryEngine(process.cwd());
  engine.runCompleteDiscovery()
    .then(() => {
      console.log('\n✅ Discovery complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Discovery failed:', err);
      process.exit(1);
    });
}

module.exports = LinkageDiscoveryEngine;
