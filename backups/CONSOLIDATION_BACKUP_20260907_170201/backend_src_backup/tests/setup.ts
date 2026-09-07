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

// Mock database connections
jest.mock('../database/postgres');
jest.mock('../database/mongodb');
jest.mock('../database/redis');

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
