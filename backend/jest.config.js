module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/services/formService.js',
    'src/services/analyticsService.js',
    'src/services/authService.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^pg$': '<rootDir>/src/test-mocks/pg.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  testTimeout: 30000,
  verbose: true,
  maxWorkers: 1, // Prevents port conflicts by running tests sequentially
  // 18 of 22 test files load the database layer, which opens a pg Pool at
  // require time. Those handles keep the Node event loop alive, so without
  // forceExit the jest process never terminates after the tests finish - in CI
  // that means the job hangs until its wall-clock timeout rather than passing.
  // Run `npx jest --detectOpenHandles` if you want to find and close them
  // properly; forceExit is the pragmatic guard in the meantime.
  forceExit: true
};
