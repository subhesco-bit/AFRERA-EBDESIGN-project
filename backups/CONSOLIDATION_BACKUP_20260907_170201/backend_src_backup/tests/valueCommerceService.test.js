/**
 * Value Commerce Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { Pool } = require('pg');

describe('Value Commerce Service', () => {
  let pool;
  let authToken;
  let testProductId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'value-test@example.com',
        password: 'Test123!@#',
        role: 'consumer'
      });

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/v1/value-commerce/value-factors', () => {
    it('should return value factors', async () => {
      const response = await request(app)
        .get('/api/v1/value-commerce/value-factors')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/value-commerce/product-value-scores', () => {
    it('should calculate product value score', async () => {
      const response = await request(app)
        .post('/api/v1/value-commerce/product-value-scores')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 'test-product-id',
          nutrition_score: 90,
          organic_score: 85,
          gi_score: 80,
          freshness_score: 88,
          sustainability_score: 82,
          quality_score: 87
        })
        .expect(201);

      expect(response.body).toHaveProperty('overall_value_score');
      expect(response.body).toHaveProperty('value_grade');
      testProductId = response.body.product_id;
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/value-commerce/product-value-scores')
        .send({
          product_id: 'test-product-id',
          nutrition_score: 90
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/value-commerce/product-value-scores/:productId', () => {
    it('should get product value score', async () => {
      const response = await request(app)
        .get(`/api/v1/value-commerce/product-value-scores/${testProductId}`)
        .expect(200);

      expect(response.body).toHaveProperty('overall_value_score');
      expect(response.body).toHaveProperty('value_grade');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/value-commerce/product-value-scores/nonexistent')
        .expect(404);
    });
  });

  describe('POST /api/v1/value-commerce/value-pricing', () => {
    it('should calculate value-based price', async () => {
      const response = await request(app)
        .post('/api/v1/value-commerce/value-pricing')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: testProductId,
          base_price: 100
        })
        .expect(200);

      expect(response.body).toHaveProperty('base_price');
      expect(response.body).toHaveProperty('value_premium');
      expect(response.body).toHaveProperty('final_price');
      expect(response.body).toHaveProperty('premium_percentage');
      expect(response.body.final_price).toBeGreaterThan(response.body.base_price);
    });
  });

  describe('POST /api/v1/value-commerce/consumer-preferences', () => {
    it('should set consumer value preferences', async () => {
      const response = await request(app)
        .post('/api/v1/value-commerce/consumer-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nutrition_importance: 1.5,
          organic_importance: 1.2,
          gi_importance: 1.0,
          freshness_importance: 1.0,
          sustainability_importance: 0.8,
          quality_importance: 1.0,
          min_value_score: 75,
          preferred_tiers: ['A+', 'A', 'B+']
        })
        .expect(200);

      expect(response.body).toHaveProperty('nutrition_importance');
    });
  });

  describe('GET /api/v1/value-commerce/consumer-preferences', () => {
    it('should get consumer value preferences', async () => {
      const response = await request(app)
        .get('/api/v1/value-commerce/consumer-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('nutrition_importance');
    });
  });

  describe('GET /api/v1/value-commerce/recommendations', () => {
    it('should generate value-based recommendations', async () => {
      const response = await request(app)
        .get('/api/v1/value-commerce/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/value-commerce/value-tiers', () => {
    it('should return value tiers', async () => {
      const response = await request(app)
        .get('/api/v1/value-commerce/value-tiers')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
