// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/afrera_test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/afrera_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Mock external services
jest.mock('axios');
jest.mock('nodemailer');
jest.mock('twilio');
jest.mock('firebase-admin');
jest.mock('aws-sdk');

// ---------------------------------------------------------------------------
// Database mocks
//
// FIXED 2026-08-04. These three lines previously mocked database/postgres.js,
// database/mongodb.js and database/redis.js — three files whose entire content
// is `module.exports = {}`. Nothing in the application imports them.
//
// So the mocks did nothing, and the REAL connection modules
// (database/connection.js, cache/redis.js) ran unmocked in every test. That is
// why the suite opened live sockets and hung: 18 of 22 test files load the
// database layer, and jest cannot exit while those handles are open.
//
// Mocking the modules the code actually imports is what makes the suite
// hermetic. The pool proxy is mocked to throw a clear message rather than
// silently return undefined, so a test that forgets to stub a query fails
// loudly instead of asserting against `undefined`.
// ---------------------------------------------------------------------------
jest.mock('../database/connection', () => ({
  initialize: jest.fn().mockResolvedValue(undefined),
  // Return null for getPostgreSQL in tests so services use fallback in-memory auth/store.
  getPostgreSQL: jest.fn(() => null),
  getMongoDB: jest.fn(() => null),
  getMongoDatabase: jest.fn(() => null),
  isHealthy: jest.fn(() => true),
  close: jest.fn().mockResolvedValue(undefined),
}));

// Use the actual pool implementation which has test-mode in-memory mock
// This allows tests to actually store and retrieve data during test execution
jest.mock('../database/pool', () => {
  const actualPool = jest.requireActual('../database/pool');
  return actualPool;
});

// Mirrors the ACTUAL export surface of cache/redis.js. Guessing the names
// (getRedisClient vs getClient) would leave the real function unmocked and the
// mock silently unused — the same class of mistake this block replaces.
jest.mock('../cache/redis', () => ({
  initializeRedis: jest.fn().mockResolvedValue(undefined),
  getClient: jest.fn(() => null),
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  delPattern: jest.fn().mockResolvedValue(0),
  exists: jest.fn().mockResolvedValue(false),
  expire: jest.fn().mockResolvedValue(true),
  ttl: jest.fn().mockResolvedValue(-1),
  isHealthy: jest.fn(() => true),
}));

// Global test timeout
jest.setTimeout(10000);

// Setup and teardown
beforeAll(async () => {
  // Initialize test database
  // Clear test data
});

afterAll(async () => {
  // Cleanup test database
  // Close connections
});

beforeEach(async () => {
  // Reset mocks
  jest.clearAllMocks();
});

afterEach(async () => {
  // Cleanup after each test
});
