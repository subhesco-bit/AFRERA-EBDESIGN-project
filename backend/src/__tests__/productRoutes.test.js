const request = require('supertest');
const express = require('express');
const productRoutes = require('../routes/productRoutes');

const app = express();
app.use(express.json());
app.use('/products', productRoutes);

describe('Product Routes', () => {
  const validToken = 'Bearer admin_token_123';

  describe('GET /products', () => {
    it('should list all products', async () => {
      const response = await request(app).get('/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should filter products by category', async () => {
      const response = await request(app).get('/products?category=grains');

      expect(response.status).toBe(200);
      expect(response.body.data.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ category: 'grains' }),
        ])
      );
    });

    it('should search products by name', async () => {
      const response = await request(app).get('/products?search=rice');

      expect(response.status).toBe(200);
      expect(response.body.data.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: expect.stringMatching(/rice/i) }),
        ])
      );
    });
  });

  describe('GET /products/:id', () => {
    it('should get product details', async () => {
      const response = await request(app).get('/products/prod_001');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('prod_001');
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.price).toBeDefined();
    });

    it('should return 404 for nonexistent product', async () => {
      const response = await request(app).get('/products/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /products', () => {
    it('should create new product', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', validToken)
        .send({
          name: 'New Product',
          price: 500,
          category: 'test',
          description: 'Test product',
          stock: 10,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe('New Product');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', validToken)
        .send({
          name: 'Incomplete Product',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/products')
        .send({
          name: 'Unauthorized Product',
          price: 100,
          category: 'test',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /products/:id', () => {
    it('should update product', async () => {
      const response = await request(app)
        .put('/products/prod_001')
        .set('Authorization', validToken)
        .send({
          price: 500,
          stock: 200,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(500);
      expect(response.body.data.stock).toBe(200);
    });

    it('should fail for nonexistent product', async () => {
      const response = await request(app)
        .put('/products/nonexistent')
        .set('Authorization', validToken)
        .send({ price: 500 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete product', async () => {
      // First create a product
      const createRes = await request(app)
        .post('/products')
        .set('Authorization', validToken)
        .send({
          name: 'To Delete',
          price: 100,
          category: 'test',
        });

      const productId = createRes.body.data.id;

      // Then delete it
      const deleteRes = await request(app)
        .delete(`/products/${productId}`)
        .set('Authorization', validToken);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toContain('successfully');
    });
  });
});
