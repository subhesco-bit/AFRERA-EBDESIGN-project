/**
 * AI Self-Healing Routes
 * 
 * API endpoints for autonomous error recovery capabilities including:
 * - Error detection and classification
 * - Root cause analysis
 * - Recovery strategy execution
 * - Predictive failure prevention
 * - Health monitoring
 * - Healing history
 */

const express = require('express');
const router = express.Router();
const aiSelfHealingService = require('../services/aiSelfHealingService');

/**
 * Detect and classify error
 * POST /api/ai-self-healing/detect
 */
router.post('/detect', async (req, res) => {
  try {
    const { error } = req.body;
    
    if (!error) {
      return res.status(400).json({
        success: false,
        error: 'error is required'
      });
    }
    
    const result = await aiSelfHealingService.detectAndClassifyError(error);
    
    res.json(result);
  } catch (error) {
    console.error('Error detecting and classifying error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Perform root cause analysis
 * POST /api/ai-self-healing/root-cause
 */
router.post('/root-cause', async (req, res) => {
  try {
    const { error, context } = req.body;
    
    if (!error) {
      return res.status(400).json({
        success: false,
        error: 'error is required'
      });
    }
    
    const result = await aiSelfHealingService.performRootCauseAnalysis(error, context || {});
    
    res.json(result);
  } catch (error) {
    console.error('Error in root cause analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute recovery strategy
 * POST /api/ai-self-healing/recover
 */
router.post('/recover', async (req, res) => {
  try {
    const { error_type, context } = req.body;
    
    if (!error_type) {
      return res.status(400).json({
        success: false,
        error: 'error_type is required'
      });
    }
    
    const result = await aiSelfHealingService.executeRecoveryStrategy(error_type, context || {});
    
    res.json(result);
  } catch (error) {
    console.error('Error executing recovery strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Full self-healing cycle (detect, analyze, recover)
 * POST /api/ai-self-healing/heal
 */
router.post('/heal', async (req, res) => {
  try {
    const { error, context } = req.body;
    
    if (!error) {
      return res.status(400).json({
        success: false,
        error: 'error is required'
      });
    }
    
    // Step 1: Detect and classify
    const detection = await aiSelfHealingService.detectAndClassifyError(error);
    if (!detection.success) {
      return res.json(detection);
    }
    
    // Step 2: Root cause analysis
    const rootCause = await aiSelfHealingService.performRootCauseAnalysis(error, context || {});
    
    // Step 3: Execute recovery
    const recovery = await aiSelfHealingService.executeRecoveryStrategy(
      detection.classification.type,
      context || {}
    );
    
    res.json({
      success: true,
      healing_cycle: {
        detection: detection,
        root_cause: rootCause,
        recovery: recovery
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in healing cycle:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Predictive failure prevention
 * GET /api/ai-self-healing/predict
 */
router.get('/predict', async (req, res) => {
  try {
    const result = await aiSelfHealingService.predictiveFailurePrevention();
    
    res.json(result);
  } catch (error) {
    console.error('Error in predictive failure prevention:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get healing history
 * GET /api/ai-self-healing/history
 */
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = aiSelfHealingService.getHealingHistory(limit);
    
    res.json({
      success: true,
      history: history
    });
  } catch (error) {
    console.error('Error getting healing history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get health metrics
 * GET /api/ai-self-healing/health
 */
router.get('/health', (req, res) => {
  try {
    const metrics = aiSelfHealingService.getHealthMetrics();
    
    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    console.error('Error getting health metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Add error pattern
 * POST /api/ai-self-healing/pattern
 */
router.post('/pattern', (req, res) => {
  try {
    const { name, patterns, severity, category } = req.body;
    
    if (!name || !patterns || !severity || !category) {
      return res.status(400).json({
        success: false,
        error: 'name, patterns, severity, and category are required'
      });
    }
    
    aiSelfHealingService.addErrorPattern(name, {
      patterns,
      severity,
      category
    });
    
    res.json({
      success: true,
      pattern: { name, patterns, severity, category }
    });
  } catch (error) {
    console.error('Error adding error pattern:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Add recovery strategy
 * POST /api/ai-self-healing/strategy
 */
router.post('/strategy', (req, res) => {
  try {
    const { error_type, strategies } = req.body;
    
    if (!error_type || !strategies) {
      return res.status(400).json({
        success: false,
        error: 'error_type and strategies are required'
      });
    }
    
    aiSelfHealingService.addRecoveryStrategy(error_type, strategies);
    
    res.json({
      success: true,
      strategy: { error_type, strategies }
    });
  } catch (error) {
    console.error('Error adding recovery strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get system state
 * GET /api/ai-self-healing/system-state
 */
router.get('/system-state', (req, res) => {
  try {
    const state = aiSelfHealingService.getSystemState();
    
    res.json({
      success: true,
      state: state
    });
  } catch (error) {
    console.error('Error getting system state:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check for AI Self-Healing service
 * GET /api/ai-self-healing/service-health
 */
router.get('/service-health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    error_patterns: aiSelfHealingService.errorPatterns.size,
    recovery_strategies: aiSelfHealingService.recoveryStrategies.size,
    healing_history_size: aiSelfHealingService.healingHistory.length,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
