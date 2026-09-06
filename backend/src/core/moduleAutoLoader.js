/**
 * Module Auto-Loader
 * Automatically discovers, loads, and integrates all backend modules
 * Transfers 335+ module files into active system
 */

const path = require('path');
const fs = require('fs');

class ModuleAutoLoader {
  constructor() {
    this.modules = new Map();
    this.failedModules = [];
    this.transferStatus = {
      discovered: 0,
      transferred: 0,
      failed: 0,
      reasons: []
    };
  }

  /**
   * Discover all modules in modules/ directory
   */
  async discoverModules() {
    const modulesDir = path.join(__dirname, '../modules');

    if (!fs.existsSync(modulesDir)) {
      this.transferStatus.reasons.push(`Modules directory not found: ${modulesDir}`);
      return [];
    }

    try {
      const dirs = fs.readdirSync(modulesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .filter(dirent => /^M\d+$/.test(dirent.name)) // M001, M002, etc.
        .map(dirent => dirent.name);

      this.transferStatus.discovered = dirs.length;
      console.log(`[ModuleAutoLoader] Discovered ${dirs.length} modules`);

      return dirs;
    } catch (error) {
      this.transferStatus.reasons.push(`Module discovery failed: ${error.message}`);
      console.error('[ModuleAutoLoader] Discovery error:', error);
      return [];
    }
  }

  /**
   * Load and transfer a single module
   */
  async transferModule(moduleName) {
    const moduleDir = path.join(__dirname, '../modules', moduleName);
    const indexPath = path.join(moduleDir, 'index.js');

    try {
      // Check if module index exists
      if (!fs.existsSync(indexPath)) {
        this.failedModules.push({
          module: moduleName,
          reason: 'No index.js found',
          path: indexPath
        });
        this.transferStatus.failed++;
        this.transferStatus.reasons.push(`${moduleName}: Missing index.js`);
        return null;
      }

      // Load the module
      delete require.cache[require.resolve(indexPath)];
      const moduleExports = require(indexPath);

      // Transfer: Register in modules map
      this.modules.set(moduleName, {
        name: moduleName,
        path: moduleDir,
        exports: moduleExports,
        status: 'transferred',
        timestamp: new Date()
      });

      this.transferStatus.transferred++;
      console.log(`[ModuleAutoLoader] ✅ Transferred: ${moduleName}`);

      return {
        name: moduleName,
        exports: moduleExports,
        status: 'transferred'
      };
    } catch (error) {
      this.failedModules.push({
        module: moduleName,
        reason: error.message,
        path: moduleDir
      });
      this.transferStatus.failed++;
      this.transferStatus.reasons.push(`${moduleName}: ${error.message}`);
      console.error(`[ModuleAutoLoader] ❌ Failed to transfer ${moduleName}:`, error.message);
      return null;
    }
  }

  /**
   * Initialize all modules
   */
  async initializeModules() {
    const modules = await this.discoverModules();

    for (const moduleName of modules) {
      await this.transferModule(moduleName);
    }

    console.log(`\n[ModuleAutoLoader] Transfer Summary:`);
    console.log(`  Discovered: ${this.transferStatus.discovered}`);
    console.log(`  Transferred: ${this.transferStatus.transferred}`);
    console.log(`  Failed: ${this.transferStatus.failed}`);
    console.log(`  Transfer Rate: ${Math.round((this.transferStatus.transferred / this.transferStatus.discovered) * 100)}%`);

    return this.transferStatus;
  }

  /**
   * Get transfer status and failed modules
   */
  getTransferReport() {
    return {
      summary: this.transferStatus,
      transferred: Array.from(this.modules.keys()),
      failed: this.failedModules,
      totalModules: this.modules.size
    };
  }

  /**
   * Get a specific module
   */
  getModule(moduleName) {
    return this.modules.get(moduleName);
  }

  /**
   * Get all transferred modules
   */
  getAllModules() {
    return Array.from(this.modules.values());
  }
}

module.exports = ModuleAutoLoader;
