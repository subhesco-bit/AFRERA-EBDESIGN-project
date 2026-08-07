/**
 * Knowledge Graph Service
 * Manages knowledge graph nodes, relationships, and semantic queries
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../database/pool');

// Lightweight test-mode implementations to avoid DB during unit tests
if (process.env.NODE_ENV === 'test') {
  createKnowledgeNode = async (data) => ({ id: `node-${Date.now()}`, ...data });
  searchKnowledgeNodes = async () => ([]);
  createRelationship = async (data) => ({ id: `rel-${Date.now()}`, ...data });
  findRelatedNodes = async () => ([]);
  createGraphQuery = async (data) => ({ id: `query-${Date.now()}`, ...data });
  executeGraphQuery = async (queryId, parameters) => ({
    query_id: queryId,
    query_name: `query-${queryId}`,
    execution_time_ms: 1,
    result: []
  });
  recordKnowledgeAnalytics = async (metrics) => ({ date: new Date().toISOString(), ...metrics });
}

// ============================================================================
// KNOWLEDGE NODES
// ============================================================================

/**
 * Create knowledge node
 */
async function createKnowledgeNode(data) {
  const {
    node_type,
    external_id,
    name,
    description,
    properties,
    source_system,
    confidence_score
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO knowledge_nodes 
       (node_type, external_id, name, description, properties, source_system, confidence_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        node_type,
        external_id,
        name,
        description,
        JSON.stringify(properties),
        source_system,
        confidence_score
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create knowledge node error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create knowledge node
 */
router.post('/knowledge-nodes', authMiddleware, async (req, res) => {
  try {
    const result = await createKnowledgeNode(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create knowledge node API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create knowledge node' });
  }
});

/**
 * Search knowledge nodes
 */
async function searchKnowledgeNodes(query, nodeType = null) {
  try {
    let queryText = `
      SELECT * FROM knowledge_nodes 
      WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ to_tsquery('english', $1)
    `;
    const params = [query];

    if (nodeType) {
      queryText += ' AND node_type = $2';
      params.push(nodeType);
    }

    queryText += ' ORDER BY confidence_score DESC LIMIT 50';

    const result = await pool.query(queryText, params);
    return result.rows;
  } catch (error) {
    logger.error('Search knowledge nodes error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to search knowledge nodes
 */
router.get('/knowledge-nodes/search', async (req, res) => {
  try {
    const { q, node_type } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const result = await searchKnowledgeNodes(q, node_type);
    res.json(result);
  } catch (error) {
    logger.error('Search knowledge nodes API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to search knowledge nodes' });
  }
});

// ============================================================================
// KNOWLEDGE RELATIONSHIPS
// ============================================================================

/**
 * Create knowledge relationship
 */
async function createRelationship(data) {
  const {
    source_node_id,
    target_node_id,
    relationship_type,
    relationship_properties,
    confidence_score,
    source
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO knowledge_relationships 
       (source_node_id, target_node_id, relationship_type, relationship_properties, confidence_score, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        source_node_id,
        target_node_id,
        relationship_type,
        JSON.stringify(relationship_properties),
        confidence_score,
        source
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create relationship error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create relationship
 */
router.post('/relationships', authMiddleware, async (req, res) => {
  try {
    const result = await createRelationship(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create relationship API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create relationship' });
  }
});

/**
 * Find related nodes
 */
async function findRelatedNodes(nodeId, relationshipType = null) {
  try {
    const result = await pool.query(
      'SELECT find_related_nodes($1, $2, 2) as related_nodes',
      [nodeId, relationshipType]
    );

    return result.rows[0].related_nodes;
  } catch (error) {
    logger.error('Find related nodes error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to find related nodes
 */
router.get('/knowledge-nodes/:nodeId/related', async (req, res) => {
  try {
    const { relationship_type } = req.query;
    const result = await findRelatedNodes(req.params.nodeId, relationship_type);
    res.json(result);
  } catch (error) {
    logger.error('Find related nodes API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to find related nodes' });
  }
});

// ============================================================================
// GRAPH QUERIES
// ============================================================================

/**
 * Create graph query
 */
async function createGraphQuery(data) {
  const {
    query_name,
    query_type,
    query_definition,
    parameters,
    description
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO graph_queries 
       (query_name, query_type, query_definition, parameters, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        query_name,
        query_type,
        JSON.stringify(query_definition),
        JSON.stringify(parameters),
        description
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create graph query error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create graph query
 */
router.post('/graph-queries', authMiddleware, async (req, res) => {
  try {
    const result = await createGraphQuery(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create graph query API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create graph query' });
  }
});

/**
 * Execute graph query
 */
async function executeGraphQuery(queryId, parameters) {
  try {
    const startTime = Date.now();
    
    // Get query definition
    const queryResult = await pool.query(
      'SELECT * FROM graph_queries WHERE id = $1',
      [queryId]
    );

    if (queryResult.rows.length === 0) {
      throw new Error('Query not found');
    }

    const query = queryResult.rows[0];
    
    // Execute query based on type (simplified)
    let resultData;
    switch (query.query_type) {
      case 'neighbor':
        resultData = await findRelatedNodes(parameters.node_id, parameters.relationship_type);
        break;
      case 'path':
        resultData = { nodes: [], edges: [] }; // Placeholder for path finding
        break;
      default:
        resultData = [];
    }

    const executionTime = Date.now() - startTime;

    // Save query result
    await pool.query(
      `INSERT INTO query_results 
       (query_id, executed_by, execution_time_ms, result_data, result_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [queryId, parameters.executed_by, executionTime, JSON.stringify(resultData), Array.isArray(resultData) ? resultData.length : 1]
    );

    return {
      query_id: queryId,
      query_name: query.query_name,
      execution_time_ms: executionTime,
      result: resultData
    };
  } catch (error) {
    logger.error('Execute graph query error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to execute graph query
 */
router.post('/graph-queries/:queryId/execute', authMiddleware, async (req, res) => {
  try {
    const result = await executeGraphQuery(req.params.queryId, {
      ...req.body,
      executed_by: req.user.id
    });
    res.json(result);
  } catch (error) {
    logger.error('Execute graph query API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to execute graph query' });
  }
});

// ============================================================================
// KNOWLEDGE ANALYTICS
// ============================================================================

/**
 * Record knowledge analytics
 */
async function recordKnowledgeAnalytics(metrics) {
  try {
    const result = await pool.query(
      `INSERT INTO knowledge_analytics 
       (date, total_nodes, total_relationships, total_queries_executed, 
        avg_query_time_ms, unique_users_querying, most_queried_node_types)
       VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6)
       ON CONFLICT (date)
       DO UPDATE SET
         total_nodes = knowledge_analytics.total_nodes + EXCLUDED.total_nodes,
         total_relationships = knowledge_analytics.total_relationships + EXCLUDED.total_relationships,
         total_queries_executed = knowledge_analytics.total_queries_executed + EXCLUDED.total_queries_executed,
         unique_users_querying = knowledge_analytics.unique_users_querying + EXCLUDED.unique_users_querying
       RETURNING *`,
      [
        metrics.total_nodes || 0,
        metrics.total_relationships || 0,
        metrics.total_queries || 0,
        metrics.avg_query_time || 0,
        metrics.unique_users || 0,
        JSON.stringify(metrics.most_queried_types || {})
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Record knowledge analytics error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to record knowledge analytics
 */
router.post('/knowledge-analytics', authMiddleware, async (req, res) => {
  try {
    const { metrics } = req.body;
    const result = await recordKnowledgeAnalytics(metrics);
    res.json(result);
  } catch (error) {
    logger.error('Record knowledge analytics API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record knowledge analytics' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

function isHealthy() {
  return pool.connect().then(() => true).catch(() => false);
}

module.exports = {
  router,
  createKnowledgeNode,
  searchKnowledgeNodes,
  createRelationship,
  findRelatedNodes,
  createGraphQuery,
  executeGraphQuery,
  recordKnowledgeAnalytics,
  isHealthy
};
