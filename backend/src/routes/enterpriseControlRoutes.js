/**
 * Enterprise Control Routes — REST API endpoints for governance modules.
 *
 * Provides workflow, CRM, clients, legal, risk, and emergency management.
 * Backs migration 993 (workflow, CRM, clients, legal, risk, emergency).
 */

const express = require('express');
const {
  // Workflow Engine
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflowStep,
  // CRM
  createClient,
  listClients,
  getClient,
  updateClient,
  deleteClient,
  // Legal
  createLegalCase,
  listLegalCases,
  getLegalCase,
  updateLegalCase,
  deleteLegalCase,
  // Risk
  createRisk,
  listRisks,
  getRisk,
  updateRisk,
  deleteRisk,
  // Emergency
  createEmergency,
  listEmergencies,
  getEmergency,
  updateEmergency,
  deleteEmergency,
  executeEmergencyProtocol,
} = require('../services/enterpriseControlService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { rateLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

const router = express.Router();

router.use(authMiddleware);
router.use(rateLimiter);

// ===========================================================================
// WORKFLOW ENGINE
// ===========================================================================

/**
 * POST /api/v1/enterprise/workflows
 * Create a new workflow.
 */
router.post('/workflows', async (req, res, next) => {
  try {
    const workflow = await createWorkflow(req.body);
    res.json({ success: true, data: workflow });
  } catch (error) {
    logger.error('enterpriseControlRoutes:createWorkflow', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/enterprise/workflows
 * List all workflows with optional filters.
 */
router.get('/workflows', async (req, res, next) => {
  try {
    const { page, limit, status, type } = req.query;
    const result = await listWorkflows({ page, limit, status, type });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('enterpriseControlRoutes:listWorkflows', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/enterprise/workflows/:id
 * Get a specific workflow by ID.
 */
router.get('/workflows/:id', async (req, res, next) => {
  try {
    const workflow = await getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    res.json({ success: true, data: workflow });
  } catch (error) {
    logger.error('enterpriseControlRoutes:getWorkflow', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/enterprise/workflows/:id
 * Update a workflow.
 */
router.put('/workflows/:id', async (req, res, next) => {
  try {
    const workflow = await updateWorkflow(req.params.id, req.body);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    res.json({ success: true, data: workflow });
  } catch (error) {
    logger.error('enterpriseControlRoutes:updateWorkflow', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/enterprise/workflows/:id
 * Delete a workflow.
 */
router.delete('/workflows/:id', async (req, res, next) => {
  try {
    const deleted = await deleteWorkflow(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (error) {
    logger.error('enterpriseControlRoutes:deleteWorkflow', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/enterprise/workflows/:id/execute
 * Execute a workflow step.
 */
router.post('/workflows/:id/execute', async (req, res, next) => {
  try {
    const result = await executeWorkflowStep(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('enterpriseControlRoutes:executeWorkflowStep', { error: error.message });
    next(error);
  }
});

// ===========================================================================
// CRM / CLIENTS
// ===========================================================================

/**
 * POST /api/v1/enterprise/clients
 * Create a new client.
 */
router.post('/clients', async (req, res, next) => {
  try {
    const client = await createClient(req.body);
    res.json({ success: true, data: client });
  } catch (error) {
    logger.error('enterpriseControlRoutes:createClient', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/enterprise/clients
 * List all clients with optional filters.
 */
router.get('/clients', async (req, res, next) => {
  try {
    const { page, limit, status, type } = req.query;
    const result = await listClients({ page, limit, status, type });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('enterpriseControlRoutes:listClients', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/enterprise/clients/:id
 * Get a specific client by ID.
 */
router.get('/clients/:id', async (req, res, next) => {
  try {
    const client = await getClient(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    logger.error('enterpriseControlRoutes:getClient', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/enterprise/clients/:id
 * Update a client.
 */
router.put('/clients/:id', async (req, res, next) => {
  try {
    const client = await updateClient(req.params.id, req.body);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    logger.error('enterpriseControlRoutes:updateClient', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/enterprise/clients/:id
 * Delete a client.
 */
router.delete('/clients/:id', async (req, res, next) => {
  try {
    const deleted = await deleteClient(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    logger.error('enterpriseControlRoutes:deleteClient', { error: error.message });
    next(error);
  }
});

// ===========================================================================
// LEGAL
// ===========================================================================

/**
 * POST /api/v1/enterprise/legal
 * Create a new legal case.
 */
router.post('/legal', async (req, res, next) => {
  try {
    const legalCase = await createLegalCase(req.body);
    res.json({ success: true, data: legalCase });
  } catch (error) {
    logger.error('enterpriseControlRoutes:createLegalCase', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/enterprise/legal
 * List all legal cases with optional filters.
 */
router.get('/legal', async (req, res, next) => {
  try {
    const { page, limit, status, type } = req.query;
    const result = await listLegalCases({ page, limit, status, type });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('enterpriseControlRoutes:listLegalCases', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/enterprise/legal/:id
 * Get a specific legal case by ID.
 */
router.get('/legal/:id', async (req, res, next) => {
  try {
    const legalCase = await getLegalCase(req.params.id);
    if (!legalCase) {
      return res.status(404).json({ success: false, error: 'Legal case not found' });
    }
    res.json({ success: true, data: legalCase });
  } catch (error) {
    logger.error('enterpriseControlRoutes:getLegalCase', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/enterprise/legal/:id
 * Update a legal case.
 */
router.put('/legal/:id', async (req, res, next) => {
  try {
    const legalCase = await updateLegalCase(req.params.id, req.body);
    if (!legalCase) {
      return res.status(404).json({ success: false, error: 'Legal case not found' });
    }
    res.json({ success: true, data: legalCase });
  } catch (error) {
    logger.error('enterpriseControlRoutes:updateLegalCase', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/enterprise/legal/:id
 * Delete a legal case.
 */
router.delete('/legal/:id', async (req, res, next) => {
  try {
    const deleted = await deleteLegalCase(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Legal case not found' });
    }
    res.json({ success: true, message: 'Legal case deleted' });
  } catch (error) {
    logger.error('enterpriseControlRoutes:deleteLegalCase', { error: error.message });
    next(error);
  }
});

// ===========================================================================
// RISK
// ===========================================================================

/**
 * POST /api/v1/enterprise/risks
 * Create a new risk.
 */
router.post('/risks', async (req, res, next) => {
  try {
    const risk = await createRisk(req.body);
    res.json({ success: true, data: risk });
  } catch (error) {
    logger.error('enterpriseControlRoutes:createRisk', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/enterprise/risks
 * List all risks with optional filters.
 */
router.get('/risks', async (req, res, next) => {
  try {
    const { page, limit, severity, status } = req.query;
    const result = await listRisks({ page, limit, severity, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('enterpriseControlRoutes:listRisks', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/enterprise/risks/:id
 * Get a specific risk by ID.
 */
router.get('/risks/:id', async (req, res, next) => {
  try {
    const risk = await getRisk(req.params.id);
    if (!risk) {
      return res.status(404).json({ success: false, error: 'Risk not found' });
    }
    res.json({ success: true, data: risk });
  } catch (error) {
    logger.error('enterpriseControlRoutes:getRisk', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/enterprise/risks/:id
 * Update a risk.
 */
router.put('/risks/:id', async (req, res, next) => {
  try {
    const risk = await updateRisk(req.params.id, req.body);
    if (!risk) {
      return res.status(404).json({ success: false, error: 'Risk not found' });
    }
    res.json({ success: true, data: risk });
  } catch (error) {
    logger.error('enterpriseControlRoutes:updateRisk', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/enterprise/risks/:id
 * Delete a risk.
 */
router.delete('/risks/:id', async (req, res, next) => {
  try {
    const deleted = await deleteRisk(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Risk not found' });
    }
    res.json({ success: true, message: 'Risk deleted' });
  } catch (error) {
    logger.error('enterpriseControlRoutes:deleteRisk', { error: error.message });
    next(error);
  }
});

// ===========================================================================
// EMERGENCY
// ===========================================================================

/**
 * POST /api/v1/enterprise/emergencies
 * Create a new emergency.
 */
router.post('/emergencies', async (req, res, next) => {
  try {
    const emergency = await createEmergency(req.body);
    res.json({ success: true, data: emergency });
  } catch (error) {
    logger.error('enterpriseControlRoutes:createEmergency', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/enterprise/emergencies
 * List all emergencies with optional filters.
 */
router.get('/emergencies', async (req, res, next) => {
  try {
    const { page, limit, severity, status } = req.query;
    const result = await listEmergencies({ page, limit, severity, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('enterpriseControlRoutes:listEmergencies', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/enterprise/emergencies/:id
 * Get a specific emergency by ID.
 */
router.get('/emergencies/:id', async (req, res, next) => {
  try {
    const emergency = await getEmergency(req.params.id);
    if (!emergency) {
      return res.status(404).json({ success: false, error: 'Emergency not found' });
    }
    res.json({ success: true, data: emergency });
  } catch (error) {
    logger.error('enterpriseControlRoutes:getEmergency', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/enterprise/emergencies/:id
 * Update an emergency.
 */
router.put('/emergencies/:id', async (req, res, next) => {
  try {
    const emergency = await updateEmergency(req.params.id, req.body);
    if (!emergency) {
      return res.status(404).json({ success: false, error: 'Emergency not found' });
    }
    res.json({ success: true, data: emergency });
  } catch (error) {
    logger.error('enterpriseControlRoutes:updateEmergency', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/enterprise/emergencies/:id
 * Delete an emergency.
 */
router.delete('/emergencies/:id', async (req, res, next) => {
  try {
    const deleted = await deleteEmergency(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Emergency not found' });
    }
    res.json({ success: true, message: 'Emergency deleted' });
  } catch (error) {
    logger.error('enterpriseControlRoutes:deleteEmergency', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/enterprise/emergencies/:id/execute
 * Execute emergency protocol.
 */
router.post('/emergencies/:id/execute', async (req, res, next) => {
  try {
    const result = await executeEmergencyProtocol(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('enterpriseControlRoutes:executeEmergencyProtocol', { error: error.message });
    next(error);
  }
});

module.exports = router;
