/**
 * Food Intelligence Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { Pool } = require('pg');

describe('Food Intelligence Service', () => {
  let pool;
  let authToken;
  let testFoodItemId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'food-test@example.com',
        password: 'Test123!@#',
        role: 'admin'
      });

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/v1/food-intelligence/food-items', () => {
    it('should create a food item', async () => {
      const response = await request(app)
        .post('/api/v1/food-intelligence/food-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Basmati Rice',
          scientific_name: 'Oryza sativa',
          category_id: 1,
          food_group: 'grains',
          origin: 'India',
          variety: 'Basmati',
          botanical_family: 'Poaceae',
          common_names: ['Basmati', 'Indian Rice'],
          description: 'Long-grain aromatic rice',
          is_organic: false,
          is_gi: false,
          shelf_life_days: 365,
          storage_conditions: { temperature: 'cool', humidity: 'dry' },
          allergens: []
        })
        .expect(201);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('food_group');
      testFoodItemId = response.body.id;
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/food-intelligence/food-items')
        .send({
          name: 'Test Food'
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/food-intelligence/food-items/search', () => {
    it('should search food items', async () => {
      const response = await request(app)
        .get('/api/v1/food-intelligence/food-items/search?q=rice')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return 400 without query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/food-intelligence/food-items/search')
        .expect(400);
    });
  });

  describe('POST /api/v1/food-intelligence/quality-assessments', () => {
    it('should create quality assessment', async () => {
      const response = await request(app)
        .post('/api/v1/food-intelligence/quality-assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          food_item_id: testFoodItemId,
          assessment_date: '2024-01-15',
          assessor_id: 'assessor-001',
          assessment_type: 'routine',
          quality_scores: {
            appearance: 95,
            texture: 90,
            aroma: 92,
            taste: 88
          },
          recommendations: ['Maintain current storage conditions']
        })
        .expect(201);

      expect(response.body).toHaveProperty('overall_quality_score');
      expect(response.body).toHaveProperty('quality_grade');
    });
  });

  describe('GET /api/v1/food-intelligence/food-items/:foodItemId/quality-assessments', () => {
    it('should get quality assessments', async () => {
      const response = await request(app)
        .get(`/api/v1/food-intelligence/food-items/${testFoodItemId}/quality-assessments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/food-intelligence/contaminant-tests', () => {
    it('should record contaminant test', async () => {
      const response = await request(app)
        .post('/api/v1/food-intelligence/contaminant-tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          food_item_id: testFoodItemId,
          contaminant_id: 1,
          test_date: '2024-01-15',
          testing_laboratory: 'Test Lab',
          contaminant_level: 0.5,
          unit: 'mg/kg',
          detection_limit: 0.1,
          test_method: 'HPLC'
        })
        .expect(201);

      expect(response.body).toHaveProperty('result_status');
    });
  });

  describe('GET /api/v1/food-intelligence/food-items/:foodItemId/contaminant-tests', () => {
    it('should get contaminant tests', async () => {
      const response = await request(app)
        .get(`/api/v1/food-intelligence/food-items/${testFoodItemId}/contaminant-tests`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/food-intelligence/freshness-assessments', () => {
    it('should create freshness assessment', async () => {
      const response = await request(app)
        .post('/api/v1/food-intelligence/freshness-assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          food_item_id: testFoodItemId,
          assessment_date: '2024-01-15',
          freshness_scores: {
            visual: 95,
            aroma: 90,
            texture: 88
          },
          storage_recommendations: ['Store in cool dry place']
        })
        .expect(201);

      expect(response.body).toHaveProperty('freshness_status');
      expect(response.body).toHaveProperty('estimated_remaining_days');
    });
  });

  describe('POST /api/v1/food-intelligence/food-recalls', () => {
    it('should create food recall', async () => {
      const response = await request(app)
        .post('/api/v1/food-intelligence/food-recalls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          food_item_id: testFoodItemId,
          recall_number: 'REC-2024-001',
          recall_date: '2024-01-15',
          recall_type: 'voluntary',
          recall_reason: 'Test recall for quality issue',
          hazard_level: 'medium',
          affected_batches: ['BATCH-001'],
          affected_regions: ['Assam'],
          recalling_firm: 'Test Company'
        })
        .expect(201);

      expect(response.body).toHaveProperty('recall_number');
      expect(response.body.recall_status).toBe('active');
    });
  });

  describe('GET /api/v1/food-intelligence/food-recalls/active', () => {
    it('should get active recalls', async () => {
      const response = await request(app)
        .get('/api/v1/food-intelligence/food-recalls/active')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/food-intelligence/food-intelligence', () => {
    it('should record food intelligence analytics', async () => {
      const response = await request(app)
        .post('/api/v1/food-intelligence/food-intelligence')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          food_item_id: testFoodItemId,
          metrics: {
            inspections: 100,
            quality_pass_rate: 95,
            safety_incidents: 0,
            complaints: 2,
            freshness_score: 88,
            market_price: 50,
            demand_index: 1.2,
            supply_index: 0.9
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('total_inspections');
    });
  });
});
