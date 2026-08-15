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
const platformConfigurationService = require('../services/platformConfigurationService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');

// Get current configuration
router.get('/configuration', authMiddleware, async (req, res) => {
  try {
    const config = await platformConfigurationService.getConfiguration();
    res.json(config);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI optimization recommendations
router.get('/configuration/recommendations', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const recommendations = await platformConfigurationService.getOptimizedRecommendations();
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply optimized configuration
router.post('/configuration/apply', authMiddleware, requireRole("admin"), async (req, res) => {
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
      entityId: result.configId
    });
    
    res.json(result);
  } catch (error) {
    logger.error('platformConfigurationRoutes:applyConfiguration', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Automated parameter tuning
router.post('/configuration/tune', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const tuning = await platformConfigurationService.autoTuneParameters();
    res.json(tuning);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Performance-based configuration adjustment
router.get('/configuration/adjust-performance', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const adjustment = await platformConfigurationService.adjustConfigurationBasedOnPerformance();
    res.json(adjustment);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Security vulnerability scanning
router.post('/configuration/security-scan', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const scan = await platformConfigurationService.performSecurityScan();
    res.json(scan);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compliance checking
router.get('/configuration/compliance', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const compliance = await platformConfigurationService.checkCompliance();
    res.json(compliance);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get configuration history
router.get('/configuration/history', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = await platformConfigurationService.getConfigurationHistory(parseInt(limit));
    res.json(history);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rollback configuration
router.post('/configuration/rollback', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const { targetConfigId } = req.body;
    const rollback = await platformConfigurationService.rollbackConfiguration(targetConfigId);
    res.json(rollback);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate configuration
router.post('/configuration/validate', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const validation = await platformConfigurationService.validateConfiguration(req.body);
    res.json(validation);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
