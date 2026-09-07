/**
 * AFRERA Complete AI Integration Routes
 * 
 * Exposes AI integration endpoints for farmer, crop, livestock, and inbuilt modules
 * Integrates all agricultural operations with predictive analytics, disease detection, yield prediction, and optimization
 */

const express = require('express');
const router = express.Router();
const completeAIIntegrationController = require('../controllers/completeAIIntegrationController');

// ============================================================================
// FARMER MODULE AI INTEGRATION ROUTES
// ============================================================================

/**
 * AI-powered crop planning recommendation for farmers
 * POST /api/v1/complete-ai-integration/farmer/:farmerId/crop-planning-recommendation
 */
router.post('/farmer/:farmerId/crop-planning-recommendation', completeAIIntegrationController.recommendCropPlanning);

/**
 * AI-powered harvest timing prediction
 * POST /api/v1/complete-ai-integration/farmer/:farmerId/harvest-timing-prediction
 */
router.post('/farmer/:farmerId/harvest-timing-prediction', completeAIIntegrationController.predictHarvestTiming);

/**
 * AI-powered resource optimization for farmer
 * POST /api/v1/complete-ai-integration/farmer/:farmerId/resource-optimization
 */
router.post('/farmer/:farmerId/resource-optimization', completeAIIntegrationController.optimizeFarmerResources);

// ============================================================================
// CROP MODULE AI INTEGRATION ROUTES
// ============================================================================

/**
 * AI-powered disease detection for crops
 * POST /api/v1/complete-ai-integration/crop/:cropId/disease-detection
 */
router.post('/crop/:cropId/disease-detection', completeAIIntegrationController.detectCropDisease);

/**
 * AI-powered yield prediction for crops
 * POST /api/v1/complete-ai-integration/crop/:cropId/yield-prediction
 */
router.post('/crop/:cropId/yield-prediction', completeAIIntegrationController.predictCropYield);

// ============================================================================
// LIVESTOCK MODULE AI INTEGRATION ROUTES
// ============================================================================

/**
 * AI-powered livestock health monitoring
 * POST /api/v1/complete-ai-integration/livestock/:livestockId/health-monitoring
 */
router.post('/livestock/:livestockId/health-monitoring', completeAIIntegrationController.monitorLivestockHealth);

/**
 * AI-powered breeding recommendation for livestock
 * POST /api/v1/complete-ai-integration/livestock/:livestockId/breeding-recommendation
 */
router.post('/livestock/:livestockId/breeding-recommendation', completeAIIntegrationController.recommendLivestockBreeding);

// ============================================================================
// INBUILT MODULES AI INTEGRATION ROUTES
// ============================================================================

/**
 * AI-powered dairy production optimization
 * POST /api/v1/complete-ai-integration/dairy/:dairyId/production-optimization
 */
router.post('/dairy/:dairyId/production-optimization', completeAIIntegrationController.optimizeDairyProduction);

/**
 * AI-powered poultry health monitoring
 * POST /api/v1/complete-ai-integration/poultry/:poultryId/health-monitoring
 */
router.post('/poultry/:poultryId/health-monitoring', completeAIIntegrationController.monitorPoultryHealth);

/**
 * AI-powered goat production optimization
 * POST /api/v1/complete-ai-integration/goat/:goatId/production-optimization
 */
router.post('/goat/:goatId/production-optimization', completeAIIntegrationController.optimizeGoatProduction);

/**
 * AI-powered sheep production optimization
 * POST /api/v1/complete-ai-integration/sheep/:sheepId/production-optimization
 */
router.post('/sheep/:sheepId/production-optimization', completeAIIntegrationController.optimizeSheepProduction);

/**
 * AI-powered pig production optimization
 * POST /api/v1/complete-ai-integration/pig/:pigId/production-optimization
 */
router.post('/pig/:pigId/production-optimization', completeAIIntegrationController.optimizePigProduction);

// ============================================================================
// BULK AI INTEGRATION ROUTES
// ============================================================================

/**
 * Get AI integration status for all modules
 * GET /api/v1/complete-ai-integration/status
 */
router.get('/status', completeAIIntegrationController.getAIIntegrationStatus);

/**
 * Force sync all AI integrations
 * POST /api/v1/complete-ai-integration/force-sync
 */
router.post('/force-sync', completeAIIntegrationController.forceSyncAllAIIntegrations);

/**
 * Get AI model information
 * GET /api/v1/complete-ai-integration/model-info
 */
router.get('/model-info', completeAIIntegrationController.getAIModelInfo);

module.exports = router;
