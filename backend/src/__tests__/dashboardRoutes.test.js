const request = require('supertest');
const express = require('express');
const dashboardRoutes = require('../routes/dashboardRoutes');

const app = express();
app.use(express.json());
app.use('/dashboard', dashboardRoutes);

describe('Dashboard Routes', () => {
  const validToken = 'Bearer valid_token_12345';
  const invalidToken = 'Bearer invalid_token';

  describe('GET /dashboard/stats', () => {
    it('should return dashboard stats with valid token', async () => {
      const response = await request(app)
        .get('/dashboard/stats')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBeDefined();
      expect(response.body.data.activeOrders).toBeDefined();
      expect(response.body.data.totalTransactions).toBeDefined();
      expect(response.body.data.loyaltyPoints).toBeDefined();
      expect(response.body.data.recentTransactions).toBeDefined();
      expect(Array.isArray(response.body.data.recentTransactions)).toBe(true);
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/dashboard/stats');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return specific stat values', async () => {
      const response = await request(app)
        .get('/dashboard/stats')
        .set('Authorization', validToken);

      expect(response.body.data.balance).toBe(5250.5);
      expect(response.body.data.activeOrders).toBe(3);
      expect(response.body.data.totalTransactions).toBe(47);
      expect(response.body.data.loyaltyPoints).toBe(1250);
    });
  });

  describe('GET /dashboard/balance', () => {
    it('should return account balance with valid token', async () => {
      const response = await request(app)
        .get('/dashboard/balance')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe(5250.5);
      expect(response.body.data.currency).toBe('INR');
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/dashboard/balance');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /dashboard/recent-transactions', () => {
    it('should return recent transactions with valid token', async () => {
      const response = await request(app)
        .get('/dashboard/recent-transactions')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(response.body.data.count).toBe(5);
    });

    it('should have transaction objects with required fields', async () => {
      const response = await request(app)
        .get('/dashboard/recent-transactions')
        .set('Authorization', validToken);

      const transaction = response.body.data.transactions[0];
      expect(transaction.id).toBeDefined();
      expect(transaction.description).toBeDefined();
      expect(transaction.amount).toBeDefined();
      expect(transaction.type).toBeDefined();
      expect(transaction.date).toBeDefined();
      expect(transaction.status).toBeDefined();
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/dashboard/recent-transactions');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should have transactions with correct types', async () => {
      const response = await request(app)
        .get('/dashboard/recent-transactions')
        .set('Authorization', validToken);

      response.body.data.transactions.forEach((tx) => {
        expect(['credit', 'debit']).toContain(tx.type);
        expect(['completed', 'pending']).toContain(tx.status);
      });
    });
  });
});
