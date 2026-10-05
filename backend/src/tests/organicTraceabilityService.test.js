/**
 * Organic Traceability Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { createTestUserToken, unwrap } = require('./helpers/testAuth');
const { Pool } = require('pg');

describe('Organic Traceability Service', () => {
  let pool;
  let authToken;
  let testFarmId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    });

    // Create test user and get auth token

    ({ token: authToken } = await createTestUserToken(pool, { email: 'organic-test@example.com', role: 'farmer' }));
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/v1/organic-traceability/standards', () => {
    it('should return all organic standards', async () => {
      const response = await request(app)
        .get('/api/v1/organic-traceability/standards')
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Array);
      expect(unwrap(response).length).toBeGreaterThan(0);
      expect(unwrap(response)[0]).toHaveProperty('code');
      expect(unwrap(response)[0]).toHaveProperty('name');
    });
  });

  describe('POST /api/v1/organic-traceability/farms', () => {
    it('should register an organic farm', async () => {
      const response = await request(app)
        .post('/api/v1/organic-traceability/farms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          farm_name: 'Test Organic Farm',
          certification_standard_id: 1,
          total_area_hectares: 10.5,
          organic_area_hectares: 5.0,
          in_conversion_area_hectares: 5.5,
          location_id: null,
          gps_coordinates: { lat: 26.1445, lng: 91.7362 },
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('farm_id');
      expect(unwrap(response)).toHaveProperty('farm_name');
      expect(unwrap(response)).toHaveProperty('certification_status');
      expect(unwrap(response).certification_status).toBe('pending');
      testFarmId = unwrap(response).id;
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/organic-traceability/farms')
        .send({
          farm_name: 'Test Farm',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/organic-traceability/farms', () => {
    it('should return organic farms for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/organic-traceability/farms')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/organic-traceability/plots', () => {
    it('should add an organic plot', async () => {
      const response = await request(app)
        .post('/api/v1/organic-traceability/plots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organic_farm_id: testFarmId,
          plot_number: 'PLOT-001',
          plot_name: 'North Field',
          area_hectares: 2.5,
          certification_status: 'certified',
          gps_boundary: null,
          soil_type: 'Loamy',
          irrigation_type: 'Drip',
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('plot_number');
      expect(unwrap(response)).toHaveProperty('area_hectares');
    });
  });

  describe('POST /api/v1/organic-traceability/crops', () => {
    it('should record an organic crop', async () => {
      const response = await request(app)
        .post('/api/v1/organic-traceability/crops')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organic_plot_id: testFarmId,
          crop_name: 'Organic Rice',
          variety: 'Basmati',
          planting_date: '2024-01-15',
          expected_harvest_date: '2024-06-15',
          area_hectares: 2.0,
          expected_yield_kg_per_hectare: 4000,
          seed_source: 'Certified Organic Seeds',
          seed_lot_number: 'SEED-001',
          cultivation_practices: {},
          pest_management_practices: {},
          soil_management_practices: {},
          water_management_practices: {},
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('crop_name');
      expect(unwrap(response)).toHaveProperty('status');
      expect(unwrap(response).status).toBe('growing');
    });
  });

  describe('POST /api/v1/organic-traceability/harvests', () => {
    it('should record a harvest', async () => {
      const response = await request(app)
        .post('/api/v1/organic-traceability/harvests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organic_crop_id: testFarmId,
          harvest_date: '2024-06-15',
          total_quantity_kg: 8000,
          grade: 'A',
          moisture_content: 12.5,
          quality_parameters: {},
          harvested_by: 'Test Farmer',
          storage_location: 'Warehouse A',
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('harvest_number');
      expect(unwrap(response)).toHaveProperty('batch_number');
    });
  });

  describe('POST /api/v1/organic-traceability/chain-of-custody', () => {
    it('should record chain of custody transfer', async () => {
      const response = await request(app)
        .post('/api/v1/organic-traceability/chain-of-custody')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: testFarmId,
          lot_number: 'LOT-001',
          current_holder_type: 'processor',
          current_holder_id: testFarmId,
          custody_transfer_date: '2024-06-20',
          transfer_from_type: 'farmer',
          transfer_from_id: testFarmId,
          quantity_kg: 8000,
          document_reference: 'DOC-001',
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('lot_number');
      expect(unwrap(response)).toHaveProperty('current_holder_type');
    });
  });

  describe('POST /api/v1/organic-traceability/consumer-transparency', () => {
    it('should save consumer transparency data', async () => {
      const response = await request(app)
        .post('/api/v1/organic-traceability/consumer-transparency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: testFarmId,
          lot_number: 'LOT-001',
          qr_code: 'QR-TEST-001',
          farmer_name: 'Test Farmer',
          farm_location: 'Assam, India',
          farm_certification_number: 'CERT-001',
          harvest_date: '2024-06-15',
          processing_facility: 'Organic Processing Unit',
          processing_date: '2024-06-18',
          packaging_date: '2024-06-19',
          ingredients: [],
          nutritional_info: {},
          organic_certification_details: {},
          chain_of_custody_summary: [],
          quality_test_results: {},
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('qr_code');
    });
  });

  describe('GET /api/v1/organic-traceability/consumer-transparency/qr/:qrCode', () => {
    it('should get consumer transparency by QR code', async () => {
      const response = await request(app)
        .get('/api/v1/organic-traceability/consumer-transparency/qr/QR-TEST-001')
        .expect(200);

      expect(unwrap(response)).toHaveProperty('qr_code');
      expect(unwrap(response)).toHaveProperty('farmer_name');
    });

    it('should return 404 for non-existent QR code', async () => {
      const response = await request(app)
        .get('/api/v1/organic-traceability/consumer-transparency/qr/NONEXISTENT')
        .expect(404);
    });
  });

  describe('POST /api/v1/organic-traceability/fraud-alerts', () => {
    it('should report organic fraud', async () => {
      const response = await request(app)
        .post('/api/v1/organic-traceability/fraud-alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          alert_type: 'fake_certificate',
          severity: 'high',
          entity_type: 'farm',
          entity_id: testFarmId,
          description: 'Suspicious certificate detected',
          evidence: {},
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('alert_type');
      expect(unwrap(response)).toHaveProperty('severity');
      expect(unwrap(response)).toHaveProperty('investigation_status');
    });
  });
});
