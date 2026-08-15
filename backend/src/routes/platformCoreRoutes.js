/**
 * Platform Core Module Routes - AI Enhanced
 * 
 * Routes for platform core functionality with AI-powered capabilities:
 * - Platform health monitoring
 * - Auto-scaling recommendations
 * - Capacity planning
 * - Disaster recovery
 * - Performance monitoring
 * - Self-healing
 * - Configuration optimization
 */

const express = require('express');
const router = express.Router();
const platformCoreService = require('../services/platformCoreService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');

// Initialize platform core
router.post('/initialize', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await platformCoreService.initialize();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get platform health status
router.get('/health', authMiddleware, async (req, res) => {
  try {
    const health = await platformCoreService.getPlatformHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get scaling recommendations
router.get('/scaling/recommendations', authMiddleware, requireRole('admin', 'ops'), async (req, res) => {
  try {
    const recommendations = await platformCoreService.getScalingRecommendations();
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Predict capacity needs
router.get('/capacity/predict', authMiddleware, requireRole('admin', 'ops'), async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const prediction = await platformCoreService.predictCapacityNeeds(timeframe);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger disaster recovery
router.post('/disaster-recovery', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await platformCoreService.triggerDisasterRecovery(req.body);
    
    // Emit signal for disaster recovery
    signalBus.emitSignal(SIGNAL.EMERGENCY_RAISED, {
      incidentId: result.incidentId,
      recoveryStatus: result.status,
      recoveryTime: result.recoveryTime,
      dataLoss: result.dataLoss
    }, {
      severity: SEVERITY.CRITICAL,
      source: 'platform_core_routes',
      entityId: result.incidentId
    });
    
    res.json(result);
  } catch (error) {
    logger.error('platformCoreRoutes:disasterRecovery', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Monitor performance
router.get('/performance/monitor', authMiddleware, requireRole('admin', 'ops'), async (req, res) => {
  try {
    const monitoring = await platformCoreService.monitorPerformance();
    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger self-healing
router.post('/self-healing', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const result = await platformCoreService.triggerSelfHealing(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get optimized configuration
router.get('/configuration/optimized', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const optimization = await platformCoreService.getOptimizedConfiguration();
    res.json(optimization);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply configuration changes
router.post('/configuration/apply', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const result = await platformCoreService.applyOptimizedConfiguration(req.body);
    
    // Emit signal for configuration change
    signalBus.emitSignal(SIGNAL.CONFIGURATION_CHANGED, {
      configId: result.configId,
      changes: req.body,
      appliedBy: 'admin',
      monitoringStatus: result.monitoring
    }, {
      severity: SEVERITY.NOTICE,
      source: 'platform_core_routes',
      entityId: result.configId
    });
    
    res.json(result);
  } catch (error) {
    logger.error('platformCoreRoutes:applyConfiguration', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get performance metrics
router.get('/metrics', authMiddleware, async (req, res) => {
  try {
    const metrics = await platformCoreService.collectPerformanceMetrics();
    res.json({ metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get system state
router.get('/state', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const state = await platformCoreService.getSystemState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
