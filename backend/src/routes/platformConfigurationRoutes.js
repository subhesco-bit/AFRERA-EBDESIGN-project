/**
 * Platform Configuration Module Routes - AI Enhanced
 * 
 * Routes for platform configuration management with AI-powered capabilities:
 * - Configuration management
 * - AI optimization recommendations
 * - Automated parameter tuning
 * - Performance-based adjustment
 * - Security scanning
 * - Compliance checking
 * - Configuration history
 * - Rollback management
 */

const express = require('express');
const router = express.Router();
const platformConfigurationService = require('../services/legacy/platformConfigurationService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimit');
const { validateBody } = require('../middleware/inputValidation');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');

const correlationId = (req) => req.get('x-correlation-id') || `platform-config-${Date.now()}`;
const fail = (req, res, error, operation) => {
  const requestId = correlationId(req);
  logger.error(`platformConfigurationRoutes:${operation}`, { error: error.message, requestId });
  return res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR', requestId });
};
const objectBody = (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({ success: false, error: 'Request body must be an object', code: 'INVALID_INPUT' });
    return false;
  }
  return true;
};
const configurationBody = (req, res) => {
  if (!objectBody(req, res) || !req.body.parameters || typeof req.body.parameters !== 'object' || Array.isArray(req.body.parameters)) {
    if (res.headersSent) return false;
    res.status(400).json({ success: false, error: 'parameters must be an object', code: 'INVALID_INPUT' });
    return false;
  }
  const { cache_size, connection_pool_size } = req.body.parameters;
  if ((cache_size !== undefined && (!Number.isInteger(cache_size) || cache_size < 128 || cache_size > 16384)) ||
      (connection_pool_size !== undefined && (!Number.isInteger(connection_pool_size) || connection_pool_size < 10 || connection_pool_size > 1000))) {
    res.status(400).json({ success: false, error: 'Configuration parameters are out of bounds', code: 'INVALID_INPUT' });
    return false;
  }
  return true;
};
const admin = [rateLimiters.api, authMiddleware, requireRole('admin')];
const writeAdmin = [rateLimiters.write, authMiddleware, requireRole('admin')];

// Get current configuration
router.get('/configuration', rateLimiters.read, authMiddleware, async (req, res) => {
  try {
    const config = await platformConfigurationService.getConfiguration();
    res.json(config);
  } catch (error) {
    return fail(req, res, error, 'getConfiguration');
  }
});

// Get AI optimization recommendations
router.get('/configuration/recommendations', ...admin, async (req, res) => {
  try {
    const recommendations = await platformConfigurationService.getOptimizedRecommendations();
    res.json(recommendations);
  } catch (error) {
    return fail(req, res, error, 'getRecommendations');
  }
});

// Apply optimized configuration
router.post('/configuration/apply', ...writeAdmin, validateBody(), (req, res, next) => configurationBody(req, res) ? next() : undefined, async (req, res) => {
  try {
    const result = await platformConfigurationService.applyOptimizedConfiguration(req.body);
    
    // Emit signal for configuration change
    signalBus.emitSignal(SIGNAL.CONFIGURATION_CHANGED, {
      configId: result.configId,
      changes: req.body,
      appliedBy: 'ai_optimizer',
      monitoringStatus: result.monitoring
    }, {
      severity: SEVERITY.NOTICE,
      source: 'platform_configuration_routes',
      entityId: result.configId,
      correlationId: correlationId(req)
    });
    
    res.json(result);
  } catch (error) {
    logger.error('platformConfigurationRoutes:applyConfiguration', { error: error.message });
    return fail(req, res, error, 'applyConfiguration');
  }
});

// Automated parameter tuning
router.post('/configuration/tune', ...writeAdmin, async (req, res) => {
  try {
    const tuning = await platformConfigurationService.autoTuneParameters();
    res.json(tuning);
  } catch (error) {
    return fail(req, res, error, 'tuneConfiguration');
  }
});

// Performance-based configuration adjustment
router.get('/configuration/adjust-performance', ...admin, async (req, res) => {
  try {
    const adjustment = await platformConfigurationService.adjustConfigurationBasedOnPerformance();
    res.json(adjustment);
  } catch (error) {
    return fail(req, res, error, 'adjustPerformance');
  }
});

// Security vulnerability scanning
router.post('/configuration/security-scan', ...writeAdmin, async (req, res) => {
  try {
    const scan = await platformConfigurationService.performSecurityScan();
    res.json(scan);
  } catch (error) {
    return fail(req, res, error, 'securityScan');
  }
});

// Compliance checking
router.get('/configuration/compliance', ...admin, async (req, res) => {
  try {
    const compliance = await platformConfigurationService.checkCompliance();
    res.json(compliance);
  } catch (error) {
    return fail(req, res, error, 'compliance');
  }
});

// Get configuration history
router.get('/configuration/history', ...admin, (req, res, next) => {
  const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    return res.status(400).json({ success: false, error: 'limit must be an integer between 1 and 1000', code: 'INVALID_INPUT' });
  }
  req.query.limit = limit;
  next();
}, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = await platformConfigurationService.getConfigurationHistory(parseInt(limit));
    res.json(history);
  } catch (error) {
    return fail(req, res, error, 'getHistory');
  }
});

// Rollback configuration
router.post('/configuration/rollback', ...writeAdmin, validateBody(), (req, res, next) => {
  if (!objectBody(req, res)) return;
  if (req.body.targetConfigId !== undefined && (typeof req.body.targetConfigId !== 'string' || req.body.targetConfigId.length < 1 || req.body.targetConfigId.length > 128)) {
    return res.status(400).json({ success: false, error: 'targetConfigId is invalid', code: 'INVALID_INPUT' });
  }
  next();
}, async (req, res) => {
  try {
    const { targetConfigId } = req.body;
    const rollback = await platformConfigurationService.rollbackConfiguration(targetConfigId);
    res.json(rollback);
  } catch (error) {
    return fail(req, res, error, 'rollback');
  }
});

// Validate configuration
router.post('/configuration/validate', ...writeAdmin, validateBody(), (req, res, next) => configurationBody(req, res) ? next() : undefined, async (req, res) => {
  try {
    const validation = await platformConfigurationService.validateConfiguration(req.body);
    res.json(validation);
  } catch (error) {
    return fail(req, res, error, 'validateConfiguration');
  }
});

module.exports = router;
