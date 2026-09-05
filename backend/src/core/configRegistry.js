// EBDESIGN Configuration Registry
// Database-driven configuration for 200K+ services
// Enables dynamic enable/disable without redeployment
// Supports feature flags, version routing, tenant-specific config

const { logger } = require('../utils/logger');

class ConfigRegistry {
  constructor(db) {
    this.db = db;
    this.cache = new Map(); // serviceName → config
    this.featureFlags = new Map(); // featureName → {enabled, config}
    this.versionRouting = new Map(); // serviceName → version
    this.tenantOverrides = new Map(); // tenantId:serviceName → config
    this.lastSyncTime = null;
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.isInitialized = false;
  }

  /**
   * Initialize database tables if they don't exist
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create service_configs table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS service_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service_name VARCHAR(255) NOT NULL UNIQUE,
          category VARCHAR(100),
          subfolder VARCHAR(255),
          enabled BOOLEAN DEFAULT true,
          priority INT DEFAULT 100,
          version VARCHAR(50),
          dependencies TEXT[],
          config JSONB DEFAULT '{}',
          feature_flags JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT service_name_unique UNIQUE(service_name)
        );
      `);

      // Create index
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_service_configs_enabled
        ON service_configs(enabled);
      `);

      // Create feature_flags table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS feature_flags (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          feature_name VARCHAR(255) NOT NULL UNIQUE,
          enabled BOOLEAN DEFAULT false,
          description TEXT,
          config JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT feature_unique UNIQUE(feature_name)
        );
      `);

      // Create version_routing table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS version_routing (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service_name VARCHAR(255) NOT NULL,
          version VARCHAR(50) NOT NULL,
          percentage INT DEFAULT 100,
          enabled BOOLEAN DEFAULT true,
          config JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT version_routing_unique UNIQUE(service_name, version)
        );
      `);

      // Create tenant_config_overrides table
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS tenant_config_overrides (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          service_name VARCHAR(255) NOT NULL,
          config JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT tenant_override_unique UNIQUE(tenant_id, service_name)
        );
      `);

      logger.info('Configuration tables initialized');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize configuration tables', error);
      throw error;
    }
  }

  /**
   * Load service configuration from database
   */
  async getServiceConfig(serviceName) {
    // Check memory cache first
    if (this.cache.has(serviceName)) {
      return this.cache.get(serviceName);
    }

    try {
      const result = await this.db.query(
        'SELECT * FROM service_configs WHERE service_name = $1',
        [serviceName]
      );

      if (result.rows[0]) {
        const config = result.rows[0];
        this.cache.set(serviceName, config);
        return config;
      }

      // Create default config if doesn't exist
      return this._createDefaultConfig(serviceName);
    } catch (error) {
      logger.error(`Failed to get config for service: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * Get config for multiple services
   */
  async getMultipleConfigs(...serviceNames) {
    return Promise.all(
      serviceNames.map(name => this.getServiceConfig(name))
    );
  }

  /**
   * Create default configuration for a service
   */
  async _createDefaultConfig(serviceName, metadata = {}) {
    try {
      const result = await this.db.query(
        `INSERT INTO service_configs
         (service_name, category, enabled, config, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (service_name) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [
          serviceName,
          metadata.category || 'default',
          true,
          JSON.stringify(metadata.config || {}),
          JSON.stringify(metadata)
        ]
      );

      const config = result.rows[0];
      this.cache.set(serviceName, config);
      return config;
    } catch (error) {
      logger.error(`Failed to create default config: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * Update service configuration
   */
  async updateServiceConfig(serviceName, updates) {
    try {
      const result = await this.db.query(
        `UPDATE service_configs
         SET config = jsonb_set(config, '{}', $2),
             updated_at = NOW()
         WHERE service_name = $1
         RETURNING *`,
        [serviceName, JSON.stringify(updates)]
      );

      if (result.rows[0]) {
        this.cache.set(serviceName, result.rows[0]);
        logger.info(`Updated config for service: ${serviceName}`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to update config: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * Enable/disable a service
   */
  async setServiceEnabled(serviceName, enabled) {
    try {
      const result = await this.db.query(
        `UPDATE service_configs
         SET enabled = $2, updated_at = NOW()
         WHERE service_name = $1
         RETURNING *`,
        [serviceName, enabled]
      );

      if (result.rows[0]) {
        this.cache.set(serviceName, result.rows[0]);
        logger.info(`Service ${serviceName} ${enabled ? 'enabled' : 'disabled'}`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to set service enabled: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * Check if service is enabled
   */
  async isServiceEnabled(serviceName) {
    const config = await this.getServiceConfig(serviceName);
    return config?.enabled ?? true;
  }

  /**
   * Load all service configurations
   * Syncs database to memory cache
   */
  async loadAllConfigs() {
    try {
      const result = await this.db.query(
        'SELECT * FROM service_configs ORDER BY priority DESC'
      );

      for (const config of result.rows) {
        this.cache.set(config.service_name, config);
      }

      this.lastSyncTime = Date.now();
      logger.info(`Loaded ${result.rows.length} service configs from database`);

      return result.rows.length;
    } catch (error) {
      logger.error('Failed to load all configs', error);
      throw error;
    }
  }

  /**
   * Get feature flag
   */
  async getFeatureFlag(featureName) {
    if (this.featureFlags.has(featureName)) {
      return this.featureFlags.get(featureName);
    }

    try {
      const result = await this.db.query(
        'SELECT * FROM feature_flags WHERE feature_name = $1',
        [featureName]
      );

      if (result.rows[0]) {
        const flag = result.rows[0];
        this.featureFlags.set(featureName, flag);
        return flag;
      }

      return null;
    } catch (error) {
      logger.error(`Failed to get feature flag: ${featureName}`, error);
      return null;
    }
  }

  /**
   * Check if feature is enabled
   */
  async isFeatureEnabled(featureName) {
    const flag = await this.getFeatureFlag(featureName);
    return flag?.enabled ?? false;
  }

  /**
   * Enable/disable feature flag
   */
  async setFeatureFlag(featureName, enabled, config = {}) {
    try {
      const result = await this.db.query(
        `INSERT INTO feature_flags (feature_name, enabled, config)
         VALUES ($1, $2, $3)
         ON CONFLICT (feature_name)
         DO UPDATE SET enabled = $2, config = $3, updated_at = NOW()
         RETURNING *`,
        [featureName, enabled, JSON.stringify(config)]
      );

      if (result.rows[0]) {
        this.featureFlags.set(featureName, result.rows[0]);
        logger.info(`Feature flag '${featureName}' ${enabled ? 'enabled' : 'disabled'}`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to set feature flag: ${featureName}`, error);
      throw error;
    }
  }

  /**
   * Load all feature flags
   */
  async loadAllFeatureFlags() {
    try {
      const result = await this.db.query('SELECT * FROM feature_flags');

      for (const flag of result.rows) {
        this.featureFlags.set(flag.feature_name, flag);
      }

      logger.info(`Loaded ${result.rows.length} feature flags`);
      return result.rows.length;
    } catch (error) {
      logger.error('Failed to load feature flags', error);
      throw error;
    }
  }

  /**
   * Get version routing for a service
   */
  async getVersionRouting(serviceName) {
    try {
      const result = await this.db.query(
        `SELECT * FROM version_routing
         WHERE service_name = $1 AND enabled = true
         ORDER BY percentage DESC`,
        [serviceName]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Failed to get version routing: ${serviceName}`, error);
      return [];
    }
  }

  /**
   * Set version routing (for gradual rollout)
   */
  async setVersionRouting(serviceName, version, percentage, config = {}) {
    try {
      const result = await this.db.query(
        `INSERT INTO version_routing (service_name, version, percentage, config)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (service_name, version)
         DO UPDATE SET percentage = $3, config = $4, updated_at = NOW()
         RETURNING *`,
        [serviceName, version, percentage, JSON.stringify(config)]
      );

      logger.info(
        `Version routing set: ${serviceName} v${version} ${percentage}%`
      );

      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to set version routing: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * Get tenant-specific config override
   */
  async getTenantConfigOverride(tenantId, serviceName) {
    const key = `${tenantId}:${serviceName}`;

    if (this.tenantOverrides.has(key)) {
      return this.tenantOverrides.get(key);
    }

    try {
      const result = await this.db.query(
        `SELECT * FROM tenant_config_overrides
         WHERE tenant_id = $1 AND service_name = $2`,
        [tenantId, serviceName]
      );

      if (result.rows[0]) {
        this.tenantOverrides.set(key, result.rows[0]);
        return result.rows[0];
      }

      return null;
    } catch (error) {
      logger.error(
        `Failed to get tenant override: ${tenantId}/${serviceName}`,
        error
      );
      return null;
    }
  }

  /**
   * Set tenant-specific config override
   */
  async setTenantConfigOverride(tenantId, serviceName, config) {
    try {
      const result = await this.db.query(
        `INSERT INTO tenant_config_overrides (tenant_id, service_name, config)
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id, service_name)
         DO UPDATE SET config = $3, updated_at = NOW()
         RETURNING *`,
        [tenantId, serviceName, JSON.stringify(config)]
      );

      const key = `${tenantId}:${serviceName}`;
      this.tenantOverrides.set(key, result.rows[0]);

      logger.info(`Tenant override set: ${tenantId}/${serviceName}`);
      return result.rows[0];
    } catch (error) {
      logger.error(
        `Failed to set tenant override: ${tenantId}/${serviceName}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get effective config (merge base + tenant override)
   */
  async getEffectiveConfig(serviceName, tenantId = null) {
    const baseConfig = await this.getServiceConfig(serviceName);

    if (!tenantId) {
      return baseConfig;
    }

    const override = await this.getTenantConfigOverride(tenantId, serviceName);

    if (!override) {
      return baseConfig;
    }

    // Deep merge base and override
    return {
      ...baseConfig,
      config: {
        ...baseConfig.config,
        ...override.config
      }
    };
  }

  /**
   * Auto-sync from database at regular intervals
   */
  startAutoSync(intervalMs = this.syncInterval) {
    this.syncInterval = intervalMs;

    setInterval(async () => {
      try {
        await this.loadAllConfigs();
        await this.loadAllFeatureFlags();
      } catch (error) {
        logger.error('Auto-sync failed', error);
      }
    }, intervalMs);

    logger.info(`Config auto-sync started (${intervalMs}ms interval)`);
  }

  /**
   * Get all disabled services
   */
  async getDisabledServices() {
    try {
      const result = await this.db.query(
        'SELECT service_name FROM service_configs WHERE enabled = false'
      );

      return result.rows.map(r => r.service_name);
    } catch (error) {
      logger.error('Failed to get disabled services', error);
      return [];
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      cachedConfigs: this.cache.size,
      featureFlags: this.featureFlags.size,
      tenantOverrides: this.tenantOverrides.size,
      lastSyncTime: this.lastSyncTime
        ? new Date(this.lastSyncTime).toISOString()
        : 'never',
      isInitialized: this.isInitialized
    };
  }

  /**
   * Clear cache and reload
   */
  async reload() {
    this.cache.clear();
    this.featureFlags.clear();
    this.tenantOverrides.clear();

    await this.loadAllConfigs();
    await this.loadAllFeatureFlags();

    logger.info('Configuration registry reloaded');
  }
}

module.exports = ConfigRegistry;
