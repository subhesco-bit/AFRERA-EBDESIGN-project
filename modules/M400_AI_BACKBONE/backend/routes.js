/**
 * M400 AI Backbone Routes
 * REST API endpoints for AI orchestration
 */

const express = require('express');
const router = express.Router();
const aiBackbone = require('./service');
const { validateRequest, errorHandler } = require('../../../backend/src/middleware/validation');
const { logger } = require('../../../backend/src/utils/logger');

/**
 * POST /api/v1/m400-ai-backbone/decisions
 * Make an AI decision
 */
router.post('/decisions', errorHandler(async (req, res) => {
  const { moduleId, capability, data, provider, confidence, context } = req.body;

  if (!moduleId || !capability || !data) {
    return res.status(400).json({
      success: false,
      error: 'moduleId, capability, and data are required',
    });
  }

  const decision = await aiBackbone.makeDecision(context || {}, {
    moduleId,
    capability,
    data,
    provider,
    confidence,
  });

  res.json(decision);
}));

/**
 * GET /api/v1/m400-ai-backbone/decisions/:id
 * Get decision details
 */
router.get('/decisions/:id', errorHandler(async (req, res) => {
  const { id } = req.params;
  
  // Query from database
  const result = await aiBackbone.getInstance().pool.query(
    'SELECT * FROM ai_decisions WHERE decision_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Decision not found' });
  }

  res.json({
    success: true,
    decision: result.rows[0],
  });
}));

/**
 * POST /api/v1/m400-ai-backbone/decisions/:id/feedback
 * Provide feedback on a decision
 */
router.post('/decisions/:id/feedback', errorHandler(async (req, res) => {
  const { id } = req.params;
  const { outcome, feedback, accuracy } = req.body;

  const result = await aiBackbone.learnFromData({
    decisionId: id,
    outcome,
    feedback,
    accuracy,
  });

  res.json(result);
}));

/**
 * POST /api/v1/m400-ai-backbone/strategies
 * Generate an AI strategy
 */
router.post('/strategies', errorHandler(async (req, res) => {
  const { moduleId, objectives, currentState, provider } = req.body;

  if (!moduleId || !objectives || !currentState) {
    return res.status(400).json({
      success: false,
      error: 'moduleId, objectives, and currentState are required',
    });
  }

  const strategy = await aiBackbone.generateStrategy(objectives, currentState, {
    moduleId,
    provider,
  });

  res.json(strategy);
}));

/**
 * GET /api/v1/m400-ai-backbone/strategies/:id
 * Get strategy details
 */
router.get('/strategies/:id', errorHandler(async (req, res) => {
  const { id } = req.params;

  const result = await aiBackbone.getInstance().pool.query(
    'SELECT * FROM ai_strategies WHERE strategy_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Strategy not found' });
  }

  res.json({
    success: true,
    strategy: result.rows[0],
  });
}));

/**
 * POST /api/v1/m400-ai-backbone/predictions
 * Make an AI prediction
 */
router.post('/predictions', errorHandler(async (req, res) => {
  const { moduleId, modelId, context, provider } = req.body;

  if (!moduleId || !modelId || !context) {
    return res.status(400).json({
      success: false,
      error: 'moduleId, modelId, and context are required',
    });
  }

  const prediction = await aiBackbone.makePrediction(context, modelId, {
    moduleId,
    provider,
  });

  res.json(prediction);
}));

/**
 * GET /api/v1/m400-ai-backbone/predictions/:id
 * Get prediction details
 */
router.get('/predictions/:id', errorHandler(async (req, res) => {
  const { id } = req.params;

  const result = await aiBackbone.getInstance().pool.query(
    'SELECT * FROM ai_predictions WHERE prediction_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Prediction not found' });
  }

  res.json({
    success: true,
    prediction: result.rows[0],
  });
}));

/**
 * POST /api/v1/m400-ai-backbone/predictions/:id/verify
 * Verify prediction accuracy
 */
router.post('/predictions/:id/verify', errorHandler(async (req, res) => {
  const { id } = req.params;
  const { actualOutcome, accuracy } = req.body;

  await aiBackbone.getInstance().pool.query(
    `UPDATE ai_predictions 
     SET actual_outcome = $1, accuracy = $2, verified_at = CURRENT_TIMESTAMP
     WHERE prediction_id = $3`,
    [JSON.stringify(actualOutcome), accuracy, id]
  );

  res.json({
    success: true,
    message: 'Prediction verified',
    predictionId: id,
  });
}));

