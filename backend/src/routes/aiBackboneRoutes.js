/**
 * AI Backbone Routes - Real AI Integration
 * 
 * REST API routes for AI backbone with real AI provider integrations
 * Following RESTful API design conventions
 */

const express = require('express');
const aiBackboneController = require('../controllers/aiBackboneController');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

const router = express.Router();

router.use(authMiddleware);
router.use(apiLimiter);

// ============================================================================
// AI BACKBONE ROUTES
// ============================================================================

// General AI Operations
router.post('/call', aiBackboneController.callAI);
router.get('/status', aiBackboneController.getAIProviderStatus);
router.post('/switch-provider', aiBackboneController.switchProvider);
router.post('/reset-statistics', aiBackboneController.resetAIStatistics);

// Agricultural AI Operations
router.post('/agricultural-decision', aiBackboneController.supportAgriculturalDecision);
router.post('/livestock-optimization', aiBackboneController.optimizeLivestock);

module.exports = router;
