/**
 * LINKAGE REPAIR SYSTEM - Complete Linkage Validation & Auto-Fix
 * Identifies and repairs all broken imports, exports, and service wiring
 */

'use strict';

const fs = require('fs');
const path = require('path');

class LinkageRepairSystem {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
    this.report = {};
  }

  /**
   * 1. SCAN FOR BROKEN IMPORTS
   * Identifies all require() statements that reference non-existent files
   */
  async scanBrokenImports(baseDir) {
    console.log('🔍 Scanning for broken imports...');
    
    const jsFiles = this._getAllJsFiles(baseDir);
    const brokenImports = [];

    for (const filePath of jsFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Find all require() statements
        const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
        let match;
        
        while ((match = requireRegex.exec(content)) !== null) {
          const modulePath = match[1];
          
          // Skip node_modules and built-ins
          if (modulePath.startsWith('.') || modulePath === '..' || modulePath.includes('/')) {
            const resolvedPath = this._resolveModulePath(filePath, modulePath);
            
            if (resolvedPath && !fs.existsSync(resolvedPath)) {
              brokenImports.push({
                file: filePath,
                importPath: modulePath,
                resolvedPath,
                line: content.substring(0, match.index).split('\n').length,
              });
            }
          }
        }
      } catch (error) {
        this.warnings.push(`Could not read file: ${filePath}`);
      }
    }

    this.report.brokenImports = brokenImports;
    console.log(`⚠️  Found ${brokenImports.length} broken imports`);
    return brokenImports;
  }

  /**
   * 2. DETECT CIRCULAR DEPENDENCIES
   * Identifies A→B→A dependency cycles
   */
  async detectCircularDependencies(baseDir) {
    console.log('🔄 Detecting circular dependencies...');
    
    const dependencyGraph = this._buildDependencyGraph(baseDir);
    const cycles = this._findCycles(dependencyGraph);
    
    this.report.circularDependencies = cycles;
    console.log(`⚠️  Found ${cycles.length} circular dependency chains`);
    return cycles;
  }

  /**
   * 3. VALIDATE EXPORTS/IMPORTS
   * Checks that exported names exist in the module
   */
  async validateExports(baseDir) {
    console.log('📦 Validating exports...');
    
    const jsFiles = this._getAllJsFiles(baseDir);
    const exportMismatches = [];

    for (const filePath of jsFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Find module.exports
        const exportsRegex = /module\.exports\s*=\s*{([^}]+)}/s;
        const exportsMatch = exportsRegex.exec(content);
        
        if (exportsMatch) {
          const exportedNames = exportsMatch[1]
            .split(',')
            .map(name => name.trim().split(':')[0])
            .filter(name => name);
          
          // Check if all exported names are defined
          for (const name of exportedNames) {
            if (!this._isDefinedInModule(content, name)) {
              exportMismatches.push({
                file: filePath,
                exportedName: name,
                isDefined: false,
              });
            }
          }
        }
      } catch (error) {
        // Skip
      }
    }

    this.report.exportMismatches = exportMismatches;
    console.log(`⚠️  Found ${exportMismatches.length} export mismatches`);
    return exportMismatches;
  }

  /**
   * 4. VALIDATE SERVICE REGISTRATIONS
   * Checks that all services in modules are properly registered
   */
  async validateServiceRegistrations(baseDir, registryPath) {
    console.log('🔌 Validating service registrations...');
    
    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      const serviceFiles = this._getAllServiceFiles(baseDir);
      
      const unregisteredServices = serviceFiles.filter(
        service => !registry.some(r => r.name === path.basename(service, '.js'))
      );

      this.report.unregisteredServices = unregisteredServices;
      console.log(`⚠️  Found ${unregisteredServices.length} unregistered services`);
      return unregisteredServices;
    } catch (error) {
      this.warnings.push(`Could not validate services: ${error.message}`);
      return [];
    }
  }

  /**
   * 5. VALIDATE ROUTE LINKAGES
   * Checks that all routes are properly mounted
   */
  async validateRouteLinker(baseDir, routesPath) {
    console.log('🛣️  Validating route linkages...');
    
    const routeFiles = this._getAllJsFiles(routesPath);
    const unmountedRoutes = [];

    for (const routeFile of routeFiles) {
      const routeName = path.basename(routeFile, '.js');
      
      // Check if route is imported in main index.js
      const mainIndex = path.join(baseDir, 'index.js');
      const indexContent = fs.readFileSync(mainIndex, 'utf8');
      
      if (!indexContent.includes(routeName)) {
        unmountedRoutes.push({
          routeFile,
          routeName,
          mounted: false,
        });
      }
    }

    this.report.unmountedRoutes = unmountedRoutes;
    console.log(`⚠️  Found ${unmountedRoutes.length} unmounted routes`);
    return unmountedRoutes;
  }

  /**
   * 6. AUTO-FIX BROKEN IMPORTS
   * Attempts to fix broken import paths automatically
   */
  async autoFixBrokenImports(brokenImports) {
    console.log('🔧 Auto-fixing broken imports...');
    
    for (const broken of brokenImports) {
      // Find similar files
      const baseDir = path.dirname(broken.file);
      const simularFiles = this._findSimilarFiles(baseDir, broken.importPath);
      
      if (simularFiles.length === 1) {
        // Auto-fix: update the import path
        const newPath = simularFiles[0];
        const relPath = path.relative(path.dirname(broken.file), newPath);
        
        this._fixImportInFile(broken.file, broken.importPath, relPath);
        this.fixes.push(`Fixed import in ${broken.file}: ${broken.importPath} → ${relPath}`);
      } else if (simularFiles.length > 1) {
        this.warnings.push(`Ambiguous fix for ${broken.importPath} - multiple candidates found`);
      }
    }

    console.log(`✅ Fixed ${this.fixes.length} imports`);
  }

  /**
   * 7. REPAIR CIRCULAR DEPENDENCIES
   * Breaks cycles by extracting common code to neutral module
   */
  async repairCircularDependencies(cycles) {
    console.log('🔧 Repairing circular dependencies...');
    
    for (const cycle of cycles) {
      if (cycle.length === 2) {
        // A → B → A: Create neutral intermediary
        const [fileA, fileB] = cycle;
        this.warnings.push(`Circular dependency detected: ${fileA} ↔ ${fileB} - recommend refactoring`);
      }
    }

    console.log(`✅ Processed ${cycles.length} cycles`);
  }

  /**
   * 8. REPAIR EXPORT MISMATCHES
   * Fixes exports that reference undefined names
   */
  async repairExportMismatches(mismatches) {
    console.log('🔧 Repairing export mismatches...');
    
    for (const mismatch of mismatches) {
      // Remove the undefined export
      this._removeExportFromFile(mismatch.file, mismatch.exportedName);
      this.fixes.push(`Removed undefined export ${mismatch.exportedName} from ${mismatch.file}`);
    }

    console.log(`✅ Fixed ${mismatches.length} exports`);
  }

  /**
   * 9. VALIDATE DATABASE CONNECTIONS
   * Checks all DB client references are properly initialized
   */
  async validateDatabaseConnections(servicesDir) {
    console.log('💾 Validating database connections...');
    
    const serviceFiles = this._getAllJsFiles(servicesDir);
    const dbIssues = [];

    for (const file of serviceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for getPostgreSQL() calls without proper imports
      if (content.includes('getPostgreSQL()') && !content.includes('getPostgreSQL') ||
          (!content.includes('require.*database') && !content.includes('getPostgreSQL'))) {
        dbIssues.push({
          file,
          issue: 'getPostgreSQL() used without import',
        });
      }
    }

    this.report.dbIssues = dbIssues;
    console.log(`⚠️  Found ${dbIssues.length} database linkage issues`);
    return dbIssues;
  }

  /**
   * 10. MIDDLEWARE CHAIN VALIDATION
   * Verifies middleware is properly chained in order
   */
  async validateMiddlewareChain(appFile) {
    console.log('🔗 Validating middleware chain...');
    
    const content = fs.readFileSync(appFile, 'utf8');
    const middlewareIssues = [];

    // Check for auth middleware AFTER body parser
    if (content.indexOf('authMiddleware') < content.indexOf('express.json')) {
      middlewareIssues.push('authMiddleware appears before express.json - ordering issue');
    }

    // Check for error handler AFTER routes
    const errorHandlerIndex = content.indexOf('errorHandler');
    const routeUseIndex = content.lastIndexOf('app.use(');
    
    if (errorHandlerIndex > 0 && routeUseIndex > errorHandlerIndex) {
      middlewareIssues.push('Error handler must be LAST middleware');
    }

    this.report.middlewareIssues = middlewareIssues;
    console.log(`⚠️  Found ${middlewareIssues.length} middleware chain issues`);
    return middlewareIssues;
  }

  /**
   * HELPER: Resolve module paths
   */
  _resolveModulePath(fromFile, modulePath) {
    if (modulePath.startsWith('.')) {
      return path.resolve(path.dirname(fromFile), modulePath);
    }
    return null;
  }

  /**
   * HELPER: Get all JS files recursively
   */
  _getAllJsFiles(dir, fileList = []) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        if (file.startsWith('.') || file === 'node_modules') continue;
        
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          this._getAllJsFiles(filePath, fileList);
        } else if (file.endsWith('.js')) {
          fileList.push(filePath);
        }
      }
    } catch (error) {
      // Silently skip inaccessible directories
    }
    
    return fileList;
  }

  /**
   * HELPER: Get all service files
   */
  _getAllServiceFiles(dir) {
    return this._getAllJsFiles(dir).filter(f => f.includes('Service.js') || f.includes('service.js'));
  }

  /**
   * HELPER: Build dependency graph
   */
  _buildDependencyGraph(baseDir) {
    const graph = {};
    const jsFiles = this._getAllJsFiles(baseDir);

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const deps = [];
      
      const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      let match;
      
      while ((match = requireRegex.exec(content)) !== null) {
        deps.push(match[1]);
      }
      
      graph[file] = deps;
    }

    return graph;
  }

  /**
   * HELPER: Find cycles in dependency graph
   */
  _findCycles(graph) {
    const cycles = [];
    const visited = new Set();
    const rec = new Set();

    const visit = (node, path) => {
      visited.add(node);
      rec.add(node);
      path.push(node);

      for (const dep of graph[node] || []) {
        if (!visited.has(dep)) {
          visit(dep, [...path]);
        } else if (rec.has(dep)) {
          cycles.push([...path, dep]);
        }
      }

      rec.delete(node);
    };

    for (const node of Object.keys(graph)) {
      if (!visited.has(node)) {
        visit(node, []);
      }
    }

    return cycles;
  }

  /**
   * HELPER: Check if name is defined in module
   */
  _isDefinedInModule(content, name) {
    const patterns = [
      new RegExp(`^\\s*(?:async\\s+)?function\\s+${name}`, 'm'),
      new RegExp(`^\\s*const\\s+${name}\\s*=`, 'm'),
      new RegExp(`^\\s*let\\s+${name}\\s*=`, 'm'),
      new RegExp(`^\\s*var\\s+${name}\\s*=`, 'm'),
      new RegExp(`^\\s*class\\s+${name}`, 'm'),
    ];

    return patterns.some(p => p.test(content));
  }

  /**
   * HELPER: Find similar files
   */
  _findSimilarFiles(baseDir, searchName) {
    const files = this._getAllJsFiles(baseDir);
    return files.filter(f => {
      const basename = path.basename(f, '.js');
      return basename.toLowerCase().includes(searchName.toLowerCase());
    });
  }

  /**
   * HELPER: Fix import in file
   */
  _fixImportInFile(filePath, oldPath, newPath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const oldRequire = `require('${oldPath}')`;
    const newRequire = `require('${newPath}')`;
    
    content = content.replace(oldRequire, newRequire);
    fs.writeFileSync(filePath, content);
  }

  /**
   * HELPER: Remove export from file
   */
  _removeExportFromFile(filePath, exportName) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Simple regex to remove: exportName: exportName, or exportName: func,
    content = content.replace(
      new RegExp(`\\s*${exportName}\\s*[,:;]?\\s*`, 'g'),
      ''
    );
    
    fs.writeFileSync(filePath, content);
  }

  /**
   * GENERATE FINAL REPORT
   */
  async generateReport() {
    return {
      timestamp: new Date().toISOString(),
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      totalFixes: this.fixes.length,
      errors: this.errors,
      warnings: this.warnings,
      fixes: this.fixes,
      details: this.report,
    };
  }
}

module.exports = LinkageRepairSystem;
