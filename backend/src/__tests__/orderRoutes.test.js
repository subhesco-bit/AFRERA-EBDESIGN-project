const request = require('supertest');
const express = require('express');
const orderRoutes = require('../routes/orderRoutes');

const app = express();
app.use(express.json());
app.use('/orders', orderRoutes);

describe('Order Routes', () => {
  const userToken = 'Bearer user_token_123';

  describe('POST /orders', () => {
    it('should create new order', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', userToken)
        .send({
          items: [{ productId: 'prod_001', quantity: 2, price: 450 }],
          totalAmount: 900,
          shippingAddress: '123 Main St, City, State',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('pending');
    });

    it('should fail without auth', async () => {
      const response = await request(app)
        .post('/orders')
        .send({
          items: [],
          totalAmount: 100,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /orders', () => {
    beforeEach(async () => {
      await request(app)
        .post('/orders')
        .set('Authorization', userToken)
        .send({
          items: [{ productId: 'prod_001', quantity: 1 }],
          totalAmount: 450,
          shippingAddress: '123 Main St',
        });
    });

    it('should list user orders', async () => {
      const response = await request(app)
        .get('/orders')
        .set('Authorization', userToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/orders?status=pending')
        .set('Authorization', userToken);

      expect(response.status).toBe(200);
      expect(response.body.data.orders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'pending' }),
        ])
      );
    });
  });

  describe('GET /orders/:id', () => {
    let orderId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/orders')
        .set('Authorization', userToken)
        .send({
          items: [{ productId: 'prod_001', quantity: 1 }],
          totalAmount: 450,
          shippingAddress: '123 Main St',
        });
      orderId = createRes.body.data.id;
    });

    it('should get order details', async () => {
      const response = await request(app)
        .get(`/orders/${orderId}`)
        .set('Authorization', userToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(orderId);
    });

    it('should return 404 for nonexistent order', async () => {
      const response = await request(app)
        .get('/orders/nonexistent')
        .set('Authorization', userToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /orders/:id', () => {
    let orderId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/orders')
        .set('Authorization', userToken)
        .send({
          items: [{ productId: 'prod_001', quantity: 1 }],
          totalAmount: 450,
          shippingAddress: '123 Main St',
        });
      orderId = createRes.body.data.id;
    });

    it('should update order status', async () => {
      const response = await request(app)
        .put(`/orders/${orderId}`)
        .set('Authorization', userToken)
        .send({ status: 'shipped' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('shipped');
    });
  });

  describe('DELETE /orders/:id', () => {
    let orderId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/orders')
        .set('Authorization', userToken)
        .send({
          items: [{ productId: 'prod_001', quantity: 1 }],
          totalAmount: 450,
          shippingAddress: '123 Main St',
        });
      orderId = createRes.body.data.id;
    });

    it('should cancel order', async () => {
      const response = await request(app)
        .delete(`/orders/${orderId}`)
        .set('Authorization', userToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cancelled');
    });
  });
});
