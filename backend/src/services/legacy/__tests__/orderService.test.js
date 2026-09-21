'use strict';

// Context: this router used to sit completely disconnected from the live
// app - index.js mounted routes/orderRoutes.js, a 38-line scaffold whose
// POST / just returned {message: 'Route operational'} with no real order
// ever created. index.js now mounts this file's real router instead
// (2026-09-15). These tests cover the fix that made that swap safe:
// getCart() already guarded against a down database with a clean
// "Database connection not available" error, but 10 of the other 11
// exported functions didn't - they'd throw a raw, confusing
// "Cannot read properties of null (reading 'query')" TypeError instead
// once actually reachable. Added the same guard everywhere; these tests
// lock that in, plus one real createOrder path with a mocked DB.

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockQuery = jest.fn();
jest.mock('../../../database/connection', () => ({
  getPostgreSQL: jest.fn(),
}));

const { getPostgreSQL } = require('../../../database/connection');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  processPayment,
} = require('../orderService');

describe('orderService - honest error when the database is unavailable', () => {
  beforeEach(() => {
    getPostgreSQL.mockReturnValue(null);
  });

  test('getCart() reports it plainly (already did before this fix)', async () => {
    await expect(getCart('user-1')).rejects.toThrow('Database connection not available');
  });

  test('addToCart() reports it instead of a raw TypeError', async () => {
    await expect(addToCart('user-1', 'prod-1', 1)).rejects.toThrow('Database connection not available');
  });

  test('updateCartItem() reports it instead of a raw TypeError', async () => {
    await expect(updateCartItem('user-1', 'cart-item-1', 2)).rejects.toThrow('Database connection not available');
  });

  test('removeFromCart() reports it instead of a raw TypeError', async () => {
    await expect(removeFromCart('user-1', 'cart-item-1')).rejects.toThrow('Database connection not available');
  });

  test('clearCart() reports it instead of a raw TypeError', async () => {
    await expect(clearCart('user-1')).rejects.toThrow('Database connection not available');
  });

  test('createOrder() reports it instead of a raw TypeError', async () => {
    await expect(createOrder('user-1', {})).rejects.toThrow('Database connection not available');
  });

  test('getOrderById() reports it instead of a raw TypeError', async () => {
    await expect(getOrderById('order-1', 'user-1')).rejects.toThrow('Database connection not available');
  });

  test('getUserOrders() reports it instead of a raw TypeError', async () => {
    await expect(getUserOrders('user-1')).rejects.toThrow('Database connection not available');
  });

  test('updateOrderStatus() reports it instead of a raw TypeError', async () => {
    await expect(updateOrderStatus('order-1', 'shipped')).rejects.toThrow('Database connection not available');
  });

  test('processPayment() reports it instead of a raw TypeError', async () => {
    await expect(processPayment('order-1', {})).rejects.toThrow('Database connection not available');
  });
});

describe('orderService.createOrder - real flow with a mocked database', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    getPostgreSQL.mockReturnValue({ query: mockQuery });
  });

  test('throws a clear error when the cart is empty, without ever reaching the DB fallback', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // cart query returns nothing

    await expect(createOrder('user-1', {})).rejects.toThrow('Cart is empty');
  });

  test('refuses to create an order when requested quantity exceeds real stock', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'cart-item-1',
          product_id: 'prod-1',
          quantity: 5,
          base_price: 100,
          product_name: 'Rice',
          stock_quantity: 2,
          hsn_code: '1006',
          gst_applicable: true,
          is_branded_packaged: false,
          registered_brand_name: null,
          category_name: 'Grains',
        },
      ],
    });

    await expect(createOrder('user-1', {})).rejects.toThrow(/Not enough stock for: Rice/);
  });
});
