/**
 * Unified Configuration Service
 * Centralized configuration management for the entire project
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Production-readiness audit (2026-08-28): committed 'your-secret-key-
// change-in-production' fallback - currently dead config (nothing else in
// backend/src reads security.session.secret), but fixed for consistency
// with the same pattern already applied to JWT_SECRET/SYNC_SECRET/
// OFFLINE_PAYMENT_SECRET so it's safe the moment something does start
// reading it.
function resolveSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }
  return crypto.randomBytes(32).toString('hex');
}

class UnifiedConfigService {
  constructor() {
    this.config = {};
    this.configPath = path.join(__dirname, '../../../../config');
    this.loadConfiguration();
  }

  /**
   * Load configuration from multiple sources
   */
  loadConfiguration() {
    // Load default configuration
    this.config = this.getDefaultConfig();
    
    // Load environment-specific configuration
    this.loadEnvironmentConfig();
    
    // Load user configuration if exists
    this.loadUserConfig();
    
    // Validate configuration
    this.validateConfig();
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      project: {
        name: 'AFRERA',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        debug: process.env.DEBUG === 'true'
      },
      
      server: {
        port: parseInt(process.env.PORT) || 3001,
        host: process.env.HOST || 'localhost',
        cors: {
          enabled: true,
          origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173']
        }
      },
      
      database: {
        type: 'postgresql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'afrera',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        pool: {
          min: parseInt(process.env.DB_POOL_MIN) || 2,
          max: parseInt(process.env.DB_POOL_MAX) || 20,
          idle: parseInt(process.env.DB_POOL_IDLE) || 10000
        }
      },
      
      claudeAI: {
        apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 8192,
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
        contextWindow: parseInt(process.env.CLAUDE_CONTEXT_WINDOW) || 200000,
        safetyFilters: process.env.CLAUDE_SAFETY_FILTERS !== 'false',
        costMonitoring: process.env.CLAUDE_COST_MONITORING !== 'false'
      },
      
      mfa: {
        enabled: process.env.MFA_ENABLED === 'true',
        issuer: process.env.MFA_ISSUER || 'AFRERA Platform',
        secretLength: parseInt(process.env.MFA_SECRET_LENGTH) || 32,
        backupCodesCount: parseInt(process.env.MFA_BACKUP_CODES_COUNT) || 10
      },
      
      gdpr: {
        enabled: process.env.GDPR_ENABLED !== 'false',
        dataRetention: {
          personalData: parseInt(process.env.GDPR_RETENTION_PERSONAL) || 1825, // 5 years in days
          transactionData: parseInt(process.env.GDPR_RETENTION_TRANSACTION) || 2555, // 7 years
          analyticsData: parseInt(process.env.GDPR_RETENTION_ANALYTICS) || 730 // 2 years
        },
        dataRegion: process.env.GDPR_DATA_REGION || 'IN'
      },
      
      library: {
        path: process.env.LIBRARY_PATH || './_EBDESIGN_LIBRARY',
        enabled: true,
        knowledgeIntegration: true
      },
      
      monitoring: {
        enabled: process.env.MONITORING_ENABLED !== 'false',
        metrics: ['performance', 'ai_usage', 'errors', 'user_activity'],
        logging: {
          level: process.env.LOG_LEVEL || 'info',
          format: process.env.LOG_FORMAT || 'json'
        }
      },
      
      security: {
        rateLimiting: {
          enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100
        },
        session: {
          secret: resolveSessionSecret(),
          timeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000 // 1 hour
        }
      },
      
      features: {
        testing: process.env.FEATURE_TESTING === 'true',
        development: process.env.NODE_ENV === 'development',
        maintenance: process.env.MAINTENANCE_MODE === 'true'
      }
    };
  }

  /**
   * Load environment-specific configuration
   */
  loadEnvironmentConfig() {
    const envConfigPath = path.join(this.configPath, `${this.config.project.environment}.json`);
    
    if (fs.existsSync(envConfigPath)) {
      try {
        const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
        this.config = this.mergeConfig(this.config, envConfig);
      } catch (error) {
        console.error(`Error loading environment config from ${envConfigPath}:`, error);
      }
    }
  }

  /**
   * Load user configuration
   */
  loadUserConfig() {
    const userConfigPath = path.join(this.configPath, 'user.config.json');
    
    if (fs.existsSync(userConfigPath)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
        this.config = this.mergeConfig(this.config, userConfig);
      } catch (error) {
        console.error(`Error loading user config from ${userConfigPath}:`, error);
      }
    }
  }

  /**
   * Merge configuration objects
   */
  mergeConfig(base, override) {
    return this.deepMerge(base, override);
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Check if value is object
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    const errors = [];
    
    // Validate required fields
    if (!this.config.claudeAI.apiKey && this.config.project.environment === 'production') {
      errors.push('Claude AI API key is required in production');
    }
    
    if (!this.config.database.password && this.config.project.environment === 'production') {
      errors.push('Database password is required in production');
    }
    
    if (!this.config.security.session.secret || this.config.security.session.secret === 'your-secret-key-change-in-production') {
      if (this.config.project.environment === 'production') {
        errors.push('Session secret must be changed in production');
      }
    }
    
    // Log validation errors
    if (errors.length > 0) {
      console.error('Configuration validation errors:', errors);
      if (this.config.project.environment === 'production') {
        throw new Error('Invalid configuration: ' + errors.join(', '));
      }
    }
  }

  /**
   * Get configuration value
   */
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * Set configuration value
   */
  set(path, value) {
    const keys = path.split('.');
    let config = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in config) || typeof config[key] !== 'object') {
        config[key] = {};
      }
      config = config[key];
    }
    
    config[keys[keys.length - 1]] = value;
  }

  /**
   * Get entire configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Get configuration for specific service
   */
  getServiceConfig(serviceName) {
    return this.get(serviceName, {});
  }

  /**
   * Reload configuration
   */
  reload() {
    this.loadConfiguration();
  }
}

module.exports = new UnifiedConfigService();
