'use strict';

// services/legacy/farmerService.js used to be mounted only via
// routes/farmerRoutes.js, a 38-line "Route operational" scaffold - the
// real, complete, already-debugged routes/farmerRoutes_merged.js
// (calling this file directly) sat unmounted next to it. Swapped in at
// /api/farmer (2026-09-15). That same investigation found all 13
// exported functions here fetched getPostgreSQL() without checking it
// for null, throwing a raw "Cannot read properties of null (reading
// 'query')" TypeError instead of a clean error whenever the database is
// down - the same gap already found and fixed in orderService.js and
// productService.js earlier this session. Added the same guard
// everywhere; these tests lock it in.

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../database/connection', () => ({
  getPostgreSQL: jest.fn(),
}));

const { getPostgreSQL } = require('../../../database/connection');
const {
  getFarmerById,
  getFarmers,
  calculateFDI,
  addFarmerCertification,
  getFarmerCertifications,
  getFPOs,
  getFarmerWallet,
  getWalletTransactions,
  depositToWallet,
  withdrawFromWallet,
  transferFromWallet,
  getWalletBalance,
  linkBankAccount,
} = require('../farmerService');

describe('farmerService - honest error when the database is unavailable', () => {
  beforeEach(() => {
    getPostgreSQL.mockReturnValue(null);
  });

  test('getFarmerById() reports it instead of a raw TypeError', async () => {
    await expect(getFarmerById('farmer-1')).rejects.toThrow('Database connection not available');
  });

  test('getFarmers() reports it instead of a raw TypeError', async () => {
    await expect(getFarmers()).rejects.toThrow('Database connection not available');
  });

  test('calculateFDI() reports it instead of a raw TypeError', async () => {
    await expect(calculateFDI('farmer-1')).rejects.toThrow('Database connection not available');
  });

  test('addFarmerCertification() reports it instead of a raw TypeError', async () => {
    await expect(addFarmerCertification('farmer-1', {})).rejects.toThrow('Database connection not available');
  });

  test('getFarmerCertifications() reports it instead of a raw TypeError', async () => {
    await expect(getFarmerCertifications('farmer-1')).rejects.toThrow('Database connection not available');
  });

  test('getFPOs() reports it instead of a raw TypeError', async () => {
    await expect(getFPOs()).rejects.toThrow('Database connection not available');
  });

  test('getFarmerWallet() reports it instead of a raw TypeError', async () => {
    await expect(getFarmerWallet('farmer-1')).rejects.toThrow('Database connection not available');
  });

  test('linkBankAccount() reports it instead of a raw TypeError', async () => {
    await expect(linkBankAccount('farmer-1', 'Bank', '12345', 'IFSC0001', 'Farmer Name')).rejects.toThrow(
      'Database connection not available',
    );
  });

  // The following all call getFarmerWallet() first, which already
  // throws the clean error above before reaching their own pg usage -
  // still locked in directly so a future refactor can't silently drop
  // that ordering without a test noticing.
  test('getWalletTransactions() reports it instead of a raw TypeError', async () => {
    await expect(getWalletTransactions('farmer-1')).rejects.toThrow('Database connection not available');
  });

  test('depositToWallet() reports it instead of a raw TypeError', async () => {
    await expect(depositToWallet('farmer-1', 100, 'upi', 'ref-1')).rejects.toThrow('Database connection not available');
  });

  test('withdrawFromWallet() reports it instead of a raw TypeError', async () => {
    await expect(withdrawFromWallet('farmer-1', 100, 'acct-1', 'ref-1')).rejects.toThrow(
      'Database connection not available',
    );
  });

  test('transferFromWallet() reports it instead of a raw TypeError', async () => {
    await expect(transferFromWallet('farmer-1', 'farmer-2', 100, 'gift')).rejects.toThrow(
      'Database connection not available',
    );
  });

  test('getWalletBalance() reports it instead of a raw TypeError', async () => {
    await expect(getWalletBalance('farmer-1')).rejects.toThrow('Database connection not available');
  });
});
