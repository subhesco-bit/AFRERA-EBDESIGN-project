/**
 * Wallet routes: authentication and ownership rules.
 *
 * Rewritten 2026-10-05. The previous version (recovered in c39316f) targeted
 * an older in-memory wallet API (GET /wallet/balance with fake bearer
 * strings, user-initiated add-funds) that no longer exists. These tests pin
 * the real routes in routes/walletRoutes.js and the access rules in
 * controllers/walletController.js; walletService is mocked so no database is
 * needed.
 */
jest.mock('../services/walletService', () => ({
  getBalance: jest.fn(),
  createWallet: jest.fn(),
  addFunds: jest.fn(),
  getTransactionHistory: jest.fn(),
  getWalletOwner: jest.fn(),
}));
jest.mock('../middleware/rateLimiter', () => {
  const pass = (req, res, next) => next();
  return { apiLimiter: pass, rateLimiter: pass, authLimiter: pass, strictLimiter: pass };
});

const request = require('supertest');
const express = require('express');
const walletService = require('../services/walletService');
const { generateAccessToken } = require('../services/dual-use/authService');
const walletRoutes = require('../routes/walletRoutes');

const app = express();
app.use(express.json());
app.use('/wallet', walletRoutes);

const OWNER = { id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.com', role: 'farmer' };
const OTHER = { id: '22222222-2222-4222-8222-222222222222', email: 'other@example.com', role: 'farmer' };
const ADMIN = { id: '33333333-3333-4333-8333-333333333333', email: 'admin@example.com', role: 'admin' };
const bearer = (user) => `Bearer ${generateAccessToken(user)}`;

beforeEach(() => {
  jest.clearAllMocks();
  walletService.getWalletOwner.mockResolvedValue(OWNER.id);
});

describe('Wallet routes', () => {
  test('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/wallet/balance');
    expect(res.status).toBe(401);
    expect(walletService.getBalance).not.toHaveBeenCalled();
  });

  test('GET /balance returns the caller\'s own balance', async () => {
    walletService.getBalance.mockResolvedValue({ wallet_id: 'w1', balance: '100.00', currency: 'INR' });
    const res = await request(app).get('/wallet/balance').set('Authorization', bearer(OWNER));
    expect(res.status).toBe(200);
    expect(res.body.data.currency).toBe('INR');
    expect(walletService.getBalance).toHaveBeenCalledWith(OWNER.id);
  });

  test('GET /balance/:userId refuses another user\'s balance', async () => {
    const res = await request(app).get(`/wallet/balance/${OWNER.id}`).set('Authorization', bearer(OTHER));
    expect(res.status).toBe(403);
    expect(walletService.getBalance).not.toHaveBeenCalled();
  });

  test('GET /balance/:userId lets an admin read any balance', async () => {
    walletService.getBalance.mockResolvedValue({ wallet_id: 'w1', balance: '100.00', currency: 'INR' });
    const res = await request(app).get(`/wallet/balance/${OWNER.id}`).set('Authorization', bearer(ADMIN));
    expect(res.status).toBe(200);
    expect(walletService.getBalance).toHaveBeenCalledWith(OWNER.id);
  });

  test('POST /create always creates the wallet for the caller', async () => {
    walletService.createWallet.mockResolvedValue({ wallet_id: 'w2', user_id: OTHER.id });
    const res = await request(app)
      .post('/wallet/create')
      .set('Authorization', bearer(OTHER))
      .send({ userId: OWNER.id, initialBalance: 1000000, currency: 'INR' });
    expect(res.status).toBe(200);
    expect(walletService.createWallet).toHaveBeenCalledWith({ userId: OTHER.id, currency: 'INR' });
  });

  test('POST /add-funds is admin-only', async () => {
    const res = await request(app)
      .post('/wallet/add-funds/w1')
      .set('Authorization', bearer(OWNER))
      .send({ amount: 1000 });
    expect(res.status).toBe(403);
    expect(walletService.addFunds).not.toHaveBeenCalled();
  });

  test('POST /add-funds rejects non-positive amounts', async () => {
    const res = await request(app)
      .post('/wallet/add-funds/w1')
      .set('Authorization', bearer(ADMIN))
      .send({ amount: -500 });
    expect(res.status).toBe(400);
    expect(walletService.addFunds).not.toHaveBeenCalled();
  });

  test('POST /add-funds credits an existing wallet for an admin', async () => {
    walletService.addFunds.mockResolvedValue({ balance: '1100.00' });
    const res = await request(app)
      .post('/wallet/add-funds/w1')
      .set('Authorization', bearer(ADMIN))
      .send({ amount: 1000, source: 'manual_adjustment' });
    expect(res.status).toBe(200);
    expect(walletService.addFunds).toHaveBeenCalledWith('w1', { amount: 1000, source: 'manual_adjustment' });
  });

  test('POST /add-funds returns 404 for an unknown wallet', async () => {
    walletService.getWalletOwner.mockResolvedValue(null);
    const res = await request(app)
      .post('/wallet/add-funds/missing')
      .set('Authorization', bearer(ADMIN))
      .send({ amount: 10 });
    expect(res.status).toBe(404);
  });

  test('GET /transactions/:walletId is limited to the wallet owner', async () => {
    walletService.getTransactionHistory.mockResolvedValue([]);
    const denied = await request(app).get('/wallet/transactions/w1').set('Authorization', bearer(OTHER));
    expect(denied.status).toBe(403);
    const allowed = await request(app).get('/wallet/transactions/w1').set('Authorization', bearer(OWNER));
    expect(allowed.status).toBe(200);
    expect(walletService.getTransactionHistory).toHaveBeenCalledTimes(1);
  });
});
