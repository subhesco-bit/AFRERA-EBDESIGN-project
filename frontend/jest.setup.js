// Jest setup file for frontend
require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
globalThis.__VITE_ENV__ = {
  env: {
    MODE: 'test',
    DEV: false,
    PROD: true,
    VITE_API_BASE_URL: 'http://localhost:3001'
  }
};
window.PushManager = function PushManager() {};

// Mock API calls
jest.mock('./src/services/api', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  },
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn()
  },
  productsAPI: {
    getProducts: jest.fn(),
    getProduct: jest.fn()
  },
  analyticsAPI: {
    getPlatformStats: jest.fn(),
    getInsights: jest.fn()
  }
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
};

afterAll(() => {
  require('./src/utils/errorMonitoring').errorMonitoring.destroy();
});
