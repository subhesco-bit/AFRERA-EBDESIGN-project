/**
 * Decision Support Routes
 * 
 * Exposes the 8 critical business logic functions via /api/v1/decision-support endpoints.
 * These functions provide core business logic for pricing, logistics, finance, and governance.
 */

const express = require('express');
const router = express.Router();
const decisionSupportService = require('../services/legacy/decisionSupportService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { protectRouter } = require('./enterpriseRouteSupport');

protectRouter(router, { signal: 'enterprise.decision_support.changed' });

/**
 * 1. Corporate Credit Eligibility Check
 * POST /api/v1/decision-support/corp-credit-eligible
 */
router.post('/corp-credit-eligible', authMiddleware, async (req, res) => {
  try {
    const { turnoverCr, vintageYrs } = req.body;
    
    if (typeof turnoverCr !== 'number' || typeof vintageYrs !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input: turnoverCr and vintageYrs must be numbers'
      });
    }
    
    const result = decisionSupportService.corpCreditEligible(turnoverCr, vintageYrs);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. Floor Price Benchmark
 * POST /api/v1/decision-support/floor-benchmark
 */
router.post('/floor-benchmark', authMiddleware, async (req, res) => {
  try {
    const { categoryOrName, catalog } = req.body;
    
    if (!categoryOrName) {
      return res.status(400).json({
        success: false,
        error: 'categoryOrName is required'
      });
    }
    
    let result = decisionSupportService.floorBenchmark(categoryOrName, catalog);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. Eco Logistics Miles (ESG Scoring)
 * POST /api/v1/decision-support/eco-logistics-miles
 */
router.post('/eco-logistics-miles', authMiddleware, async (req, res) => {
  try {
    const { ctx, lanes } = req.body;
    
    if (!ctx || !ctx.kind) {
      return res.status(400).json({
        success: false,
        error: 'ctx with kind field is required'
      });
    }
    
    let result = decisionSupportService.ecoLogisticsMiles(ctx, lanes);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. Harvest Points Calculation
 * POST /api/v1/decision-support/harvest-points
 */
router.post('/harvest-points', authMiddleware, async (req, res) => {
  try {
    const { user } = req.body;
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'user object is required'
      });
    }
    
    let result = decisionSupportService.harvestPoints(user);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5. Allocation Score Calculation
 * POST /api/v1/decision-support/alloc-score
 */
router.post('/alloc-score', authMiddleware, async (req, res) => {
  try {
    const { lot, dest, regionDist } = req.body;
    
    if (!lot || !dest) {
      return res.status(400).json({
        success: false,
        error: 'lot and dest are required'
      });
    }
    
    let result = decisionSupportService.allocScore(lot, dest, regionDist);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 6. Compost Plan Generation
 * POST /api/v1/decision-support/compost-plan
 */
router.post('/compost-plan', authMiddleware, async (req, res) => {
  try {
    const { crop, acres, soilCond } = req.body;
    
    if (!crop || !acres) {
      return res.status(400).json({
        success: false,
        error: 'crop and acres are required'
      });
    }
    
    let result = decisionSupportService.compostPlan(crop, acres, soilCond);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 7. Scheme Expiry Status
 * GET /api/v1/decision-support/scheme-expiry-status
 */
router.get('/scheme-expiry-status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let result = decisionSupportService.schemeExpiryStatus();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 8. Compliance Gaps Check
 * POST /api/v1/decision-support/compliance-gaps
 */
router.post('/compliance-gaps', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { complianceRecord } = req.body;
    
    let result = decisionSupportService.complianceGaps(complianceRecord);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Health check endpoint for decision support service
 * GET /api/v1/decision-support/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'decision-support',
    status: 'operational',
    functions: [
      'corpCreditEligible',
      'floorBenchmark',
      'ecoLogisticsMiles',
      'harvestPoints',
      'allocScore',
      'compostPlan',
      'schemeExpiryStatus',
      'complianceGaps'
    ]
  });
});

module.exports = router;