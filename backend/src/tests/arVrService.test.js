/**
 * AR/VR Experience Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { Pool } = require('pg');

describe('AR/VR Experience Service', () => {
  let pool;
  let authToken;
  let testExperienceId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'arvr-test@example.com',
        password: 'Test123!@#',
        role: 'admin'
      });

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/v1/ar-vr/experiences', () => {
    it('should create AR/VR experience', async () => {
      const response = await request(app)
        .post('/api/v1/ar-vr/experiences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          experience_name: 'Product 3D View',
          experience_type: 'ar',
          experience_category: 'product_view',
          description: 'Interactive 3D product visualization',
          target_entity_id: 'product-001',
          target_entity_type: 'product',
          thumbnail_url: '/assets/models/thumbnail.jpg',
          experience_data: { model_url: '/assets/models/test-model.glb' },
          platform_requirements: { mobile: true, webgl: true }
        })
        .expect(201);

      expect(response.body).toHaveProperty('experience_name');
      expect(response.body).toHaveProperty('experience_type');
      expect(response.body.is_published).toBe(false);
      testExperienceId = response.body.id;
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/ar-vr/experiences')
        .send({
          experience_name: 'Test Experience'
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/ar-vr/experiences', () => {
    it('should get experiences', async () => {
      const response = await request(app)
        .get('/api/v1/ar-vr/experiences')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should filter by experience type', async () => {
      const response = await request(app)
        .get('/api/v1/ar-vr/experiences?experience_type=ar')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('PATCH /api/v1/ar-vr/experiences/:experienceId/publish', () => {
    it('should publish experience', async () => {
      const response = await request(app)
        .patch(`/api/v1/ar-vr/experiences/${testExperienceId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.is_published).toBe(true);
    });
  });

  describe('POST /api/v1/ar-vr/assets', () => {
    it('should create 3D asset', async () => {
      const response = await request(app)
        .post('/api/v1/ar-vr/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset_name: 'Product Model',
          asset_type: 'model',
          asset_format: 'glb',
          file_url: '/assets/models/test-model.glb',
          file_size_bytes: 5242880,
          thumbnail_url: '/assets/models/thumbnail.jpg',
          metadata: { vertices: 10000, faces: 20000 }
        })
        .expect(201);

      expect(response.body).toHaveProperty('asset_name');
      expect(response.body).toHaveProperty('asset_type');
    });
  });

  describe('GET /api/v1/ar-vr/assets', () => {
    it('should get assets', async () => {
      const response = await request(app)
        .get('/api/v1/ar-vr/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/ar-vr/interaction-points', () => {
    it('should create interaction point', async () => {
      const response = await request(app)
        .post('/api/v1/ar-vr/interaction-points')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          experience_id: testExperienceId,
          point_name: 'Product Info Hotspot',
          point_type: 'hotspot',
          position_x: 0.5,
          position_y: 0.5,
          position_z: 0,
          interaction_data: { title: 'Product Details', content: 'View detailed information' }
        })
        .expect(201);

      expect(response.body).toHaveProperty('point_name');
      expect(response.body).toHaveProperty('point_type');
    });
  });

  describe('GET /api/v1/ar-vr/experiences/:experienceId/interaction-points', () => {
    it('should get interaction points', async () => {
      const response = await request(app)
        .get(`/api/v1/ar-vr/experiences/${testExperienceId}/interaction-points`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/ar-vr/sessions', () => {
    it('should create AR/VR session', async () => {
      const response = await request(app)
        .post('/api/v1/ar-vr/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          experience_id: testExperienceId,
          session_type: 'ar',
          device_type: 'mobile',
          session_data: { device_model: 'iPhone 14' }
        })
        .expect(201);

      expect(response.body).toHaveProperty('session_type');
      expect(response.body).toHaveProperty('device_type');
    });
  });

  describe('PATCH /api/v1/ar-vr/sessions/:sessionId/end', () => {
    it('should end session', async () => {
      const response = await request(app)
        .patch('/api/v1/ar-vr/sessions/test-session-id/end')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interaction_count: 5
        })
        .expect(200);

      expect(response.body).toHaveProperty('ended_at');
    });
  });

  describe('POST /api/v1/ar-vr/ar-vr-analytics', () => {
    it('should record AR/VR analytics', async () => {
      const response = await request(app)
        .post('/api/v1/ar-vr/ar-vr-analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          metrics: {
            total_sessions: 50,
            unique_users: 35,
            avg_duration: 180,
            total_interactions: 250,
            most_viewed_experiences: { 'exp1': 20, 'exp2': 15 },
            device_distribution: { mobile: 30, headset: 15, desktop: 5 }
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('total_sessions');
    });
  });
});
