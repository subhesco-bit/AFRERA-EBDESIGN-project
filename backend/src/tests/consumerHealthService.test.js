/**
 * Consumer Health Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { Pool } = require('pg');

describe('Consumer Health Service', () => {
  let pool;
  let authToken;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'health-test@example.com',
        password: 'Test123!@#',
        role: 'consumer'
      });

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/v1/consumer-health/health-profiles', () => {
    it('should create health profile', async () => {
      const response = await request(app)
        .post('/api/v1/consumer-health/health-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profile_name: 'My Health Profile',
          date_of_birth: '1990-01-15',
          gender: 'male',
          height_cm: 175,
          weight_kg: 70,
          blood_type: 'O+',
          activity_level: 'moderate',
          health_conditions: [],
          allergies: ['peanuts'],
          dietary_restrictions: [],
          medications: {},
          health_goals: ['weight_loss']
        })
        .expect(201);

      expect(response.body).toHaveProperty('profile_name');
      expect(response.body).toHaveProperty('height_cm');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/consumer-health/health-profiles')
        .send({
          profile_name: 'Test Profile'
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/consumer-health/health-profiles', () => {
    it('should get health profile', async () => {
      const response = await request(app)
        .get('/api/v1/consumer-health/health-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('profile_name');
    });
  });

  describe('POST /api/v1/consumer-health/dietary-profiles', () => {
    it('should create dietary profile', async () => {
      const response = await request(app)
        .post('/api/v1/consumer-health/dietary-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profile_type: 'balanced',
          daily_calorie_target: 2000,
          macronutrient_targets: { protein: 150, carbs: 250, fats: 65 },
          micronutrient_targets: {},
          meal_frequency: 3,
          meal_timing: {},
          hydration_target_ml: 2000
        })
        .expect(201);

      expect(response.body).toHaveProperty('profile_type');
      expect(response.body).toHaveProperty('daily_calorie_target');
    });
  });

  describe('POST /api/v1/consumer-health/health-metrics', () => {
    it('should log health metric', async () => {
      const response = await request(app)
        .post('/api/v1/consumer-health/health-metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          metric_type: 'weight',
          metric_value: 70,
          unit: 'kg',
          notes: 'Morning weight',
          source: 'manual'
        })
        .expect(201);

      expect(response.body).toHaveProperty('metric_type');
      expect(response.body).toHaveProperty('metric_value');
    });
  });

  describe('GET /api/v1/consumer-health/health-metrics', () => {
    it('should get health metrics', async () => {
      const response = await request(app)
        .get('/api/v1/consumer-health/health-metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/consumer-health/health-goals', () => {
    it('should create health goal', async () => {
      const response = await request(app)
        .post('/api/v1/consumer-health/health-goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          goal_type: 'weight_loss',
          target_value: 65,
          current_value: 70,
          unit: 'kg',
          start_date: '2024-01-01',
          target_date: '2024-06-01'
        })
        .expect(201);

      expect(response.body).toHaveProperty('goal_type');
      expect(response.body.status).toBe('active');
    });
  });

  describe('GET /api/v1/consumer-health/health-goals', () => {
    it('should get health goals', async () => {
      const response = await request(app)
        .get('/api/v1/consumer-health/health-goals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/consumer-health/dietary-recommendations', () => {
    it('should generate dietary recommendation', async () => {
      const response = await request(app)
        .post('/api/v1/consumer-health/dietary-recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recommendation_type: 'food',
          recommendation_text: 'Increase protein intake',
          priority: 'high',
          category: 'nutrition',
          reasoning: 'Based on health goals'
        })
        .expect(201);

      expect(response.body).toHaveProperty('recommendation_text');
    });
  });

  describe('GET /api/v1/consumer-health/dietary-recommendations', () => {
    it('should get dietary recommendations', async () => {
      const response = await request(app)
        .get('/api/v1/consumer-health/dietary-recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/consumer-health/health-alerts', () => {
    it('should create health alert', async () => {
      const response = await request(app)
        .post('/api/v1/consumer-health/health-alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          alert_type: 'allergy',
          severity: 'high',
          alert_message: 'Peanut allergy detected',
          trigger_data: { allergen: 'peanuts' }
        })
        .expect(201);

      expect(response.body).toHaveProperty('alert_type');
      expect(response.body).toHaveProperty('severity');
    });
  });

  describe('GET /api/v1/consumer-health/health-alerts', () => {
    it('should get health alerts', async () => {
      const response = await request(app)
        .get('/api/v1/consumer-health/health-alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/consumer-health/food-consumption', () => {
    it('should log food consumption', async () => {
      const response = await request(app)
        .post('/api/v1/consumer-health/food-consumption')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 'test-product-id',
          meal_type: 'lunch',
          quantity_g: 200,
          calories_consumed: 300,
          nutritional_intake: { protein: 15, carbs: 40, fats: 8 },
          notes: 'Healthy meal'
        })
        .expect(201);

      expect(response.body).toHaveProperty('meal_type');
      expect(response.body).toHaveProperty('calories_consumed');
    });
  });

  describe('GET /api/v1/consumer-health/health-analytics', () => {
    it('should get health analytics', async () => {
      const response = await request(app)
        .get('/api/v1/consumer-health/health-analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/consumer-health/bmi', () => {
    it('should calculate BMI', async () => {
      const response = await request(app)
        .get('/api/v1/consumer-health/bmi')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('bmi');
      expect(response.body).toHaveProperty('height_cm');
      expect(response.body).toHaveProperty('weight_kg');
    });
  });
});
