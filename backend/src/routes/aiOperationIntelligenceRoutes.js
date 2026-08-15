/**
 * AI Operation Intelligence Routes
 * 
 * API endpoints for real-time optimization capabilities including:
 * - Performance monitoring
 * - Optimization recommendations
 * - Predictive optimization
 * - Anomaly detection
 * - Continuous improvement
 * - Resource allocation
 */

const express = require('express');
const router = express.Router();
const aiOperationIntelligenceService = require('../services/aiOperationIntelligenceService');

/**
 * Get performance metrics
 * GET /api/ai-operation-intelligence/metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = aiOperationIntelligenceService.getPerformanceMetrics();
    
    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze performance
 * POST /api/ai-operation-intelligence/analyze
 */
router.post('/analyze', async (req, res) => {
  try {
    const { metrics } = req.body;
    
    if (!metrics) {
      return res.status(400).json({
        success: false,
        error: 'metrics is required'
      });
    }
    
    const result = await aiOperationIntelligenceService.analyzePerformance(metrics);
    
    res.json(result);
  } catch (error) {
    console.error('Error analyzing performance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate optimization recommendations
 * POST /api/ai-operation-intelligence/recommend
 */
router.post('/recommend', async (req, res) => {
  try {
    const { analysis } = req.body;
    
    if (!analysis) {
      return res.status(400).json({
        success: false,
        error: 'analysis is required'
      });
    }
    
    const result = await aiOperationIntelligenceService.generateOptimizationRecommendations(analysis);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute optimizations
 * POST /api/ai-operation-intelligence/optimize
 */
router.post('/optimize', async (req, res) => {
  try {
    const { optimizations } = req.body;
    
    if (!optimizations) {
      return res.status(400).json({
        success: false,
        error: 'optimizations is required'
      });
    }
    
    const result = await aiOperationIntelligenceService.executeOptimizations(optimizations);
    
    res.json(result);
  } catch (error) {
    console.error('Error executing optimizations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Run full optimization cycle
 * POST /api/ai-operation-intelligence/cycle
 */
router.post('/cycle', async (req, res) => {
  try {
    // Collect metrics
    await aiOperationIntelligenceService.collectPerformanceMetrics();
    const metrics = aiOperationIntelligenceService.performanceMetrics.get('current');
    
    // Analyze performance
    const analysis = await aiOperationIntelligenceService.analyzePerformance(metrics);
    if (!analysis.success) {
      return res.json(analysis);
    }
    
    // Generate recommendations
    const recommendations = await aiOperationIntelligenceService.generateOptimizationRecommendations(analysis);
    
    // Execute optimizations if approved
    if (recommendations.success && recommendations.recommendations.auto_execute) {
      const execution = await aiOperationIntelligenceService.executeOptimizations(recommendations.recommendations.optimizations);
      
      return res.json({
        success: true,
        cycle: {
          metrics: metrics,
          analysis: analysis.analysis,
          recommendations: recommendations.recommendations,
          execution: execution
        },
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      cycle: {
        metrics: metrics,
        analysis: analysis.analysis,
        recommendations: recommendations.recommendations
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in optimization cycle:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Predictive optimization
 * GET /api/ai-operation-intelligence/predict
 */
router.get('/predict', async (req, res) => {
  try {
    const horizon = parseInt(req.query.horizon) || 24;
    const result = await aiOperationIntelligenceService.predictiveOptimization(horizon);
    
    res.json(result);
  } catch (error) {
    console.error('Error in predictive optimization:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Detect anomalies
 * GET /api/ai-operation-intelligence/anomalies
 */
router.get('/anomalies', async (req, res) => {
  try {
    const result = await aiOperationIntelligenceService.detectAnomalies();
    
    res.json(result);
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Continuous improvement analysis
 * GET /api/ai-operation-intelligence/improvements
 */
router.get('/improvements', async (req, res) => {
  try {
    const result = await aiOperationIntelligenceService.continuousImprovement();
    
    res.json(result);
  } catch (error) {
    console.error('Error in continuous improvement analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get optimization strategies
 * GET /api/ai-operation-intelligence/strategies
 */
router.get('/strategies', (req, res) => {
  try {
    const strategies = aiOperationIntelligenceService.getOptimizationStrategies();
    
    res.json({
      success: true,
      strategies: strategies
    });
  } catch (error) {
    console.error('Error getting optimization strategies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Add optimization strategy
 * POST /api/ai-operation-intelligence/strategy
 */
router.post('/strategy', (req, res) => {
  try {
    const { name, description, parameters, objectives } = req.body;
    
    if (!name || !description || !parameters || !objectives) {
      return res.status(400).json({
        success: false,
        error: 'name, description, parameters, and objectives are required'
      });
    }
    
    aiOperationIntelligenceService.addOptimizationStrategy(name, {
      description,
      parameters,
      objectives
    });
    
    res.json({
      success: true,
      strategy: { name, description, parameters, objectives }
    });
  } catch (error) {
    console.error('Error adding optimization strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get resource allocation
 * GET /api/ai-operation-intelligence/resources
 */
router.get('/resources', (req, res) => {
  try {
    const resources = aiOperationIntelligenceService.getResourceAllocation();
    
    res.json({
      success: true,
      resources: resources
    });
  } catch (error) {
    console.error('Error getting resource allocation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get operation history
 * GET /api/ai-operation-intelligence/history
 */
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = aiOperationIntelligenceService.getOperationHistory(limit);
    
    res.json({
      success: true,
      history: history
    });
  } catch (error) {
    console.error('Error getting operation history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check for AI Operation Intelligence service
 * GET /api/ai-operation-intelligence/service-health
 */
router.get('/service-health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    optimization_strategies: aiOperationIntelligenceService.optimizationStrategies.size,
    performance_metrics: aiOperationIntelligenceService.performanceMetrics.size,
    operation_history_size: aiOperationIntelligenceService.operationHistory.length,
    resource_allocation: aiOperationIntelligenceService.resourceAllocation.size,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
