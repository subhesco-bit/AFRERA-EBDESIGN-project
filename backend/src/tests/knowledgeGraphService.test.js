/**
 * Knowledge Graph Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { Pool } = require('pg');

describe('Knowledge Graph Service', () => {
  let pool;
  let authToken;
  let testNodeId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    });

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'kg-test@example.com',
        password: 'Test123!@#',
        role: 'admin'
      });

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/v1/knowledge-graph/knowledge-nodes', () => {
    it('should create knowledge node', async () => {
      const response = await request(app)
        .post('/api/v1/knowledge-graph/knowledge-nodes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          node_type: 'product',
          external_id: 'PROD-001',
          name: 'Basmati Rice',
          description: 'Premium long-grain rice',
          properties: { variety: 'Basmati', origin: 'India' },
          source_system: 'products',
          confidence_score: 0.95
        })
        .expect(201);

      expect(response.body).toHaveProperty('node_type');
      expect(response.body).toHaveProperty('name');
      testNodeId = response.body.id;
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/knowledge-graph/knowledge-nodes')
        .send({
          node_type: 'product',
          name: 'Test Node'
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/knowledge-graph/knowledge-nodes/search', () => {
    it('should search knowledge nodes', async () => {
      const response = await request(app)
        .get('/api/v1/knowledge-graph/knowledge-nodes/search?q=rice')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return 400 without query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/knowledge-graph/knowledge-nodes/search')
        .expect(400);
    });
  });

  describe('POST /api/v1/knowledge-graph/relationships', () => {
    it('should create relationship', async () => {
      const response = await request(app)
        .post('/api/v1/knowledge-graph/relationships')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source_node_id: testNodeId,
          target_node_id: testNodeId,
          relationship_type: 'related_to',
          relationship_properties: { strength: 0.8 },
          confidence_score: 0.9,
          source: 'manual'
        })
        .expect(201);

      expect(response.body).toHaveProperty('relationship_type');
      expect(response.body).toHaveProperty('source_node_id');
    });
  });

  describe('GET /api/v1/knowledge-graph/knowledge-nodes/:nodeId/related', () => {
    it('should find related nodes', async () => {
      const response = await request(app)
        .get(`/api/v1/knowledge-graph/knowledge-nodes/${testNodeId}/related`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/knowledge-graph/graph-queries', () => {
    it('should create graph query', async () => {
      const response = await request(app)
        .post('/api/v1/knowledge-graph/graph-queries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query_name: 'Find Related Products',
          query_type: 'neighbor',
          query_definition: { max_depth: 2 },
          parameters: { node_id: 'required' },
          description: 'Find products related to a given node'
        })
        .expect(201);

      expect(response.body).toHaveProperty('query_name');
      expect(response.body).toHaveProperty('query_type');
    });
  });

  describe('POST /api/v1/knowledge-graph/graph-queries/:queryId/execute', () => {
    it('should execute graph query', async () => {
      const response = await request(app)
        .post('/api/v1/knowledge-graph/graph-queries/test-query-id/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          node_id: testNodeId,
          relationship_type: 'related_to'
        })
        .expect(200);

      expect(response.body).toHaveProperty('execution_time_ms');
      expect(response.body).toHaveProperty('result');
    });
  });

  describe('POST /api/v1/knowledge-graph/knowledge-analytics', () => {
    it('should record knowledge analytics', async () => {
      const response = await request(app)
        .post('/api/v1/knowledge-graph/knowledge-analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          metrics: {
            total_nodes: 100,
            total_relationships: 250,
            total_queries: 50,
            avg_query_time: 150,
            unique_users: 20,
            most_queried_types: { product: 30, farmer: 15 }
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('total_nodes');
    });
  });
});
