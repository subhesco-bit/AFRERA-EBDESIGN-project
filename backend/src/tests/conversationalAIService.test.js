/**
 * Conversational AI Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { createTestUserToken, unwrap } = require('./helpers/testAuth');
const { Pool } = require('pg');

describe('Conversational AI Service', () => {
  let pool;
  let authToken;
  let testSessionId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    });

    // Create test user and get auth token

    ({ token: authToken } = await createTestUserToken(pool, { email: 'chat-test@example.com', role: 'consumer' }));
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/v1/conversational-ai/domains', () => {
    it('should return all conversation domains', async () => {
      const response = await request(app)
        .get('/api/v1/conversational-ai/domains')
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Array);
      expect(unwrap(response).length).toBeGreaterThan(0);
      expect(unwrap(response)[0]).toHaveProperty('name');
      expect(unwrap(response)[0]).toHaveProperty('description');
    });
  });

  describe('POST /api/v1/conversational-ai/sessions', () => {
    it('should create a conversation session', async () => {
      const response = await request(app)
        .post('/api/v1/conversational-ai/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          domain_id: 1,
          language: 'en',
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('session_id');
      expect(unwrap(response)).toHaveProperty('status');
      expect(unwrap(response).status).toBe('active');
      testSessionId = unwrap(response).session_id;
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/conversational-ai/sessions')
        .send({
          domain_id: 1,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/conversational-ai/sessions/:sessionId', () => {
    it('should get conversation session', async () => {
      const response = await request(app)
        .get(`/api/v1/conversational-ai/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toHaveProperty('session_id');
      expect(unwrap(response)).toHaveProperty('domain_name');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/v1/conversational-ai/sessions/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/conversational-ai/sessions/:sessionId/messages', () => {
    it('should add message to conversation', async () => {
      const response = await request(app)
        .post(`/api/v1/conversational-ai/sessions/${testSessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'user',
          content: 'Hello, I need help with products',
          content_type: 'text',
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('role');
      expect(unwrap(response)).toHaveProperty('content');
      expect(unwrap(response)).toHaveProperty('intent_detected');
    });
  });

  describe('GET /api/v1/conversational-ai/sessions/:sessionId/messages', () => {
    it('should get conversation messages', async () => {
      const response = await request(app)
        .get(`/api/v1/conversational-ai/sessions/${testSessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Array);
      expect(unwrap(response).length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/conversational-ai/detect-intent', () => {
    it('should detect intent from message', async () => {
      const response = await request(app)
        .post('/api/v1/conversational-ai/detect-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'I want to search for products',
        })
        .expect(200);

      expect(unwrap(response)).toHaveProperty('intent');
      expect(unwrap(response)).toHaveProperty('confidence');
      expect(unwrap(response).confidence).toBeGreaterThan(0);
    });

    it('should detect greeting intent', async () => {
      const response = await request(app)
        .post('/api/v1/conversational-ai/detect-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Hello there!',
        })
        .expect(200);

      expect(unwrap(response).intent).toBe('greeting');
    });
  });

  describe('POST /api/v1/conversational-ai/sessions/:sessionId/respond', () => {
    it('should generate AI response', async () => {
      const response = await request(app)
        .post(`/api/v1/conversational-ai/sessions/${testSessionId}/respond`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What can you help me with?',
        })
        .expect(200);

      expect(unwrap(response)).toHaveProperty('content');
      expect(unwrap(response)).toHaveProperty('intent');
      expect(unwrap(response)).toHaveProperty('confidence');
    });
  });

  describe('POST /api/v1/conversational-ai/sessions/:sessionId/context', () => {
    it('should set conversation context', async () => {
      const response = await request(app)
        .post(`/api/v1/conversational-ai/sessions/${testSessionId}/context`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          context_key: 'user_preference',
          context_value: { category: 'organic' },
        })
        .expect(200);

      expect(unwrap(response)).toHaveProperty('context_key');
      expect(unwrap(response)).toHaveProperty('context_value');
    });
  });

  describe('GET /api/v1/conversational-ai/sessions/:sessionId/context', () => {
    it('should get conversation context', async () => {
      const response = await request(app)
        .get(`/api/v1/conversational-ai/sessions/${testSessionId}/context`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Object);
    });

    it('should get specific context key', async () => {
      const response = await request(app)
        .get(`/api/v1/conversational-ai/sessions/${testSessionId}/context?context_key=user_preference`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toHaveProperty('context_key');
    });
  });

  describe('POST /api/v1/conversational-ai/sessions/:sessionId/end', () => {
    it('should end conversation session', async () => {
      const response = await request(app)
        .post(`/api/v1/conversational-ai/sessions/${testSessionId}/end`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resolution_status: 'resolved',
          user_satisfaction: 5,
        })
        .expect(200);

      expect(unwrap(response)).toHaveProperty('success');
    });
  });
});