/**
 * POST /api/v1/m400-ai-backbone/coordinate
 * Coordinate multi-agent request
 */
router.post('/coordinate', errorHandler(async (req, res) => {
  const { moduleId, capability, input, agents, timeout } = req.body;

  if (!moduleId || !capability || !input) {
    return res.status(400).json({
      success: false,
      error: 'moduleId, capability, and input are required',
    });
  }

  const execution = await aiBackbone.coordinateRequest({
    moduleId,
    capability,
    input,
    agents,
    timeout,
  });

  res.json(execution);
}));

/**
 * GET /api/v1/m400-ai-backbone/executions/:id
 * Get execution details
 */
router.get('/executions/:id', errorHandler(async (req, res) => {
  const { id } = req.params;

  const result = await aiBackbone.getInstance().pool.query(
    'SELECT * FROM ai_agent_executions WHERE execution_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Execution not found' });
  }

  res.json({
    success: true,
    execution: result.rows[0],
  });
}));

/**
 * GET /api/v1/m400-ai-backbone/metrics
 * Get backbone metrics
 */
router.get('/metrics', errorHandler(async (req, res) => {
  const metrics = aiBackbone.getMetrics();
  res.json({
    success: true,
    metrics,
  });
}));

/**
 * GET /api/v1/m400-ai-backbone/health
 * Health check
 */
router.get('/health', errorHandler(async (req, res) => {
  const health = await aiBackbone.healthCheck();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}));

/**
 * GET /api/v1/m400-ai-backbone/engines
 * Get engine information
 */
router.get('/engines', errorHandler(async (req, res) => {
  const service = aiBackbone.getInstance();
  
  res.json({
    success: true,
    engines: {
      decision: {
        status: 'operational',
        stats: service.decisionEngine.getStats?.() || {},
      },
      strategy: {
        status: 'operational',
        plans: service.strategyEngine.executionPlans.length,
      },
      learning: {
        status: 'operational',
        feedback: service.learningEngine.feedback.size,
      },
      prediction: {
        status: 'operational',
        models: service.predictionEngine.models.size,
      },
      coordination: {
        status: 'operational',
        agents: service.coordinationEngine.agentRegistry.size,
        activeRequests: service.coordinationEngine.activeRequests.size,
      },
    },
  });
}));

/**
 * GET /api/v1/m400-ai-backbone/decisions
 * List recent decisions (paginated)
 */
router.get('/decisions', errorHandler(async (req, res) => {
  const { limit = 20, offset = 0, moduleId, status } = req.query;
  
  let query = 'SELECT * FROM ai_decisions WHERE 1=1';
  const params = [];

  if (moduleId) {
    query += ` AND module_id = $${params.length + 1}`;
    params.push(moduleId);
  }

  if (status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await aiBackbone.getInstance().pool.query(query, params);

  res.json({
    success: true,
    decisions: result.rows,
    total: result.rows.length,
    limit,
    offset,
  });
}));

/**
 * GET /api/v1/m400-ai-backbone/strategies
 * List recent strategies (paginated)
 */
router.get('/strategies', errorHandler(async (req, res) => {
  const { limit = 20, offset = 0, moduleId, status } = req.query;
  
  let query = 'SELECT * FROM ai_strategies WHERE 1=1';
  const params = [];

  if (moduleId) {
    query += ` AND module_id = $${params.length + 1}`;
    params.push(moduleId);
  }

  if (status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await aiBackbone.getInstance().pool.query(query, params);

  res.json({
    success: true,
    strategies: result.rows,
    total: result.rows.length,
    limit,
    offset,
  });
}));

/**
 * GET /api/v1/m400-ai-backbone/predictions
 * List recent predictions (paginated)
 */
router.get('/predictions', errorHandler(async (req, res) => {
  const { limit = 20, offset = 0, moduleId, modelId } = req.query;
  
  let query = 'SELECT * FROM ai_predictions WHERE 1=1';
  const params = [];

  if (moduleId) {
    query += ` AND module_id = $${params.length + 1}`;
    params.push(moduleId);
  }

  if (modelId) {
    query += ` AND model_id = $${params.length + 1}`;
    params.push(modelId);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await aiBackbone.getInstance().pool.query(query, params);

  res.json({
    success: true,
    predictions: result.rows,
    total: result.rows.length,
    limit,
    offset,
  });
}));

/**
 * Error handler
 */
router.use((err, req, res, next) => {
  logger.error('AI Backbone route error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    moduleId: 'M400_AI_BACKBONE',
  });
});

module.exports = router;
