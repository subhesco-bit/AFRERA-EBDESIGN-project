// EBDESIGN Dynamic Service Loader
// Auto-discovers and loads services from directory tree
// Supports 200K+ files with lazy loading and subfolder organization

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class DynamicServiceLoader {
  constructor(db = null) {
    this.services = new Map(); // serviceName → {path, loaded, instance, metadata}
    this.byCategory = new Map(); // category → [services]
    this.bySubfolder = new Map(); // subfolder → [services]
    this.serviceIndex = new Map(); // lowercase name → serviceName (for fuzzy lookup)
    this.db = db;
    this.loadedCount = 0;
    this.discoveredCount = 0;
    this.failedCount = 0;
    this.errors = [];
  }

  /**
   * Auto-discover all services in directory tree
   * Recursively walks through subfolders
   * Registers services without loading (lazy loading)
   * Supports: folder/ServiceName.js, folder/subfolder/ServiceName.js
   */
  async discoverServicesFromDirectory(servicesDir, maxFiles = 200000) {
    try {
      const startTime = Date.now();
      const files = [];

      this._walkDirectory(servicesDir, files);

      if (files.length > maxFiles) {
        logger.warn(
          `Service discovery: Found ${files.length} files (limit: ${maxFiles})`
        );
      }

      for (const filePath of files) {
        if (this._isServiceFile(filePath)) {
          this._registerService(filePath, servicesDir);
        }
      }

      const elapsed = Date.now() - startTime;
      logger.info(`✅ Service Discovery Complete`, {
        discovered: this.discoveredCount,
        failed: this.failedCount,
        elapsed: `${elapsed}ms`,
        categories: this.byCategory.size,
        subfolders: this.bySubfolder.size
      });

      return {
        discovered: this.discoveredCount,
        failed: this.failedCount,
        categories: this.byCategory.size,
        subfolders: this.bySubfolder.size,
        elapsed
      };
    } catch (error) {
      logger.error('Service discovery failed', error);
      throw error;
    }
  }

  /**
   * Register a service (don't load yet)
   * Extract metadata from filename and path
   */
  _registerService(filePath, basePath) {
    try {
      const relativePath = path.relative(basePath, filePath);
      const fileName = path.basename(filePath, '.js');
      const serviceName = fileName; // e.g., "UserService"
      const category = this._extractCategory(relativePath);
      const subfolder = this._extractSubfolder(relativePath);

      // Check if service already registered
      if (this.services.has(serviceName)) {
        logger.warn(`Duplicate service name: ${serviceName}`);
        return;
      }

      // Register service entry
      this.services.set(serviceName, {
        name: serviceName,
        path: filePath,
        relativePath,
        category,
        subfolder,
        loaded: false,
        instance: null,
        loadError: null,
        loadTime: 0,
        callCount: 0,
        avgCallTime: 0
      });

      // Index for fuzzy lookup
      this.serviceIndex.set(serviceName.toLowerCase(), serviceName);

      // Group by category
      if (!this.byCategory.has(category)) {
        this.byCategory.set(category, []);
      }
      this.byCategory.get(category).push(serviceName);

      // Group by subfolder
      if (!this.bySubfolder.has(subfolder)) {
        this.bySubfolder.set(subfolder, []);
      }
      this.bySubfolder.get(subfolder).push(serviceName);

      this.discoveredCount++;
    } catch (error) {
      logger.error(`Failed to register service: ${filePath}`, error);
      this.failedCount++;
      this.errors.push({
        file: filePath,
        error: error.message
      });
    }
  }

  /**
   * Load service on-demand (lazy loading)
   * Returns cached instance if already loaded
   */
  async loadService(serviceName) {
    const entry = this.services.get(serviceName);

    if (!entry) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    // Return cached instance
    if (entry.loaded) {
      entry.callCount++;
      return entry.instance;
    }

    try {
      const startTime = Date.now();

      const ServiceClass = require(entry.path);
      const exported = ServiceClass.default || ServiceClass;

      if (exported && typeof exported === 'object' && typeof exported !== 'function') {
        entry.instance = exported;
      } else if (typeof exported === 'function') {
        try {
          entry.instance = exported.prototype && exported.prototype.constructor === exported
            ? new exported(this.db)
            : exported;
        } catch (_error) {
          entry.instance = exported;
        }
      } else {
        entry.instance = exported;
      }

      entry.loaded = true;
      entry.loadTime = Date.now() - startTime;
      entry.callCount = 1;

      logger.debug(`Loaded service: ${serviceName} (${entry.loadTime}ms)`);
      this.loadedCount++;

      return entry.instance;
    } catch (error) {
      entry.loadError = error.message;
      logger.error(`Failed to load service: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * Load multiple services in parallel
   */
  async loadMultiple(...serviceNames) {
    return Promise.all(
      serviceNames.map(name => this.loadService(name))
    );
  }

  /**
   * Load all services in a category
   */
  async loadCategory(category) {
    const services = this.byCategory.get(category) || [];
    logger.info(`Loading ${services.length} services from category: ${category}`);
    return this.loadMultiple(...services);
  }

  /**
   * Load all services in a subfolder
   */
  async loadSubfolder(subfolder) {
    const services = this.bySubfolder.get(subfolder) || [];
    logger.info(`Loading ${services.length} services from subfolder: ${subfolder}`);
    return this.loadMultiple(...services);
  }

  /**
   * Load only critical services at startup (fast boot)
   * Others load on-demand
   */
  async loadCriticalServices(criticalList = []) {
    if (criticalList.length === 0) {
      // Default critical services for EBDESIGN
      criticalList = [
        'AuthService',
        'UserService',
        'DatabaseService',
        'CacheService',
        'ErrorHandlerService',
        'MonitoringService'
      ];
    }

    const startTime = Date.now();
    const loaded = [];
    const failed = [];

    for (const serviceName of criticalList) {
      try {
        await this.loadService(serviceName);
        loaded.push(serviceName);
      } catch (error) {
        failed.push({ name: serviceName, error: error.message });
      }
    }

    const elapsed = Date.now() - startTime;
    logger.info(`Critical services loaded`, {
      loaded: loaded.length,
      failed: failed.length,
      elapsed: `${elapsed}ms`
    });

    return { loaded, failed, elapsed };
  }

  /**
   * Fuzzy lookup service by partial name
   * Usage: loader.findService('user') → 'UserService'
   */
  findService(partialName) {
    const lower = partialName.toLowerCase();

    // Exact match
    if (this.serviceIndex.has(lower)) {
      return this.serviceIndex.get(lower);
    }

    // Partial match
    for (const [key, name] of this.serviceIndex.entries()) {
      if (key.includes(lower)) {
        return name;
      }
    }

    return null;
  }

  /**
   * Get service metadata without loading
   */
  getMetadata(serviceName) {
    const entry = this.services.get(serviceName);
    if (!entry) return null;

    return {
      name: entry.name,
      category: entry.category,
      subfolder: entry.subfolder,
      loaded: entry.loaded,
      loadTime: entry.loadTime,
      callCount: entry.callCount,
      avgCallTime: entry.avgCallTime,
      error: entry.loadError
    };
  }

  /**
   * Get all services in category
   */
  getServicesInCategory(category) {
    return this.byCategory.get(category) || [];
  }

  /**
   * Get all services in subfolder
   */
  getServicesInSubfolder(subfolder) {
    return this.bySubfolder.get(subfolder) || [];
  }

  /**
   * Get statistics
   */
  getStats() {
    const loadedServices = Array.from(this.services.values()).filter(s => s.loaded);
    const avgLoadTime = loadedServices.length > 0
      ? loadedServices.reduce((sum, s) => sum + s.loadTime, 0) / loadedServices.length
      : 0;

    return {
      discovered: this.discoveredCount,
      loaded: this.loadedCount,
      failed: this.failedCount,
      pending: this.discoveredCount - this.loadedCount,
      categories: this.byCategory.size,
      subfolders: this.bySubfolder.size,
      avgLoadTime: avgLoadTime.toFixed(2),
      totalServices: this.services.size,
      errors: this.errors.slice(0, 10) // Last 10 errors
    };
  }

  /**
   * List all discovered services
   */
  listServices(options = {}) {
    const {
      category = null,
      subfolder = null,
      loaded = null,
      limit = 100,
      offset = 0
    } = options;

    let services = Array.from(this.services.values());

    // Filter by category
    if (category) {
      services = services.filter(s => s.category === category);
    }

    // Filter by subfolder
    if (subfolder) {
      services = services.filter(s => s.subfolder === subfolder);
    }

    // Filter by loaded status
    if (loaded !== null) {
      services = services.filter(s => s.loaded === loaded);
    }

    // Paginate
    return {
      total: services.length,
      items: services.slice(offset, offset + limit),
      hasMore: offset + limit < services.length
    };
  }

  /**
   * Unload a service (free memory)
   */
  unloadService(serviceName) {
    const entry = this.services.get(serviceName);
    if (entry && entry.loaded) {
      entry.instance = null;
      entry.loaded = false;
      this.loadedCount--;
      logger.info(`Unloaded service: ${serviceName}`);
    }
  }

  /**
   * Walk directory tree recursively
   * Handles deeply nested folder structures
   */
  _walkDirectory(dir, results = [], depth = 0, maxDepth = 50) {
    if (depth > maxDepth) {
      logger.warn(`Max directory depth (${maxDepth}) exceeded`);
      return results;
    }

    try {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        // Skip common non-service directories
        if (
          entry.startsWith('.') ||
          entry === 'node_modules' ||
          entry === '__pycache__' ||
          entry === 'dist' ||
          entry === 'build'
        ) {
          continue;
        }

        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Recurse into subdirectory
          this._walkDirectory(fullPath, results, depth + 1, maxDepth);
        } else if (entry.endsWith('.js') && !entry.endsWith('.test.js')) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      logger.warn(`Error reading directory ${dir}: ${error.message}`);
    }

    return results;
  }

  /**
   * Extract category from path
   * services/marketplace/UserService.js → marketplace
   * services/UserService.js → default
   */
  _extractCategory(relativePath) {
    const parts = relativePath.split(path.sep);

    // If nested in subfolder, first folder is category
    if (parts.length > 1) {
      return parts[0];
    }

    return 'default';
  }

  /**
   * Extract full subfolder path
   * services/marketplace/users/UserService.js → marketplace/users
   * services/UserService.js → root
   */
  _extractSubfolder(relativePath) {
    const dir = path.dirname(relativePath);
    return dir === '.' ? 'root' : dir;
  }

  /**
   * Mount HTTP hooks for services that export setupRoutes(app).
   */
  async mountServiceRoutes(app) {
    let mounted = 0;
    let withSetupRoutes = 0;
    let totalServices = this.services.size;
    
    logger.info(`🔍 Starting service route mounting for ${totalServices} discovered services...`);
    
    for (const [serviceName, entry] of this.services.entries()) {
      let source = '';
      try {
        source = fs.readFileSync(entry.path, 'utf8');
      } catch (error) {
        logger.warn(`Could not read service file: ${serviceName}`, { error: error.message });
        continue;
      }
      
      if (!source.includes('setupRoutes')) {
        continue;
      }
      
      withSetupRoutes++;
      
      try {
        const instance = await this.loadService(serviceName);
        const fn = instance?.setupRoutes || instance?.default?.setupRoutes;
        if (typeof fn === 'function') {
          fn.call(instance, app);
          mounted++;
          logger.info(`✅ Mounted service routes: ${serviceName}`);
        } else {
          logger.warn(`Service has setupRoutes in source but function not accessible: ${serviceName}`);
        }
      } catch (error) {
        logger.warn(`❌ Could not mount setupRoutes for ${serviceName}`, { error: error.message });
      }
    }
    
    logger.info(`📊 Service route mounting complete: ${mounted}/${withSetupRoutes} mounted, ${withSetupRoutes}/${totalServices} had setupRoutes`);
    return { mounted, withSetupRoutes, totalServices };
  }

  _isServiceFile(filePath) {
    if (!filePath.endsWith('.js') || filePath.includes('.test.') || filePath.includes(`${path.sep}__tests__${path.sep}`)) {
      return false;
    }
    const base = path.basename(filePath);
    if (/Routes\.js$/i.test(base)) return false;
    if (base.endsWith('Service.js') || /service\.js$/i.test(base)) return true;
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      return /setupRoutes\s*[:(]/.test(text);
    } catch {
      return false;
    }
  }

  /**
   * Clear cache and reload
   */
  async reload() {
    this.loadedCount = 0;
    const services = Array.from(this.services.values());

    for (const service of services) {
      service.loaded = false;
      service.instance = null;
      service.loadError = null;
    }

    logger.info(`Service loader cache cleared. Ready for reload.`);
  }
}

module.exports = DynamicServiceLoader;
