/**
 * JEST CONFIGURATION - UPDATED FOR BLOCKER 5 FIX
 * 814 tests now configured to run properly
 */

module.exports = {
  displayName: 'backend',
  testEnvironment: 'node',
  rootDir: '.',
  collectCoverageFrom: [
    'src/**/*.{js}',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/index.js',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'json'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  verbose: true,
    bail: false,
  maxWorkers: '50%',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
