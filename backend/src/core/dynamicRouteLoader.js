// EBDESIGN Dynamic Route Loader
// Auto-discovers and mounts routes from directory tree
// Supports 200K+ routes with subfolder organization and versioning

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class DynamicRouteLoader {
  constructor(app) {
    this.app = app;
    this.routes = new Map(); // routeName → {path, mounted, router, metadata}
    this.byVersion = new Map(); // version → [routes]
    this.bySubfolder = new Map(); // subfolder → [routes]
    this.mountedPaths = new Set(); // Track mounted express paths
    this.routeIndex = new Map(); // lowercase → routeName
    this.discoveredCount = 0;
    this.mountedCount = 0;
    this.failedCount = 0;
    this.errors = [];
  }

  /**
   * Auto-discover and mount all routes from directory tree
   * Handles subfolder organization and versioning
   * Pattern: /routes/v1/users.js → /api/v1/users
   * Pattern: /routes/marketplace/orders.js → /api/v1/marketplace/orders
   */
  async discoverAndMountRoutes(routesDir, apiVersion = '/api/v1', maxFiles = 200000) {
    try {
      const startTime = Date.now();
      const files = [];

      this._walkDirectory(routesDir, files);

      if (files.length > maxFiles) {
        logger.warn(
          `Route discovery: Found ${files.length} files (limit: ${maxFiles})`
        );
      }

      // First pass: discover all routes
      for (const filePath of files) {
        if (this._isMountableRouteFile(filePath)) {
          this._registerRoute(filePath, routesDir);
        }
      }

      // Second pass: mount routes in dependency order
      for (const [routeName, entry] of this.routes.entries()) {
        if (!entry.mounted) {
          try {
            await this._mountRoute(routeName, apiVersion);
          } catch (error) {
            logger.warn(`Skipping unavailable route: ${routeName}`, {
              error: error.message
            });
          }
        }
      }

      const elapsed = Date.now() - startTime;

      logger.info(`✅ Route Discovery & Mounting Complete`, {
        discovered: this.discoveredCount,
        mounted: this.mountedCount,
        failed: this.failedCount,
        elapsed: `${elapsed}ms`,
        versions: this.byVersion.size,
        subfolders: this.bySubfolder.size
      });

      return {
        discovered: this.discoveredCount,
        mounted: this.mountedCount,
        failed: this.failedCount,
        elapsed
      };
    } catch (error) {
      logger.error('Route discovery failed', error);
      throw error;
    }
  }

  /**
   * Register a route (don't mount yet)
   */
  _registerRoute(filePath, basePath) {
    try {
      const relativePath = path.relative(basePath, filePath);
      const fileName = path.basename(filePath, '.js');
      const version = this._extractVersion(relativePath);
      const subfolder = this._extractSubfolder(relativePath);
      const routeName = this._extractRouteName(relativePath);

      // Check for duplicate
      if (this.routes.has(routeName)) {
        logger.warn(`Duplicate route name: ${routeName}`);
        return;
      }

      // Register route entry
      this.routes.set(routeName, {
        name: routeName,
        path: filePath,
        relativePath,
        version,
        subfolder,
        mounted: false,
        router: null,
        mountPath: null,
        loadError: null,
        loadTime: 0
      });

      // Index for lookup
      this.routeIndex.set(routeName.toLowerCase(), routeName);

      // Group by version
      if (!this.byVersion.has(version)) {
        this.byVersion.set(version, []);
      }
      this.byVersion.get(version).push(routeName);

      // Group by subfolder
      if (!this.bySubfolder.has(subfolder)) {
        this.bySubfolder.set(subfolder, []);
      }
      this.bySubfolder.get(subfolder).push(routeName);

      this.discoveredCount++;
    } catch (error) {
      logger.error(`Failed to register route: ${filePath}`, error);
      this.failedCount++;
      this.errors.push({
        file: filePath,
        error: error.message
      });
    }
  }

  /**
   * Mount a route to Express app
   * Handles hierarchical path generation
   */
  async _mountRoute(routeName, apiVersion) {
    const entry = this.routes.get(routeName);

    if (!entry) {
      throw new Error(`Route not found: ${routeName}`);
    }

    if (entry.mounted) {
      return; // Already mounted
    }

    try {
      const startTime = Date.now();

      // Load router
      const routeModule = require(entry.path);
      const setup = routeModule.setupRoutes || routeModule.default?.setupRoutes;
      if (typeof setup === 'function' && typeof (routeModule.router || routeModule.default || routeModule) !== 'function') {
        setup(this.app);
        entry.mounted = true;
        entry.mountPath = `(setupRoutes) ${routeName}`;
        entry.loadTime = Date.now() - startTime;
        this.mountedCount++;
        return;
      }

      const router = routeModule.router || routeModule.default || routeModule;

      if (typeof router !== 'function') {
        throw new TypeError('Route module must export an Express router');
      }

      // Generate mount path based on structure
      let mountPath = this._generateMountPath(entry, apiVersion);

      // Check for path conflicts
      if (this.mountedPaths.has(mountPath)) {
        logger.warn(`Path already mounted: ${mountPath}, skipping ${routeName}`);
        return;
      }

      // Mount router to Express app
      this.app.use(mountPath, router);

      entry.router = router;
      entry.mounted = true;
      entry.mountPath = mountPath;
      entry.loadTime = Date.now() - startTime;

      this.mountedPaths.add(mountPath);
      this.mountedCount++;

      logger.debug(`Mounted route: ${mountPath} (${entry.loadTime}ms)`);
    } catch (error) {
      entry.loadError = error.message;
      this.errors.push({
        file: entry.path,
        route: routeName,
        error: error.message
      });
      logger.error(`Failed to mount route: ${routeName}`, error);
      this.failedCount++;
      throw error;
    }
  }

  /**
   * Generate mount path from route metadata
   * Examples:
   * - v1/users.js → /api/v1/users
   * - marketplace/orders.js → /api/v1/marketplace/orders
   * - v2/marketplace/users.js → /api/v2/marketplace/users
   */
  _generateMountPath(entry, apiVersion) {
    const parts = [];

    // Add API version
    if (entry.version !== 'root') {
      parts.push(entry.version);
    }

    // Add subfolder path
    if (entry.subfolder && entry.subfolder !== 'root') {
      const subparts = entry.subfolder.split(path.sep);
      parts.push(...subparts);
    }

    parts.push(this._toMountSegment(entry.name));

    // Build final path
    const relativePath = '/' + parts.join('/');
    return `${apiVersion}${relativePath}`;
  }

  /**
   * Mount only critical routes at startup
   */
  async mountCriticalRoutes(criticalList = [], apiVersion = '/api/v1') {
    if (criticalList.length === 0) {
      criticalList = [
        'auth',
        'users',
        'health',
        'status'
      ];
    }

    const startTime = Date.now();
    const mounted = [];
    const failed = [];

    for (const routeName of criticalList) {
      try {
        await this._mountRoute(routeName, apiVersion);
        mounted.push(routeName);
      } catch (error) {
        failed.push({ name: routeName, error: error.message });
      }
    }

    const elapsed = Date.now() - startTime;

    logger.info(`Critical routes mounted`, {
      mounted: mounted.length,
      failed: failed.length,
      elapsed: `${elapsed}ms`
    });

    return { mounted, failed, elapsed };
  }

  /**
   * Lazy mount route when first accessed
   * Reduces startup time for 200K+ routes
   */
  async mountRouteOnDemand(routeName, apiVersion = '/api/v1') {
    const entry = this.routes.get(routeName);

    if (!entry) {
      throw new Error(`Route not found: ${routeName}`);
    }

    if (entry.mounted) {
      return entry.mountPath;
    }

    await this._mountRoute(routeName, apiVersion);
    return entry.mountPath;
  }

  /**
   * Mount all routes in a version
   */
  async mountVersion(version, apiVersion = '/api/v1') {
    const routes = this.byVersion.get(version) || [];
    logger.info(`Mounting ${routes.length} routes from version: ${version}`);

    const mounted = [];
    const failed = [];

    for (const routeName of routes) {
      try {
        await this._mountRoute(routeName, apiVersion);
        mounted.push(routeName);
      } catch (error) {
        failed.push(routeName);
      }
    }

    return { mounted: mounted.length, failed: failed.length };
  }

  /**
   * Mount all routes in a subfolder
   */
  async mountSubfolder(subfolder, apiVersion = '/api/v1') {
    const routes = this.bySubfolder.get(subfolder) || [];
    logger.info(`Mounting ${routes.length} routes from subfolder: ${subfolder}`);

    const mounted = [];
    const failed = [];

    for (const routeName of routes) {
      try {
        await this._mountRoute(routeName, apiVersion);
        mounted.push(routeName);
      } catch (error) {
        failed.push(routeName);
      }
    }

    return { mounted: mounted.length, failed: failed.length };
  }

  /**
   * Mount Express routers that live under services/ (misplaced *Routes.js).
   */
  async discoverServiceEmbeddedRoutes(servicesDir, apiVersion = '/api/v1') {
    const files = [];
    this._walkDirectory(servicesDir, files);
    for (const filePath of files) {
      if (/Routes\.js$/i.test(filePath) && this._isMountableRouteFile(filePath)) {
        this._registerRoute(filePath, servicesDir);
      }
    }
    for (const [routeName, entry] of this.routes.entries()) {
      if (!entry.mounted) {
        try {
          await this._mountRoute(routeName, apiVersion);
        } catch (error) {
          logger.warn(`Skipping embedded service route: ${routeName}`, { error: error.message });
        }
      }
    }
  }

  /**
   * Get route metadata
   */
  getMetadata(routeName) {
    const entry = this.routes.get(routeName);
    if (!entry) return null;

    return {
      name: entry.name,
      version: entry.version,
      subfolder: entry.subfolder,
      mounted: entry.mounted,
      mountPath: entry.mountPath,
      loadTime: entry.loadTime,
      error: entry.loadError
    };
  }

  /**
   * List all routes with filtering and pagination
   */
  listRoutes(options = {}) {
    const {
      version = null,
      subfolder = null,
      mounted = null,
      limit = 100,
      offset = 0
    } = options;

    let routes = Array.from(this.routes.values());

    if (version) {
      routes = routes.filter(r => r.version === version);
    }

    if (subfolder) {
      routes = routes.filter(r => r.subfolder === subfolder);
    }

    if (mounted !== null) {
      routes = routes.filter(r => r.mounted === mounted);
    }

    return {
      total: routes.length,
      items: routes.slice(offset, offset + limit),
      hasMore: offset + limit < routes.length
    };
  }

  /**
   * Get all mounted routes
   */
  getMountedRoutes() {
    return Array.from(this.routes.values())
      .filter(r => r.mounted)
      .map(r => ({
        name: r.name,
        path: r.mountPath,
        version: r.version
      }));
  }

  /**
   * Get statistics
   */
  getStats() {
    const mountedRoutes = Array.from(this.routes.values()).filter(r => r.mounted);
    const avgLoadTime = mountedRoutes.length > 0
      ? mountedRoutes.reduce((sum, r) => sum + r.loadTime, 0) / mountedRoutes.length
      : 0;

    return {
      discovered: this.discoveredCount,
      mounted: this.mountedCount,
      pending: this.discoveredCount - this.mountedCount,
      failed: this.failedCount,
      versions: this.byVersion.size,
      subfolders: this.bySubfolder.size,
      avgLoadTime: avgLoadTime.toFixed(2),
      uniquePaths: this.mountedPaths.size,
      errors: this.errors.slice(0, 10)
    };
  }

  /**
   * Unmount a route
   */
  unmountRoute(routeName) {
    const entry = this.routes.get(routeName);
    if (entry && entry.mounted) {
      entry.mounted = false;
      entry.router = null;
      this.mountedPaths.delete(entry.mountPath);
      this.mountedCount--;
      logger.info(`Unmounted route: ${routeName}`);
    }
  }

  /**
   * Walk directory tree
   */
  _walkDirectory(dir, results = [], depth = 0, maxDepth = 50) {
    if (depth > maxDepth) {
      logger.warn(`Max directory depth (${maxDepth}) exceeded`);
      return results;
    }

    try {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        if (
          entry.startsWith('.') ||
          entry === 'node_modules' ||
          entry === '__pycache__'
        ) {
          continue;
        }

        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
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
   * Extract version from path
   * v1/users.js → v1
   * routes/users.js → root
   */
  _extractVersion(relativePath) {
    const parts = relativePath.split(path.sep);
    if (parts[0].match(/^v\d+$/)) {
      return parts[0];
    }
    return 'root';
  }

  /**
   * Extract subfolder path
   * v1/marketplace/users.js → marketplace
   * routes/users.js → root
   */
  _extractSubfolder(relativePath) {
    const dir = path.dirname(relativePath);

    if (dir === '.' || dir === '') {
      return 'root';
    }

    // Remove version prefix if present
    let subdir = dir;
    const parts = dir.split(path.sep);
    if (parts[0].match(/^v\d+$/)) {
      subdir = parts.slice(1).join(path.sep);
    }

    return subdir || 'root';
  }

  /**
   * Extract route name from filename
   * users.js → users
   * v1/marketplace/users.js → users
   */
  _extractRouteName(relativePath) {
    return path.basename(relativePath, '.js');
  }

  _isMountableRouteFile(filePath) {
    const base = path.basename(filePath);
    if (!filePath.endsWith('.js') || filePath.includes('.test.') || filePath.includes(`${path.sep}__tests__${path.sep}`)) {
      return false;
    }
    if (base === 'ORPHANED_SERVICES_MOUNT.js') return false;
    if (/Support\.js$/i.test(base)) return false;
    // Additional explicit exclusions
    if (base === 'index.js') return false;
    if (base.startsWith('test.') || base.endsWith('.test.js')) return false;
    // Exclude AI routes that are manually mounted in unifiedAIGateway.js
    if (base.startsWith('ai') && base.includes('Routes.js')) return false;
    // Exclude claude directory routes (manually mounted)
    if (filePath.includes(path.sep + 'claude' + path.sep)) return false;
    return true;
  }

  _toMountSegment(routeName) {
    const aliases = {
      paymentRoutes: 'payments',
      walletRoutes: 'wallet',
      libraryRoutes: 'library',
      farmersRoutes: 'farmers',
      marketplaceRoutes: 'marketplace',
      governmentRoutes: 'government',
      notificationRoutes: 'notifications',
      userRoutes: 'users',
      adminRoutes: 'admin',
      transactionRoutes: 'transactions'
    };
    if (aliases[routeName]) return aliases[routeName];
    const stripped = routeName.replace(/Routes?$/i, '');
    return stripped
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/_/g, '-')
      .toLowerCase();
  }

  /**
   * Clear cache and reload
   */
  async reload() {
    this.mountedCount = 0;
    const routes = Array.from(this.routes.values());

    for (const route of routes) {
      route.mounted = false;
      route.router = null;
      route.loadError = null;
    }

    this.mountedPaths.clear();
    logger.info(`Route loader cache cleared. Ready for reload.`);
  }
}

module.exports = DynamicRouteLoader;
