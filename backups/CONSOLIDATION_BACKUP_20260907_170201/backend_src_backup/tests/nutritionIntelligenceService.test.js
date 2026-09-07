/**
 * Nutrition Intelligence Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { Pool } = require('pg');

describe('Nutrition Intelligence Service', () => {
  let pool;
  let authToken;
  let testProductId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });

    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'nutrition-test@example.com',
        password: 'Test123!@#',
        role: 'admin'
      });

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/v1/nutrition-intelligence/nutrients', () => {
    it('should return all nutrients', async () => {
      const response = await request(app)
        .get('/api/v1/nutrition-intelligence/nutrients')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('symbol');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('unit');
    });
  });

  describe('POST /api/v1/nutrition-intelligence/food-profiles', () => {
    it('should create a food nutrition profile', async () => {
      const response = await request(app)
        .post('/api/v1/nutrition-intelligence/food-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          food_name: 'Organic Rice',
          scientific_name: 'Oryza sativa',
          food_group: 'grains',
          botanical_family: 'Poaceae',
          variety: 'Basmati',
          origin_region: 'Assam',
          is_organic: true,
          nutrition_data: {
            PRO: 6.5,
            CARB: 75,
            FIB: 2.8,
            FAT: 0.5,
            SAT_FAT: 0.1,
            CHOL: 0,
            SOD: 5,
            VIT_A: 0,
            VIT_C: 0,
            CAL: 28,
            IRON: 0.8
          },
          serving_size_g: 100,
          calories_per_100g: 346,
          glycemic_index: 68,
          glycemic_load: 52,
          anti_inflammatory_score: 3,
          antioxidant_capacity: 150
        })
        .expect(201);

      expect(response.body).toHaveProperty('food_name');
      expect(response.body).toHaveProperty('nutrition_data');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/nutrition-intelligence/food-profiles')
        .send({
          food_name: 'Test Food'
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/nutrition-intelligence/food-profiles/search', () => {
    it('should search food profiles', async () => {
      const response = await request(app)
        .get('/api/v1/nutrition-intelligence/food-profiles/search?q=rice')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return 400 without query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/nutrition-intelligence/food-profiles/search')
        .expect(400);
    });
  });

  describe('POST /api/v1/nutrition-intelligence/product-nutrition', () => {
    it('should add nutrition data to product', async () => {
      testProductId = 'test-product-id-123';
      
      const response = await request(app)
        .post('/api/v1/nutrition-intelligence/product-nutrition')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: testProductId,
          nutrition_profile_id: null,
          lab_test_id: null,
          test_date: '2024-01-15',
          testing_laboratory: 'Test Lab',
          sample_batch_number: 'BATCH-001',
          nutrition_data: {
            PRO: 8.0,
            CARB: 70,
            FIB: 3.5,
            FAT: 1.0,
            SAT_FAT: 0.2,
            CHOL: 0,
            SOD: 10,
            VIT_A: 5,
            VIT_C: 2,
            CAL: 30,
            IRON: 1.2
          },
          calories_per_serving: 320,
          serving_size_g: 100,
          servings_per_container: 5,
          verification_method: 'lab_test',
          confidence_score: 0.95
        })
        .expect(201);

      expect(response.body).toHaveProperty('product_id');
      expect(response.body).toHaveProperty('nutrition_data');
    });
  });

  describe('GET /api/v1/nutrition-intelligence/product-nutrition/:productId', () => {
    it('should get product nutrition', async () => {
      const response = await request(app)
        .get(`/api/v1/nutrition-intelligence/product-nutrition/${testProductId}`)
        .expect(200);

      expect(response.body).toHaveProperty('nutrition_data');
      expect(response.body).toHaveProperty('calories_per_serving');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/nutrition-intelligence/product-nutrition/nonexistent')
        .expect(404);
    });
  });

  describe('POST /api/v1/nutrition-intelligence/product-nutrition/:productId/score', () => {
    it('should calculate nutrition score', async () => {
      const response = await request(app)
        .post(`/api/v1/nutrition-intelligence/product-nutrition/${testProductId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scoring_model_id: 1
        })
        .expect(200);

      expect(response.body).toHaveProperty('overall_score');
      expect(response.body).toHaveProperty('grade');
      expect(response.body.overall_score).toBeGreaterThanOrEqual(0);
      expect(response.body.overall_score).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/v1/nutrition-intelligence/product-nutrition/:productId/score', () => {
    it('should get product nutrition score', async () => {
      const response = await request(app)
        .get(`/api/v1/nutrition-intelligence/product-nutrition/${testProductId}/score`)
        .expect(200);

      expect(response.body).toHaveProperty('overall_score');
      expect(response.body).toHaveProperty('grade');
    });
  });

  describe('POST /api/v1/nutrition-intelligence/product-nutrition/:productId/pricing', () => {
    it('should calculate nutrition-based pricing', async () => {
      const response = await request(app)
        .post(`/api/v1/nutrition-intelligence/product-nutrition/${testProductId}/pricing`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          base_price: 100,
          pricing_rule_id: 1
        })
        .expect(200);

      expect(response.body).toHaveProperty('base_price');
      expect(response.body).toHaveProperty('final_price');
      expect(response.body).toHaveProperty('price_premium_percentage');
      expect(response.body.final_price).toBeGreaterThanOrEqual(response.body.base_price);
    });
  });

  describe('POST /api/v1/nutrition-intelligence/compare', () => {
    it('should compare nutrition between two products', async () => {
      const response = await request(app)
        .post('/api/v1/nutrition-intelligence/compare')
        .send({
          product_a_id: testProductId,
          product_b_id: 'test-product-id-456'
        })
        .expect(200);

      expect(response.body).toHaveProperty('product_a');
      expect(response.body).toHaveProperty('product_b');
      expect(response.body).toHaveProperty('winner');
      expect(response.body).toHaveProperty('comparison_reason');
    });
  });

  describe('GET /api/v1/nutrition-intelligence/dietary-profiles', () => {
    it('should get dietary profiles', async () => {
      const response = await request(app)
        .get('/api/v1/nutrition-intelligence/dietary-profiles')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
