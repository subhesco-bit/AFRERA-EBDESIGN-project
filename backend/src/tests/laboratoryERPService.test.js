/**
 * Laboratory ERP Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { Pool } = require('pg');

describe('Laboratory ERP Service', () => {
  let pool;
  let authToken;
  let testSampleId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });

    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'lab-test@example.com',
        password: 'Test123!@#',
        role: 'admin'
      });

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/v1/laboratory-erp/laboratories', () => {
    it('should register a laboratory', async () => {
      const response = await request(app)
        .post('/api/v1/laboratory-erp/laboratories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lab_code: 'LAB-001',
          lab_name: 'Test Laboratory',
          registration_number: 'REG-001',
          nabl_accredited: true,
          nabl_number: 'NABL-001',
          nabl_expiry_date: '2025-12-31',
          accreditation_type: 'ISO 17025',
          location_id: null,
          contact_person: 'Dr. Test',
          contact_email: 'test@lab.com',
          contact_phone: '+919876543210',
          testing_capabilities: ['soil', 'water', 'food'],
          equipment_list: ['spectrometer', 'microscope']
        })
        .expect(201);

      expect(response.body).toHaveProperty('lab_code');
      expect(response.body).toHaveProperty('lab_name');
      expect(response.body.nabl_accredited).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/laboratory-erp/laboratories')
        .send({
          lab_code: 'LAB-002',
          lab_name: 'Test Lab 2'
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/laboratory-erp/laboratories', () => {
    it('should return all laboratories', async () => {
      const response = await request(app)
        .get('/api/v1/laboratory-erp/laboratories')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/laboratory-erp/test-categories', () => {
    it('should return test categories', async () => {
      const response = await request(app)
        .get('/api/v1/laboratory-erp/test-categories')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/laboratory-erp/test-methods', () => {
    it('should return test methods', async () => {
      const response = await request(app)
        .get('/api/v1/laboratory-erp/test-methods')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return test methods filtered by category', async () => {
      const response = await request(app)
        .get('/api/v1/laboratory-erp/test-methods?category_id=1')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/laboratory-erp/samples', () => {
    it('should register a sample', async () => {
      const response = await request(app)
        .post('/api/v1/laboratory-erp/samples')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          laboratory_id: 'test-lab-id',
          sample_type: 'soil',
          sample_source: 'Test Farm',
          collection_date: '2024-01-15',
          collection_method: 'Core sampling',
          sample_description: 'Test soil sample',
          quantity_g: 500,
          batch_number: 'BATCH-001',
          priority: 'normal',
          requested_tests: [1, 2],
          special_instructions: 'Handle with care'
        })
        .expect(201);

      expect(response.body).toHaveProperty('sample_number');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('received');
      testSampleId = response.body.id;
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/laboratory-erp/samples')
        .send({
          sample_type: 'soil'
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/laboratory-erp/samples', () => {
    it('should return samples for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/laboratory-erp/samples')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/laboratory-erp/test-assignments', () => {
    it('should assign test to analyst', async () => {
      const response = await request(app)
        .post('/api/v1/laboratory-erp/test-assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sample_id: testSampleId,
          test_method_id: 1,
          assigned_to: 'analyst-001'
        })
        .expect(201);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('assigned');
    });
  });

  describe('PUT /api/v1/laboratory-erp/test-assignments/:assignmentId/results', () => {
    it('should update test results', async () => {
      const response = await request(app)
        .put('/api/v1/laboratory-erp/test-assignments/test-assignment-id/results')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          results: { nitrogen: 2.5, phosphorus: 1.8 },
          comments: 'Test completed successfully'
        })
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('POST /api/v1/laboratory-erp/certification-reports', () => {
    it('should generate certification report', async () => {
      const response = await request(app)
        .post('/api/v1/laboratory-erp/certification-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sample_id: testSampleId,
          report_type: 'test_report'
        })
        .expect(201);

      expect(response.body).toHaveProperty('report_number');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('draft');
    });
  });

  describe('POST /api/v1/laboratory-erp/samples/:sampleId/tracking', () => {
    it('should add sample tracking event', async () => {
      const response = await request(app)
        .post(`/api/v1/laboratory-erp/samples/${testSampleId}/tracking`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'testing',
          location: 'Lab Room A',
          handled_by: 'Analyst 1',
          notes: 'Sample received for testing'
        })
        .expect(201);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /api/v1/laboratory-erp/samples/:sampleId/tracking', () => {
    it('should get sample tracking history', async () => {
      const response = await request(app)
        .get(`/api/v1/laboratory-erp/samples/${testSampleId}/tracking`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
