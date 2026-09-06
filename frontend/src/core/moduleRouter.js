/**
 * Module Router
 * Automatically discovers, loads, and routes all frontend modules
 * Transfers 450+ module files into active routing system
 */

import fs from 'fs';
import path from 'path';

class ModuleRouter {
  constructor() {
    this.modules = new Map();
    this.routes = [];
    this.failedModules = [];
    this.transferStatus = {
      discovered: 0,
      transferred: 0,
      routed: 0,
      failed: 0,
      reasons: []
    };
  }

  /**
   * Discover all modules in frontend/src/modules/ directory
   */
  discoverModules() {
    try {
      const modulesDir = 'src/modules';

      if (!fs.existsSync(modulesDir)) {
        this.transferStatus.reasons.push(`Modules directory not found: ${modulesDir}`);
        return [];
      }

      const dirs = fs.readdirSync(modulesDir)
        .filter(name => {
          const fullPath = path.join(modulesDir, name);
          return fs.statSync(fullPath).isDirectory() && /^M\d+$/.test(name);
        });

      this.transferStatus.discovered = dirs.length;
      console.log(`[ModuleRouter] Discovered ${dirs.length} modules`);

      return dirs;
    } catch (error) {
      this.transferStatus.reasons.push(`Module discovery failed: ${error.message}`);
      console.error('[ModuleRouter] Discovery error:', error);
      return [];
    }
  }

  /**
   * Transfer a single module
   */
  transferModule(moduleName) {
    try {
      const moduleDir = `src/modules/${moduleName}`;
      const indexPath = path.join(moduleDir, 'index.jsx');
      const modulePath = path.join(moduleDir, `${moduleName}.jsx`);

      // Check if module file exists
      let moduleFile = null;
      if (fs.existsSync(indexPath)) {
        moduleFile = indexPath;
      } else if (fs.existsSync(modulePath)) {
        moduleFile = modulePath;
      } else {
        this.failedModules.push({
          module: moduleName,
          reason: 'No component file found (index.jsx or module.jsx)',
          path: moduleDir
        });
        this.transferStatus.failed++;
        this.transferStatus.reasons.push(`${moduleName}: Missing component file`);
        return null;
      }

      // Transfer: Register module
      this.modules.set(moduleName, {
        name: moduleName,
        path: moduleDir,
        componentPath: moduleFile,
        status: 'transferred',
        timestamp: new Date()
      });

      this.transferStatus.transferred++;

      // Route: Create lazy-loaded route
      const route = {
        path: `/modules/${moduleName.toLowerCase()}`,
        lazy: async () => {
          try {
            const mod = await import(moduleFile);
            return { Component: mod.default || mod };
          } catch (err) {
            console.error(`Failed to load module ${moduleName}:`, err);
            return { Component: () => <div>Error loading {moduleName}</div> };
          }
        },
        moduleName,
        status: 'routed'
      };

      this.routes.push(route);
      this.transferStatus.routed++;

      console.log(`[ModuleRouter] ✅ Transferred & Routed: ${moduleName}`);
      return route;
    } catch (error) {
      this.failedModules.push({
        module: moduleName,
        reason: error.message,
        path: `src/modules/${moduleName}`
      });
      this.transferStatus.failed++;
      this.transferStatus.reasons.push(`${moduleName}: ${error.message}`);
      console.error(`[ModuleRouter] ❌ Failed to transfer ${moduleName}:`, error.message);
      return null;
    }
  }

  /**
   * Initialize all modules and generate routes
   */
  initializeModules() {
    const modules = this.discoverModules();

    for (const moduleName of modules) {
      this.transferModule(moduleName);
    }

    console.log(`\n[ModuleRouter] Transfer & Route Summary:`);
    console.log(`  Discovered: ${this.transferStatus.discovered}`);
    console.log(`  Transferred: ${this.transferStatus.transferred}`);
    console.log(`  Routed: ${this.transferStatus.routed}`);
    console.log(`  Failed: ${this.transferStatus.failed}`);
    console.log(`  Transfer Rate: ${Math.round((this.transferStatus.transferred / this.transferStatus.discovered) * 100)}%`);

    return this.transferStatus;
  }

  /**
   * Get transfer and routing report
   */
  getTransferReport() {
    return {
      summary: this.transferStatus,
      transferred: Array.from(this.modules.keys()),
      routed: this.routes.length,
      failed: this.failedModules,
      routes: this.routes
    };
  }

  /**
   * Get routes for React Router
   */
  getRoutes() {
    return this.routes;
  }

  /**
   * Get a specific module
   */
  getModule(moduleName) {
    return this.modules.get(moduleName);
  }
}

export default ModuleRouter;
