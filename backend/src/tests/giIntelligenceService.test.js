/**
 * GI Intelligence Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { Pool } = require('pg');

describe('GI Intelligence Service', () => {
  let pool;
  let authToken;
  let testGIProductId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'gi-test@example.com',
        password: 'Test123!@#',
        role: 'admin'
      });

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/v1/gi-intelligence/gi-products', () => {
    it('should register a GI product', async () => {
      const response = await request(app)
        .post('/api/v1/gi-intelligence/gi-products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 'test-product-id',
          gi_name: 'Assam Tea',
          gi_registration_number: 'GI-ASSAM-TEA-001',
          registration_date: '2020-01-15',
          geographical_region: 'Assam',
          state: 'Assam',
          gi_authority: 'Geographical Indications Registry',
          gi_category: 'agricultural',
          description: 'Premium tea from Assam region',
          historical_significance: 'Historically cultivated since British era',
          unique_characteristics: ['Malty flavor', 'Bright color', 'Strong aroma'],
          production_methods: ['Traditional orthodox', 'CTC'],
          quality_standards: { moisture: 'max 8%', ash: 'max 5%' }
        })
        .expect(201);

      expect(response.body).toHaveProperty('gi_name');
      expect(response.body).toHaveProperty('gi_registration_number');
      testGIProductId = response.body.id;
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/gi-intelligence/gi-products')
        .send({
          gi_name: 'Test GI'
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/gi-intelligence/gi-products', () => {
    it('should return all GI products', async () => {
      const response = await request(app)
        .get('/api/v1/gi-intelligence/gi-products')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return GI products filtered by state', async () => {
      const response = await request(app)
        .get('/api/v1/gi-intelligence/gi-products?state=Assam')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/gi-intelligence/gi-producers', () => {
    it('should register a GI producer', async () => {
      const response = await request(app)
        .post('/api/v1/gi-intelligence/gi-producers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gi_product_id: testGIProductId,
          producer_id: 'test-producer-id',
          farmer_id: 'test-farmer-id',
          production_location_id: null,
          certified_area_hectares: 50,
          annual_production_tonnes: 100
        })
        .expect(201);

      expect(response.body).toHaveProperty('registration_number');
      expect(response.body.certification_status).toBe('active');
    });
  });

  describe('GET /api/v1/gi-intelligence/gi-products/:giProductId/producers', () => {
    it('should get GI producers for a product', async () => {
      const response = await request(app)
        .get(`/api/v1/gi-intelligence/gi-products/${testGIProductId}/producers`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/gi-intelligence/gi-pricing', () => {
    it('should calculate GI premium pricing', async () => {
      const response = await request(app)
        .post('/api/v1/gi-intelligence/gi-pricing')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 'test-product-id',
          base_price: 100,
          gi_product_id: testGIProductId
        })
        .expect(200);

      expect(response.body).toHaveProperty('base_price');
      expect(response.body).toHaveProperty('gi_premium');
      expect(response.body).toHaveProperty('final_price');
      expect(response.body).toHaveProperty('premium_percentage');
      expect(response.body.final_price).toBeGreaterThan(response.body.base_price);
    });
  });

  describe('POST /api/v1/gi-intelligence/gi-authentication', () => {
    it('should authenticate GI product', async () => {
      const response = await request(app)
        .post('/api/v1/gi-intelligence/gi-authentication')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 'test-product-id',
          batch_number: 'BATCH-001',
          producer_id: 'test-producer-id'
        })
        .expect(201);

      expect(response.body).toHaveProperty('authentication_code');
      expect(response.body.authentication_status).toBe('verified');
    });
  });

  describe('GET /api/v1/gi-intelligence/gi-authentication/verify/:authCode', () => {
    it('should verify GI authentication code', async () => {
      const response = await request(app)
        .get('/api/v1/gi-intelligence/gi-authentication/verify/INVALID-CODE')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/gi-intelligence/gi-marketplace', () => {
    it('should create GI marketplace listing', async () => {
      const response = await request(app)
        .post('/api/v1/gi-intelligence/gi-marketplace')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gi_product_id: testGIProductId,
          product_id: 'test-product-id',
          listing_title: 'Premium Assam Tea',
          description: 'High quality GI certified tea',
          available_quantity: 500,
          unit: 'kg',
          price_per_unit: 200,
          quality_tier: 'premium',
          harvest_date: '2024-01-15',
          location_id: null
        })
        .expect(201);

      expect(response.body).toHaveProperty('listing_title');
      expect(response.body.is_premium_priced).toBe(true);
    });
  });

  describe('GET /api/v1/gi-intelligence/gi-marketplace', () => {
    it('should get GI marketplace listings', async () => {
      const response = await request(app)
        .get('/api/v1/gi-intelligence/gi-marketplace')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/gi-intelligence/gi-analytics', () => {
    it('should record GI analytics', async () => {
      const response = await request(app)
        .post('/api/v1/gi-intelligence/gi-analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gi_product_id: testGIProductId,
          metrics: {
            views: 100,
            searches: 50,
            authentications: 10,
            sales: 5000,
            quantity_sold: 25,
            avg_premium: 18.5,
            unique_consumers: 30
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('total_views');
    });
  });

  describe('GET /api/v1/gi-intelligence/gi-analytics/:giProductId', () => {
    it('should get GI analytics', async () => {
      const response = await request(app)
        .get(`/api/v1/gi-intelligence/gi-analytics/${testGIProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
