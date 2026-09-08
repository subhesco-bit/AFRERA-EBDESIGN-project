'use strict';

const { assertProductionConfiguration } = require('../config/productionConfig');

describe('production configuration validation', () => {
  test('allows non-production environments without production secrets', () => {
    expect(() => assertProductionConfiguration({ NODE_ENV: 'test' })).not.toThrow();
  });

  test('rejects placeholder and missing production settings', () => {
    expect(() => assertProductionConfiguration({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://db/app',
      JWT_SECRET: 'your-super-secret-key-change-in-production',
      ENCRYPTION_KEY: 'short'
    })).toThrow(/Invalid production configuration/);
  });

  test('accepts a complete production configuration', () => {
    expect(() => assertProductionConfiguration({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://db/app',
      JWT_SECRET: 'j'.repeat(32),
      ENCRYPTION_KEY: 'e'.repeat(32),
      FRONTEND_URL: 'https://app.example.com',
      PORT: '3001'
    })).not.toThrow();
  });
});
