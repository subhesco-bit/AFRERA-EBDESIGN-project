/**
 * Multilingual Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { createTestUserToken, unwrap } = require('./helpers/testAuth');
const { Pool } = require('pg');

describe('Multilingual Service', () => {
  let pool;
  let authToken;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    });

    // Create test user and get auth token

    ({ token: authToken } = await createTestUserToken(pool, { email: 'test@example.com', role: 'consumer' }));
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/v1/multilingual/languages', () => {
    it('should return all available languages', async () => {
      const response = await request(app)
        .get('/api/v1/multilingual/languages')
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Array);
      expect(unwrap(response).length).toBeGreaterThan(0);
      expect(unwrap(response)[0]).toHaveProperty('iso_code');
      expect(unwrap(response)[0]).toHaveProperty('name');
      expect(unwrap(response)[0]).toHaveProperty('native_name');
    });
  });

  describe('POST /api/v1/multilingual/detect', () => {
    it('should detect English text', async () => {
      const response = await request(app)
        .post('/api/v1/multilingual/detect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Hello, this is a test message in English',
        })
        .expect(200);

      expect(unwrap(response)).toHaveProperty('language_id');
      expect(unwrap(response)).toHaveProperty('iso_code');
      expect(unwrap(response)).toHaveProperty('confidence');
      expect(unwrap(response).iso_code).toBe('en');
    });

    it('should detect Hindi text (Devanagari script)', async () => {
      const response = await request(app)
        .post('/api/v1/multilingual/detect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'नमस्ते, यह एक परीक्षण संदेश है',
        })
        .expect(200);

      expect(unwrap(response)).toHaveProperty('iso_code');
      expect(unwrap(response).iso_code).toBe('hi');
    });

    it('should return 400 for empty text', async () => {
      const response = await request(app)
        .post('/api/v1/multilingual/detect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: '',
        })
        .expect(400);

      expect(unwrap(response)).toHaveProperty('error');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/multilingual/detect')
        .send({
          text: 'Test message',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/multilingual/translate', () => {
    it('should translate text from English to Hindi', async () => {
      const response = await request(app)
        .post('/api/v1/multilingual/translate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Hello',
          source_language: 'en',
          target_language: 'hi',
        })
        .expect(200);

      expect(unwrap(response)).toHaveProperty('translated_text');
      expect(unwrap(response)).toHaveProperty('source_language');
      expect(unwrap(response)).toHaveProperty('target_language');
      expect(unwrap(response)).toHaveProperty('confidence');
      expect(unwrap(response).source_language).toBe('en');
      expect(unwrap(response).target_language).toBe('hi');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/multilingual/translate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Hello',
        })
        .expect(400);

      expect(unwrap(response)).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/multilingual/preferences', () => {
    it('should return user language preferences', async () => {
      const response = await request(app)
        .get('/api/v1/multilingual/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toHaveProperty('user_id');
      expect(unwrap(response)).toHaveProperty('primary_language_id');
      expect(unwrap(response)).toHaveProperty('auto_detect_language');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/v1/multilingual/preferences')
        .expect(401);
    });
  });

  describe('PUT /api/v1/multilingual/preferences', () => {
    it('should update user language preferences', async () => {
      const response = await request(app)
        .put('/api/v1/multilingual/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          primary_language: 'hi',
          auto_detect_language: true,
          auto_translate_content: false,
        })
        .expect(200);

      expect(unwrap(response)).toHaveProperty('primary_language_id');
      expect(unwrap(response).auto_detect_language).toBe(true);
    });
  });

  describe('POST /api/v1/multilingual/content', () => {
    it('should save content translation', async () => {
      const response = await request(app)
        .post('/api/v1/multilingual/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content_key: 'product.name.123',
          entity_type: 'product',
          entity_id: null,
          language_code: 'hi',
          translated_text: 'उत्पाद नाम',
          context: 'Product name translation',
        })
        .expect(200);

      expect(unwrap(response)).toHaveProperty('content_key');
      expect(unwrap(response)).toHaveProperty('translated_text');
      expect(unwrap(response).translated_text).toBe('उत्पाद नाम');
    });
  });

  describe('GET /api/v1/multilingual/content/:key', () => {
    it('should get content translation', async () => {
      const response = await request(app)
        .get('/api/v1/multilingual/content/product.name.123?language=hi')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toHaveProperty('content_key');
      expect(unwrap(response)).toHaveProperty('translated_text');
    });

    it('should return 404 for non-existent translation', async () => {
      const response = await request(app)
        .get('/api/v1/multilingual/content/nonexistent.key?language=hi')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/multilingual/memory/stats', () => {
    it('should return translation memory statistics', async () => {
      const response = await request(app)
        .get('/api/v1/multilingual/memory/stats')
        .expect(200);

      expect(unwrap(response)).toHaveProperty('total_entries');
      expect(unwrap(response)).toHaveProperty('verified_entries');
      expect(unwrap(response)).toHaveProperty('auto_translated_entries');
      expect(unwrap(response)).toHaveProperty('avg_confidence');
      expect(unwrap(response)).toHaveProperty('total_usage');
    });
  });
});
