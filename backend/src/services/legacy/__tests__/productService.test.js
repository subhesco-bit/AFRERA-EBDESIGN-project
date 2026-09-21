'use strict';

// Two real bugs fixed here, both surfaced only once this router was
// actually mounted (2026-09-15, thirteenth follow-up in the TODO backlog):
// (1) 6 of 8 exported functions lacked the "if (!pg) throw new Error(
// 'Database connection not available')" guard getProducts()/getProductById()
// already had, producing a raw, confusing TypeError instead when the
// database is down. (2) GET /search (a single path segment) was registered
// after GET /:id, so Express's registration-order route matching had
// /:id (id='search') shadowing it completely - searchProducts() was real
// and correct but unreachable through the live API. Both fixed; these
// tests lock in the honest DB-down behavior and the route ordering.

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockQuery = jest.fn();
jest.mock('../../../database/connection', () => ({
  getPostgreSQL: jest.fn(),
}));

const { getPostgreSQL } = require('../../../database/connection');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getStates,
  searchProducts,
} = require('../productService');

describe('productService - honest error when the database is unavailable', () => {
  beforeEach(() => {
    getPostgreSQL.mockReturnValue(null);
  });

  test('createProduct() reports it instead of a raw TypeError', async () => {
    await expect(createProduct({ name: 'Rice' })).rejects.toThrow('Database connection not available');
  });

  test('updateProduct() reports it instead of a raw TypeError', async () => {
    await expect(updateProduct('p1', { name: 'Rice' })).rejects.toThrow('Database connection not available');
  });

  test('deleteProduct() reports it instead of a raw TypeError', async () => {
    await expect(deleteProduct('p1')).rejects.toThrow('Database connection not available');
  });

  test('getCategories() reports it instead of a raw TypeError', async () => {
    await expect(getCategories()).rejects.toThrow('Database connection not available');
  });

  test('getStates() reports it instead of a raw TypeError', async () => {
    await expect(getStates()).rejects.toThrow('Database connection not available');
  });

  test('searchProducts() reports it instead of a raw TypeError', async () => {
    await expect(searchProducts('rice')).rejects.toThrow('Database connection not available');
  });
});

describe('productService route ordering (GET /search vs GET /:id)', () => {
  test('GET /search is registered before GET /:id, so it is reachable', () => {
    const { router } = require('../productService');
    const paths = router.stack
      .filter((layer) => layer.route)
      .map((layer) => layer.route.path);

    const searchIndex = paths.indexOf('/search');
    const idIndex = paths.indexOf('/:id');

    expect(searchIndex).toBeGreaterThanOrEqual(0);
    expect(idIndex).toBeGreaterThanOrEqual(0);
    expect(searchIndex).toBeLessThan(idIndex);
  });
});
