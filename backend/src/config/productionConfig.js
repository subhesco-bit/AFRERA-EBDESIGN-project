'use strict';

const PLACEHOLDER_VALUES = new Set([
  'changeme',
  'your_jwt_secret_key_here_min_32_characters',
  'your_encryption_key_here_32_characters',
  'your-super-secret-key-change-in-production'
]);

function isPlaceholder(value) {
  return !value || PLACEHOLDER_VALUES.has(value) || value.includes('change-in-production');
}

function assertProductionConfiguration(env = process.env) {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  const errors = [];
  const required = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];

  for (const name of required) {
    if (isPlaceholder(env[name])) {
      errors.push(`${name} must be set to a non-placeholder secret/value`);
    }
  }

  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }

  if (env.ENCRYPTION_KEY && env.ENCRYPTION_KEY.length < 32) {
    errors.push('ENCRYPTION_KEY must be at least 32 characters');
  }

  if (!env.ALLOWED_ORIGINS && !env.FRONTEND_URL) {
    errors.push('ALLOWED_ORIGINS or FRONTEND_URL must be configured');
  }

  const port = Number(env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('PORT must be an integer between 1 and 65535');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production configuration:\n- ${errors.join('\n- ')}`);
  }
}

module.exports = { assertProductionConfiguration };
