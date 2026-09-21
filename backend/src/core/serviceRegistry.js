/**
 * Service Registry & Lifecycle Management
 * Central orchestration for all backend services
 * Manages initialization, health checks, dependencies
 */

const logger = require('../utils/logger');

class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.initialized = new Map();
    this.dependencies = new Map();
    this.startTime = null;
  }

  /**
   * Register a service with optional dependencies
   */
  register(name, service, dependencies = []) {
    this.services.set(name, service);
    this.dependencies.set(name, dependencies);
    logger.debug(`Service registered: ${name}`);
  }

  /**
   * Initialize all services in dependency order
   */
  async initializeAll() {
    this.startTime = Date.now();
    const serviceNames = Array.from(this.services.keys());
    const initialized = [];
    const failed = [];

    logger.info(`Initializing ${serviceNames.length} services...`);

    // Simple dependency resolution: try init, mark failures, retry failed
    for (const name of serviceNames) {
      try {
        await this._initializeService(name);
        initialized.push(name);
      } catch (error) {
        failed.push({ name, error: error.message });
        logger.warn(`Failed to initialize ${name}: ${error.message}`);
      }
    }

    const duration = Date.now() - this.startTime;
    logger.info(`Service initialization complete in ${duration}ms`);
    logger.info(`${initialized.length}/${serviceNames.length} initialized`);

    if (failed.length > 0) {
      logger.warn(`${failed.length} services failed to initialize`);
      failed.forEach(f => logger.warn(`  - ${f.name}: ${f.error}`));
    }

    return {
      total: serviceNames.length,
      initialized: initialized.length,
      failed: failed.length,
      duration,
      details: {
        initialized,
        failed
      }
    };
  }

  /**
   * Initialize a single service
   */
  async _initializeService(name) {
    const service = this.services.get(name);

    if (!service) {
      throw new Error(`Service not found: ${name}`);
    }

    // Check if already initialized
    if (this.initialized.get(name)) {
      return;
    }

    // Initialize dependencies first
    const deps = this.dependencies.get(name) || [];
    for (const depName of deps) {
      if (!this.initialized.get(depName)) {
        await this._initializeService(depName);
      }
    }

    // Call service initialize if it exists
    if (service.initialize && typeof service.initialize === 'function') {
      await service.initialize();
    }

    this.initialized.set(name, true);
    logger.debug(`Service initialized: ${name}`);
  }

  /**
   * Get overall status
   */
  getStatus() {
    const initialized = Array.from(this.initialized.values()).filter(v => v).length;
    const total = this.services.size;

    return {
      total,
      initialized,
      failed: total - initialized,
      uptime: this.startTime ? Date.now() - this.startTime : null,
      healthy: total > 0 && initialized === total
    };
  }

  /**
   * Get detailed service status
   */
  getDetailedStatus() {
    const details = [];

    for (const [name, service] of this.services) {
      const status = {
        name,
        initialized: this.initialized.get(name) || false,
        dependencies: this.dependencies.get(name) || [],
        hasHealthCheck: !!service.getHealth,
        hasInitialize: !!service.initialize
      };

      if (service.getHealth && typeof service.getHealth === 'function') {
        try {
          status.health = service.getHealth();
        } catch (e) {
          status.health = { status: 'error', error: e.message };
        }
      }

      details.push(status);
    }

    return details;
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown() {
    logger.info('Shutting down services...');
    const services = Array.from(this.services.entries()).reverse(); // Reverse order

    for (const [name, service] of services) {
      if (service.shutdown && typeof service.shutdown === 'function') {
        try {
          await service.shutdown();
          logger.debug(`Service shutdown: ${name}`);
        } catch (error) {
          logger.error(`Error shutting down ${name}: ${error.message}`);
        }
      }
    }

    this.initialized.clear();
    logger.info('All services shut down');
  }

  /**
   * Wait for all services to be healthy
   */
  async waitForHealthy(timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = this.getStatus();

      if (status.healthy) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Services did not become healthy within ${timeout}ms`);
  }
}

module.exports = new ServiceRegistry();
