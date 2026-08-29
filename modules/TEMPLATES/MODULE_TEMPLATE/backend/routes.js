/**
 * MODULE_ID API Routes
 * Plug-and-Play module API routes
 */

const express = require('express');
const router = express.Router();

// Service will be injected by module backbone
let moduleService = null;

/**
 * Inject service instance
 */
function setService(service) {
  moduleService = service;
}

/**
 * GET /health
 * Module health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = await moduleService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /execute
 * Generic execute endpoint for AI interaction
 */
router.post('/execute', async (req, res) => {
  try {
    const { operation, parameters, context } = req.body;
    const result = await moduleService.execute(operation, parameters, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * CRUD Operations - customize based on module needs
 */

/**
 * POST /create
 * Create resource
 */
router.post('/create', async (req, res) => {
  try {
    const result = await moduleService.execute('create', req.body, req.context);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /read/:id
 * Read resource
 */
router.get('/read/:id', async (req, res) => {
  try {
    const result = await moduleService.execute('read', { id: req.params.id }, req.context);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /update/:id
 * Update resource
 */
router.put('/update/:id', async (req, res) => {
  try {
    const result = await moduleService.execute('update', { ...req.body, id: req.params.id }, req.context);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /delete/:id
 * Delete resource
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const result = await moduleService.execute('delete', { id: req.params.id }, req.context);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /list
 * List resources
 */
router.get('/list', async (req, res) => {
  try {
    const result = await moduleService.execute('list', req.query, req.context);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AI Operations
 */

/**
 * POST /analyze
 * AI-powered analysis
 */
router.post('/analyze', async (req, res) => {
  try {
    const result = await moduleService.execute('analyze', req.body, { ...req.context, useAI: true });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /decide
 * AI decision making
 */
router.post('/decide', async (req, res) => {
  try {
    const result = await moduleService.execute('decide', req.body, { ...req.context, useAI: true });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /strategize
 * AI strategy formulation
 */
router.post('/strategize', async (req, res) => {
  try {
    const result = await moduleService.execute('strategize', req.body, { ...req.context, useAI: true });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Cable Communication
 */

/**
 * POST /cable/:cableId/receive
 * Receive data via cable
 */
router.post('/cable/:cableId/receive', async (req, res) => {
  try {
    const result = await moduleService.receiveCableData(req.params.cableId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /cable/:cableId/send
 * Send data via cable
 */
router.post('/cable/:cableId/send', async (req, res) => {
  try {
    const result = await moduleService.sendCableData(req.params.cableId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = { router, setService };