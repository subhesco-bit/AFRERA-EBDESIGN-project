/**
 * Insurance Enhancement Tests
 * Comprehensive tests for Premium Calculation, Policy Issuance, and Fraud Detection
 */

const request = require('supertest');
const { Pool } = require('pg');

describe('Insurance Enhancements', () => {
  let pool;
  let authToken;
  let testUserId;
  let testQuoteId;
  let testPolicyId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });

    const userResult = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ('Insurance Test', 'insurance@example.com', '$2a$10$test', 'farmer')
       RETURNING id`
    );
    testUserId = userResult.rows[0].id;

    const loginResponse = await request('http://localhost:3001')
      .post('/api/v1/auth/login')
      .send({ email: 'insurance@example.com', password: 'password' });
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.end();
  });

  describe('Premium Calculation', () => {
    test('should calculate crop insurance premium', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/v1/insurance/calculate/crop')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cropType: 'rice',
          areaInHectares: 2,
          sumInsuredPerHectare: 50000,
          location: 'Assam',
          season: 'kharif'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grossPremium).toBeDefined();
      expect(response.body.data.netPremium).toBeDefined();
      expect(response.body.data.subsidyRate).toBeDefined();
    });

    test('should calculate transit insurance premium', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/v1/insurance/calculate/transit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shipmentValue: 100000,
          origin: 'Guwahati',
          destination: 'Kolkata',
          transportMode: 'road',
          distance: 1000,
          goodsType: 'general',
          duration: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grossPremium).toBeDefined();
    });

    test('should generate insurance quote', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/v1/insurance/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          insuranceType: 'crop',
          policyholderId: testUserId,
          cropType: 'rice',
          areaInHectares: 1,
          sumInsuredPerHectare: 50000,
          location: 'Assam',
          season: 'kharif'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      testQuoteId = response.body.data.quoteId;
    });
  });

  describe('Policy Issuance', () => {
    test('should issue insurance policy', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/v1/insurance/policies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteId: testQuoteId,
          policyholderId: testUserId,
          insuranceType: 'crop',
          premiumAmount: 2500,
          paymentMethod: 'online',
          paymentReference: 'PAY123',
          startDate: '2026-08-03',
          endDate: '2027-08-03'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      testPolicyId = response.body.data.id;
    });

    test('should get user policies', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/v1/insurance/policies')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.policies)).toBe(true);
    });

    test('should process policy payment', async () => {
      const response = await request('http://localhost:3001')
        .post(`/api/v1/insurance/policies/${testPolicyId}/payments/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 208.33,
          paymentMethod: 'online',
          reference: 'PAY124',
          transactionId: 'TXN123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Fraud Detection', () => {
    test('should analyze claim for fraud', async () => {
      // First create a test claim
      const claimResult = await pool.query(
        `INSERT INTO claims (policy_id, amount, status, incident_date) 
         VALUES ($1, 50000, 'submitted', '2026-08-01')
         RETURNING id`,
        [testPolicyId]
      );
      const claimId = claimResult.rows[0].id;

      const response = await request('http://localhost:3001')
        .post(`/api/v1/insurance/claims/${claimId}/fraud-analysis`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fraudScore).toBeDefined();
      expect(response.body.data.riskLevel).toBeDefined();
    });

    test('should get fraud statistics', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/v1/insurance/fraud/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
