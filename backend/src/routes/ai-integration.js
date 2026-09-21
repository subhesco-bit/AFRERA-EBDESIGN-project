/**
 * AI INTEGRATION ROUTES
 * Universal integration endpoints for all ERP modules
 */

'use strict';

const express = require('express');
const router = express.Router();
const aiIntegration = require('../services/ai-integration-service');
const { logger } = require('../utils/logger');

const BASE_PATH = '/api/v1/ai-integration';

/**
 * POST /api/v1/ai-integration/process
 * Process AI request from any ERP module
 */
router.post('/process', async (req, res) => {
  try {
    const { sourceModule, capability, data, priority, context } = req.body;

    if (!sourceModule || !capability || !data) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: sourceModule, capability, data',
      });
    }

    const result = await aiIntegration.processModuleAIRequest({
      sourceModule,
      capability,
      data,
      priority,
      context,
    });

    res.json(result);
  } catch (error) {
    logger.error('Integration request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/ai-integration/batch
 * Batch process multiple AI requests
 */
router.post('/batch', async (req, res) => {
  try {
    const { sourceModule, requests } = req.body;

    if (!sourceModule || !Array.isArray(requests)) {
      return res.status(400).json({
        success: false,
        error: 'Required: sourceModule (string), requests (array)',
      });
    }

    const result = await aiIntegration.processBatchRequests(sourceModule, requests);
    res.json(result);
  } catch (error) {
    logger.error('Batch request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/ai-integration/share-intelligence
 * Share intelligence across modules
 */
router.post('/share-intelligence', async (req, res) => {
  try {
    const { sourceModule, targetModules, intelligence } = req.body;

    if (!sourceModule || !Array.isArray(targetModules) || !intelligence) {
      return res.status(400).json({
        success: false,
        error: 'Required: sourceModule, targetModules[], intelligence',
      });
    }

    const result = await aiIntegration.shareIntelligence(
      sourceModule,
      targetModules,
      intelligence
    );

    res.json(result);
  } catch (error) {
    logger.error('Share intelligence error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/ai-integration/history/:moduleId
 * Get decision history for module
 */
router.get('/history/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { limit = 50 } = req.query;

    const result = await aiIntegration.getDecisionHistory(moduleId, parseInt(limit));
    res.json(result);
  } catch (error) {
    logger.error('History retrieval error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/ai-integration/version/:decisionId
 * Version a decision
 */
router.post('/version/:decisionId', async (req, res) => {
  try {
    const { decisionId } = req.params;
    const { newData, reason } = req.body;

    if (!newData || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Required: newData, reason',
      });
    }

    const result = await aiIntegration.versionDecision(decisionId, newData, reason);
    res.json(result);
  } catch (error) {
    logger.error('Version error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/ai-integration/metrics
 * Get integration metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = aiIntegration.getMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    logger.error('Metrics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/ai-integration/health
 * Health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = await aiIntegration.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

module.exports = router;
