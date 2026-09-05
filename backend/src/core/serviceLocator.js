// EBDESIGN Service Locator
// Central access point for all services
// Enables services to call each other without manual imports
// Scales to 200K+ services with lazy loading

const { logger } = require('../utils/logger');

class ServiceLocator {
  constructor(serviceLoader) {
    this.serviceLoader = serviceLoader;
    this.cache = new Map(); // Fast access cache
    this.accessLog = []; // Track service access patterns
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      avgLoadTime: 0,
      uniqueServices: new Set()
    };
  }

  /**
   * Get a service by name
   * Automatically loads if not already loaded
   * Usage: const userService = await serviceLocator.get('UserService');
   */
  async get(serviceName) {
    try {
      // Check memory cache first
      if (this.cache.has(serviceName)) {
        this.stats.hits++;
        return this.cache.get(serviceName);
      }

      // Load from service loader
      const service = await this.serviceLoader.loadService(serviceName);
      this.stats.misses++;
      this.stats.uniqueServices.add(serviceName);

      // Cache for next access
      this.cache.set(serviceName, service);

      // Log access pattern
      this._logAccess(serviceName);

      return service;
    } catch (error) {
      this.stats.errors++;
      logger.error(`Failed to get service: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * Get service or throw user-friendly error
   */
  async getOrThrow(serviceName) {
    const service = await this.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' could not be loaded`);
    }
    return service;
  }

  /**
   * Get multiple services in parallel
   * Usage: const [users, auth] = await serviceLocator.getMultiple('UserService', 'AuthService');
   */
  async getMultiple(...serviceNames) {
    return Promise.all(
      serviceNames.map(name => this.get(name))
    );
  }

  /**
   * Get service by partial name (fuzzy lookup)
   * Usage: serviceLocator.find('user') → UserService
   */
  async find(partialName) {
    const serviceName = this.serviceLoader.findService(partialName);
    if (!serviceName) {
      throw new Error(`Service matching '${partialName}' not found`);
    }
    return this.get(serviceName);
  }

  /**
   * Check if service exists without loading
   */
  has(serviceName) {
    return this.serviceLoader.services.has(serviceName);
  }

  /**
   * Get all services in a category
   */
  async getCategory(category) {
    const serviceNames = this.serviceLoader.getServicesInCategory(category);
    return this.getMultiple(...serviceNames);
  }

  /**
   * Get all services in a subfolder
   */
  async getSubfolder(subfolder) {
    const serviceNames = this.serviceLoader.getServicesInSubfolder(subfolder);
    return this.getMultiple(...serviceNames);
  }

  /**
   * Get service without loading (metadata only)
   */
  getMetadata(serviceName) {
    return this.serviceLoader.getMetadata(serviceName);
  }

  /**
   * List all available services
   */
  listAvailable(options = {}) {
    return this.serviceLoader.listServices(options);
  }

  /**
   * Preload multiple services
   * Useful for initialization: preload(['AuthService', 'DatabaseService', 'CacheService'])
   */
  async preload(serviceNames) {
    const startTime = Date.now();
    const loaded = [];
    const failed = [];

    for (const name of serviceNames) {
      try {
        await this.get(name);
        loaded.push(name);
      } catch (error) {
        failed.push({ name, error: error.message });
      }
    }

    const elapsed = Date.now() - startTime;

    logger.info(`Preloaded services`, {
      loaded: loaded.length,
      failed: failed.length,
      elapsed: `${elapsed}ms`
    });

    return { loaded, failed, elapsed };
  }

  /**
   * Access service by interface/protocol
   * Useful for dependency injection patterns
   * Usage: const cacheService = serviceLocator.getByInterface('CacheInterface');
   */
  async getByInterface(interfaceName) {
    // Try common naming patterns
    const patterns = [
      interfaceName,
      `${interfaceName}Service`,
      `${interfaceName}Impl`,
      interfaceName.replace(/Interface$/, 'Service')
    ];

    for (const pattern of patterns) {
      if (this.serviceLoader.services.has(pattern)) {
        return this.get(pattern);
      }
    }

    throw new Error(`Service implementing '${interfaceName}' not found`);
  }

  /**
   * Invalidate cache for a service (forces reload next access)
   */
  invalidate(serviceName) {
    this.cache.delete(serviceName);
    this.serviceLoader.unloadService(serviceName);
    logger.debug(`Invalidated service cache: ${serviceName}`);
  }

  /**
   * Clear all caches
   */
  clearCache() {
    const count = this.cache.size;
    this.cache.clear();
    logger.info(`Cleared service cache (${count} services)`);
  }

  /**
   * Get access statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cachedServices: this.cache.size,
      discoveredServices: this.serviceLoader.discoveredCount,
      loadedServices: this.serviceLoader.loadedCount,
      uniqueServicesAccessed: this.stats.uniqueServices.size
    };
  }

  /**
   * Get service loader statistics
   */
  getLoaderStats() {
    return this.serviceLoader.getStats();
  }

  /**
   * Log service access for analytics
   */
  _logAccess(serviceName) {
    this.accessLog.push({
      service: serviceName,
      timestamp: Date.now(),
      cached: this.cache.has(serviceName)
    });

    // Keep last 10K accesses
    if (this.accessLog.length > 10000) {
      this.accessLog = this.accessLog.slice(-10000);
    }
  }

  /**
   * Get access patterns (for optimization)
   */
  getAccessPatterns() {
    const patterns = {};

    for (const access of this.accessLog) {
      patterns[access.service] = (patterns[access.service] || 0) + 1;
    }

    // Sort by frequency
    return Object.entries(patterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50); // Top 50
  }

  /**
   * Health check: verify all loaded services
   */
  async healthCheck() {
    const results = {
      healthy: [],
      unhealthy: []
    };

    for (const [name, service] of this.cache.entries()) {
      if (typeof service.healthCheck === 'function') {
        try {
          await service.healthCheck();
          results.healthy.push(name);
        } catch (error) {
          results.unhealthy.push({ name, error: error.message });
        }
      }
    }

    return results;
  }

  /**
   * Create a context-bound service accessor
   * Useful for dependency injection in request handlers
   */
  createContext() {
    return {
      get: (serviceName) => this.get(serviceName),
      find: (partialName) => this.find(partialName),
      has: (serviceName) => this.has(serviceName),
      getMetadata: (serviceName) => this.getMetadata(serviceName)
    };
  }
}

module.exports = ServiceLocator;
