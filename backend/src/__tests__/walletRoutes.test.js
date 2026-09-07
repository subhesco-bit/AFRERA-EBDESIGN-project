const request = require('supertest');
const express = require('express');
const walletRoutes = require('../routes/walletRoutes');

const app = express();
app.use(express.json());
app.use('/wallet', walletRoutes);

describe('Wallet Routes', () => {
  const validToken = 'Bearer user_token_123';
  const anotherToken = 'Bearer user_token_456';

  describe('GET /wallet/balance', () => {
    it('should return wallet balance with valid token', async () => {
      const response = await request(app)
        .get('/wallet/balance')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBeDefined();
      expect(response.body.data.currency).toBe('INR');
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/wallet/balance');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /wallet/add-funds', () => {
    it('should add funds successfully', async () => {
      const response = await request(app)
        .post('/wallet/add-funds')
        .set('Authorization', validToken)
        .send({
          amount: 1000,
          paymentMethod: 'card',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBeGreaterThan(5000);
      expect(response.body.data.transaction.type).toBe('credit');
    });

    it('should fail with invalid amount', async () => {
      const response = await request(app)
        .post('/wallet/add-funds')
        .set('Authorization', validToken)
        .send({
          amount: -500,
          paymentMethod: 'card',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/wallet/add-funds')
        .send({
          amount: 1000,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /wallet/transactions', () => {
    beforeEach(async () => {
      // Add some transactions
      await request(app)
        .post('/wallet/add-funds')
        .set('Authorization', validToken)
        .send({
          amount: 500,
          paymentMethod: 'card',
        });
    });

    it('should return transaction history', async () => {
      const response = await request(app)
        .get('/wallet/transactions')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/wallet/transactions?limit=1')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeLessThanOrEqual(1);
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/wallet/transactions');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /wallet/transfer', () => {
    beforeEach(async () => {
      // Ensure sender has funds
      await request(app)
        .post('/wallet/add-funds')
        .set('Authorization', validToken)
        .send({
          amount: 5000,
          paymentMethod: 'card',
        });
    });

    it('should transfer funds successfully', async () => {
      const response = await request(app)
        .post('/wallet/transfer')
        .set('Authorization', validToken)
        .send({
          recipientId: 'user_token_456',
          amount: 500,
          description: 'Payment for services',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.type).toBe('debit');
      expect(response.body.data.message).toContain('successfully');
    });

    it('should fail with insufficient balance', async () => {
      const response = await request(app)
        .post('/wallet/transfer')
        .set('Authorization', validToken)
        .send({
          recipientId: 'user_token_456',
          amount: 50000, // More than available
          description: 'Payment',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient');
    });

    it('should fail with invalid amount', async () => {
      const response = await request(app)
        .post('/wallet/transfer')
        .set('Authorization', validToken)
        .send({
          recipientId: 'user_token_456',
          amount: -100,
          description: 'Payment',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/wallet/transfer')
        .send({
          recipientId: 'user_token_456',
          amount: 500,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
