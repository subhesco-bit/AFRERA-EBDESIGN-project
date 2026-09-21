/**
 * Real backend routes for AIOperationIntelligencePage.jsx, backed by
 * services/legacy/aiOperationIntelligenceService.js (NOT
 * services/ai/aiOperationIntelligenceService.js, which is a 7-line mock
 * stub returning a hardcoded "98% efficiency" response).
 *
 * Several page method names differ from the real ones (getMetrics ->
 * getPerformanceMetrics, getStrategies -> getOptimizationStrategies,
 * getContinuousImprovement -> continuousImprovement, predictOptimization ->
 * predictiveOptimization, recommendOptimizations ->
 * generateOptimizationRecommendations), and a few pages wrap the real
 * argument in an extra object (analyzePerformance({metrics}) vs real
 * analyzePerformance(metrics)) - unwrapped below to match the real
 * signature. executeOptimizationDecision has no implementation anywhere -
 * not wired, flagged instead of faked.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/aiOperationIntelligenceService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/ai-operation-intelligence/metrics', wrap(() => svc.getPerformanceMetrics()));
router.get('/ai-operation-intelligence/strategies', wrap(() => svc.getOptimizationStrategies()));
router.get('/ai-operation-intelligence/resource-allocation', wrap(() => svc.getResourceAllocation()));
router.get('/ai-operation-intelligence/operation-history', wrap((req) => svc.getOperationHistory(req.query.limit)));
router.post('/ai-operation-intelligence/strategy', wrap((req) => svc.addOptimizationStrategy(req.body.name, { description: req.body.description, ...req.body })));
router.get('/ai-operation-intelligence/continuous-improvement', wrap(() => svc.continuousImprovement()));
router.get('/ai-operation-intelligence/health', wrap(() => ({ status: 'healthy', service: 'aiOperationIntelligenceService' })));
router.post('/ai-operation-intelligence/analyze-performance', wrap((req) => svc.analyzePerformance(req.body.metrics)));
router.post('/ai-operation-intelligence/execute-optimizations', wrap((req) => svc.executeOptimizations(req.body.optimizations)));
router.post('/ai-operation-intelligence/recommend-optimizations', wrap((req) => svc.generateOptimizationRecommendations(req.body.analysis)));
router.get('/ai-operation-intelligence/detect-anomalies', wrap(() => svc.detectAnomalies()));
router.post('/ai-operation-intelligence/run-optimization-cycle', wrap(() => svc.runOptimizationCycle()));
router.get('/ai-operation-intelligence/predict-optimization', wrap((req) => svc.predictiveOptimization(req.query.horizon)));

module.exports = router;
