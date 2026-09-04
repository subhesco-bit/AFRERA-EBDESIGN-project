/**
 * Enterprise-Grade Environment Configuration
 *
 * Production-ready configuration management with:
 * - Environment-specific settings
 * - Type-safe configuration access
 * - Validation of required environment variables
 * - Feature flags support
 * - Runtime configuration updates
 * - Secure configuration handling
 */

/**
 * Environment types
 */
const Environment = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
};

/**
 * Get current environment
 */
function getCurrentEnvironment() {
  return import.meta.env.MODE || Environment.DEVELOPMENT;
}

/**
 * Configuration schema with validation
 */
const configSchema = {
  // API Configuration
  API_URL: {
    required: true,
    default: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/v1`,
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
  },
  API_TIMEOUT: {
    required: false,
    default: 30000,
    validate: (value) => Number.isInteger(value) && value > 0,
  },

  // Authentication Configuration
  TOKEN_REFRESH_THRESHOLD: {
    required: false,
    default: 300000, // 5 minutes
    validate: (value) => Number.isInteger(value) && value > 0,
  },

  // Feature Flags
  ENABLE_ANALYTICS: {
    required: false,
    default: false,
    validate: (value) => typeof value === 'boolean',
  },
  ENABLE_ERROR_REPORTING: {
    required: false,
    default: false,
    validate: (value) => typeof value === 'boolean',
  },
  ENABLE_PERFORMANCE_MONITORING: {
    required: false,
    default: false,
    validate: (value) => typeof value === 'boolean',
  },
  ENABLE_PWA: {
    required: false,
    default: true,
    validate: (value) => typeof value === 'boolean',
  },

  // UI Configuration
  DEFAULT_LANGUAGE: {
    required: false,
    default: 'en',
    validate: (value) => typeof value === 'string' && value.length === 2,
  },
  THEME: {
    required: false,
    default: 'light',
    validate: (value) => ['light', 'dark', 'system'].includes(value),
  },

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    default: 100,
    validate: (value) => Number.isInteger(value) && value > 0,
  },
  RATE_LIMIT_WINDOW_MS: {
    required: false,
    default: 60000,
    validate: (value) => Number.isInteger(value) && value > 0,
  },

  // Cache Configuration
  CACHE_ENABLED: {
    required: false,
    default: true,
    validate: (value) => typeof value === 'boolean',
  },
  CACHE_TTL_MS: {
    required: false,
    default: 300000, // 5 minutes
    validate: (value) => Number.isInteger(value) && value > 0,
  },

  // Monitoring Configuration
  SENTRY_DSN: {
    required: false,
    default: '',
    validate: (value) => typeof value === 'string',
  },
  SENTRY_ENVIRONMENT: {
    required: false,
    default: getCurrentEnvironment(),
    validate: (value) => typeof value === 'string',
  },

  // Analytics Configuration
  ANALYTICS_ID: {
    required: false,
    default: '',
    validate: (value) => typeof value === 'string',
  },

  // External Services
  MAPS_API_KEY: {
    required: false,
    default: '',
    validate: (value) => typeof value === 'string',
  },
  PAYMENT_GATEWAY_KEY: {
    required: false,
    default: '',
    validate: (value) => typeof value === 'string',
  },
};

/**
 * Get configuration value with validation
 */
function getConfigValue(key) {
  const schema = configSchema[key];
  if (!schema) {

    return null;
  }

  // Try to get from environment variables
  const envValue = import.meta.env[`VITE_${key}`];

  // Use default if not provided
  const value = envValue !== undefined ? envValue : schema.default;

  // Type conversion
  let convertedValue;
  if (typeof schema.default === 'boolean') {
    convertedValue = value === 'true' || value === true;
  } else if (typeof schema.default === 'number') {
    convertedValue = Number(value);
  } else {
    convertedValue = value;
  }

  // Validation
  if (schema.validate && !schema.validate(convertedValue)) {

    return schema.default;
  }

  // Check required
  if (schema.required && (convertedValue === undefined || convertedValue === null || convertedValue === '')) {

    if (getCurrentEnvironment() === Environment.PRODUCTION) {
      throw new Error(`Required configuration key ${key} is missing`);
    }
  }

  return convertedValue;
}

/**
 * Get all configuration
 */
function getAllConfig() {
  const config = {};

  for (const key of Object.keys(configSchema)) {
    config[key] = getConfigValue(key);
  }

  return {
    ...config,
    ENVIRONMENT: getCurrentEnvironment(),
    IS_DEVELOPMENT: getCurrentEnvironment() === Environment.DEVELOPMENT,
    IS_STAGING: getCurrentEnvironment() === Environment.STAGING,
    IS_PRODUCTION: getCurrentEnvironment() === Environment.PRODUCTION,
    IS_TEST: getCurrentEnvironment() === Environment.TEST,
  };
}

/**
 * Validate all required configuration
 */
function validateConfig() {
  const errors = [];

  for (const [key, schema] of Object.entries(configSchema)) {
    if (schema.required) {
      const value = getConfigValue(key);
      if (!value || value === schema.default) {
        errors.push(key);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Feature flags helper
 */
const features = {
  isEnabled(featureKey) {
    const key = `ENABLE_${featureKey.toUpperCase()}`;
    return getConfigValue(key);
  },

  analytics() {
    return this.isEnabled('analytics');
  },

  errorReporting() {
    return this.isEnabled('error_reporting');
  },

  performanceMonitoring() {
    return this.isEnabled('performance_monitoring');
  },

  pwa() {
    return this.isEnabled('pwa');
  },
};

/**
 * Public API
 */
const config = {
  Environment,
  getCurrentEnvironment,
  getConfigValue,
  getAllConfig,
  validateConfig,
  features,
  API_URL: getConfigValue('API_URL'),
  API_TIMEOUT: getConfigValue('API_TIMEOUT'),
  TOKEN_REFRESH_THRESHOLD: getConfigValue('TOKEN_REFRESH_THRESHOLD'),
  DEFAULT_LANGUAGE: getConfigValue('DEFAULT_LANGUAGE'),
  THEME: getConfigValue('THEME'),
  RATE_LIMIT_MAX_REQUESTS: getConfigValue('RATE_LIMIT_MAX_REQUESTS'),
  RATE_LIMIT_WINDOW_MS: getConfigValue('RATE_LIMIT_WINDOW_MS'),
  CACHE_ENABLED: getConfigValue('CACHE_ENABLED'),
  CACHE_TTL_MS: getConfigValue('CACHE_TTL_MS'),
  SENTRY_DSN: getConfigValue('SENTRY_DSN'),
  SENTRY_ENVIRONMENT: getConfigValue('SENTRY_ENVIRONMENT'),
  ANALYTICS_ID: getConfigValue('ANALYTICS_ID'),
  MAPS_API_KEY: getConfigValue('MAPS_API_KEY'),
  PAYMENT_GATEWAY_KEY: getConfigValue('PAYMENT_GATEWAY_KEY'),
};

// Export individual config values for convenience
export const API_URL = getConfigValue('API_URL');
export const API_TIMEOUT = getConfigValue('API_TIMEOUT');
export const TOKEN_REFRESH_THRESHOLD = getConfigValue('TOKEN_REFRESH_THRESHOLD');
export const DEFAULT_LANGUAGE = getConfigValue('DEFAULT_LANGUAGE');
export const THEME = getConfigValue('THEME');
export const RATE_LIMIT_MAX_REQUESTS = getConfigValue('RATE_LIMIT_MAX_REQUESTS');
export const RATE_LIMIT_WINDOW_MS = getConfigValue('RATE_LIMIT_WINDOW_MS');
export const CACHE_ENABLED = getConfigValue('CACHE_ENABLED');
export const CACHE_TTL_MS = getConfigValue('CACHE_TTL_MS');
export const SENTRY_DSN = getConfigValue('SENTRY_DSN');
export const SENTRY_ENVIRONMENT = getConfigValue('SENTRY_ENVIRONMENT');
export const ANALYTICS_ID = getConfigValue('ANALYTICS_ID');
export const MAPS_API_KEY = getConfigValue('MAPS_API_KEY');
export const PAYMENT_GATEWAY_KEY = getConfigValue('PAYMENT_GATEWAY_KEY');

export default config;
