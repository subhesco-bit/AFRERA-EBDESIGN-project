/**
 * Blockchain Traceability Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { Pool } = require('pg');

describe('Blockchain Traceability Service', () => {
  let pool;
  let authToken;
  let testTransactionHash;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'blockchain-test@example.com',
        password: 'Test123!@#',
        role: 'admin'
      });

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/v1/blockchain-traceability/blockchain-transactions', () => {
    it('should record blockchain transaction', async () => {
      testTransactionHash = '0x' + 'a'.repeat(64);
      
      const response = await request(app)
        .post('/api/v1/blockchain-traceability/blockchain-transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transaction_hash: testTransactionHash,
          block_number: 12345,
          block_hash: '0x' + 'b'.repeat(64),
          transaction_index: 0,
          from_address: '0x' + 'c'.repeat(40),
          to_address: '0x' + 'd'.repeat(40),
          gas_used: 21000,
          gas_price: 5000000000,
          status: 'confirmed',
          metadata: {}
        })
        .expect(201);

      expect(response.body).toHaveProperty('transaction_hash');
      expect(response.body.status).toBe('confirmed');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain-traceability/blockchain-transactions')
        .send({
          transaction_hash: '0x' + 'a'.repeat(64)
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/blockchain-traceability/blockchain-transactions/:hash', () => {
    it('should get blockchain transaction', async () => {
      const response = await request(app)
        .get(`/api/v1/blockchain-traceability/blockchain-transactions/${testTransactionHash}`)
        .expect(200);

      expect(response.body).toHaveProperty('transaction_hash');
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain-traceability/blockchain-transactions/0x' + 'z'.repeat(64))
        .expect(404);
    });
  });

  describe('POST /api/v1/blockchain-traceability/traceability-events', () => {
    it('should record traceability event', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain-traceability/traceability-events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 'test-product-id',
          batch_number: 'BATCH-001',
          event_type: 'harvest',
          location_id: null,
          actor_type: 'farmer',
          transaction_hash: testTransactionHash,
          event_data: { temperature: 25, humidity: 60 },
          ipfs_hash: 'Qm' + 'a'.repeat(44)
        })
        .expect(201);

      expect(response.body).toHaveProperty('event_type');
      expect(response.body.is_verified).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain-traceability/traceability-events')
        .send({
          event_type: 'harvest'
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/blockchain-traceability/traceability-events/:productId', () => {
    it('should get traceability events', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain-traceability/traceability-events/test-product-id')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/blockchain-traceability/chain-of-custody', () => {
    it('should record chain of custody', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain-traceability/chain-of-custody')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 'test-product-id',
          batch_number: 'BATCH-001',
          current_holder_id: 'holder-001',
          holder_type: 'processor',
          from_holder_id: 'farmer-001',
          transaction_hash: testTransactionHash,
          transfer_document_url: null
        })
        .expect(201);

      expect(response.body).toHaveProperty('holder_type');
      expect(response.body.is_verified).toBe(true);
    });
  });

  describe('GET /api/v1/blockchain-traceability/chain-of-custody/verify/:productId', () => {
    it('should verify chain of custody', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain-traceability/chain-of-custody/verify/test-product-id')
        .expect(200);

      expect(response.body).toHaveProperty('is_complete');
      expect(response.body).toHaveProperty('chain');
    });
  });

  describe('POST /api/v1/blockchain-traceability/blockchain-certificates', () => {
    it('should issue blockchain certificate', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain-traceability/blockchain-certificates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          certificate_type: 'organic',
          certificate_number: 'CERT-2024-001',
          product_id: 'test-product-id',
          batch_number: 'BATCH-001',
          issuer_name: 'Organic Certification Authority',
          issue_date: '2024-01-15',
          expiry_date: '2025-01-15',
          certificate_data: { standard: 'NPOP', level: 'Level 1' },
          transaction_hash: testTransactionHash,
          ipfs_hash: 'Qm' + 'b'.repeat(44)
        })
        .expect(201);

      expect(response.body).toHaveProperty('certificate_number');
      expect(response.body.is_revoked).toBe(false);
    });
  });

  describe('GET /api/v1/blockchain-traceability/blockchain-certificates/verify/:certificateNumber', () => {
    it('should verify blockchain certificate', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain-traceability/blockchain-certificates/verify/CERT-2024-001')
        .expect(200);

      expect(response.body).toHaveProperty('certificate_type');
    });

    it('should return 404 for non-existent certificate', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain-traceability/blockchain-certificates/verify/NONEXISTENT')
        .expect(404);
    });
  });

  describe('POST /api/v1/blockchain-traceability/verification-requests', () => {
    it('should create verification request', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain-traceability/verification-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 'test-product-id',
          batch_number: 'BATCH-001',
          request_type: 'traceability'
        })
        .expect(201);

      expect(response.body).toHaveProperty('request_type');
      expect(response.body.verification_status).toBe('pending');
    });
  });

  describe('POST /api/v1/blockchain-traceability/blockchain-analytics', () => {
    it('should record blockchain analytics', async () => {
      const response = await request(app)
        .post('/api/v1/blockchain-traceability/blockchain-analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          metrics: {
            total_transactions: 100,
            confirmed_transactions: 95,
            failed_transactions: 5,
            total_gas_used: 2100000,
            average_gas_price: 5000000000,
            total_traceability_events: 50,
            total_certificates_issued: 10,
            unique_products_tracked: 25
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('total_transactions');
    });
  });
});
