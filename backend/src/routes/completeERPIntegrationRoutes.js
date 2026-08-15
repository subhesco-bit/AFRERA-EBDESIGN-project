/**
 * AFRERA Complete ERP Integration Routes
 * 
 * Exposes ERP integration endpoints for farmer, crop, livestock, and inbuilt modules
 * Integrates all agricultural operations with financial ERP, supply chain ERP, production ERP, and customer ERP
 */

const express = require('express');
const router = express.Router();
const completeERPIntegrationController = require('../controllers/completeERPIntegrationController');

// ============================================================================
// FARMER MODULE ERP INTEGRATION ROUTES
// ============================================================================

/**
 * Sync farmer crop planning with ERP production planning
 * POST /api/v1/complete-erp-integration/farmer/:farmerId/crop-planning
 */
router.post('/farmer/:farmerId/crop-planning', completeERPIntegrationController.syncFarmerCropPlanningWithERP);

/**
 * Sync farmer harvest data with ERP inventory and financial ERP
 * POST /api/v1/complete-erp-integration/farmer/:farmerId/harvest
 */
router.post('/farmer/:farmerId/harvest', completeERPIntegrationController.syncFarmerHarvestWithERP);

/**
 * Sync farmer field data with ERP asset management
 * POST /api/v1/complete-erp-integration/farmer/:farmerId/field
 */
router.post('/farmer/:farmerId/field', completeERPIntegrationController.syncFarmerFieldWithERP);

// ============================================================================
// CROP MODULE ERP INTEGRATION ROUTES
// ============================================================================

/**
 * Sync crop lifecycle stages with ERP production tracking
 * POST /api/v1/complete-erp-integration/crop/:cropId/lifecycle
 */
router.post('/crop/:cropId/lifecycle', completeERPIntegrationController.syncCropLifecycleWithERP);

/**
 * Sync crop yield data with ERP inventory and financial ERP
 * POST /api/v1/complete-erp-integration/crop/:cropId/yield
 */
router.post('/crop/:cropId/yield', completeERPIntegrationController.syncCropYieldWithERP);

// ============================================================================
// LIVESTOCK MODULE ERP INTEGRATION ROUTES
// ============================================================================

/**
 * Sync livestock data with ERP asset management
 * POST /api/v1/complete-erp-integration/livestock/:livestockId
 */
router.post('/livestock/:livestockId', completeERPIntegrationController.syncLivestockWithERP);

/**
 * Sync livestock production with ERP inventory and financial ERP
 * POST /api/v1/complete-erp-integration/livestock/:livestockId/production
 */
router.post('/livestock/:livestockId/production', completeERPIntegrationController.syncLivestockProductionWithERP);

/**
 * Sync livestock health events with ERP asset management and financial ERP
 * POST /api/v1/complete-erp-integration/livestock/:livestockId/health
 */
router.post('/livestock/:livestockId/health', completeERPIntegrationController.syncLivestockHealthWithERP);

// ============================================================================
// INBUILT MODULES ERP INTEGRATION ROUTES
// ============================================================================

/**
 * Sync dairy production with ERP
 * POST /api/v1/complete-erp-integration/dairy/:dairyId/production
 */
router.post('/dairy/:dairyId/production', completeERPIntegrationController.syncDairyProductionWithERP);

/**
 * Sync poultry production with ERP
 * POST /api/v1/complete-erp-integration/poultry/:poultryId/production
 */
router.post('/poultry/:poultryId/production', completeERPIntegrationController.syncPoultryProductionWithERP);

/**
 * Sync goat production with ERP
 * POST /api/v1/complete-erp-integration/goat/:goatId/production
 */
router.post('/goat/:goatId/production', completeERPIntegrationController.syncGoatProductionWithERP);

/**
 * Sync sheep production with ERP
 * POST /api/v1/complete-erp-integration/sheep/:sheepId/production
 */
router.post('/sheep/:sheepId/production', completeERPIntegrationController.syncSheepProductionWithERP);

/**
 * Sync pig production with ERP
 * POST /api/v1/complete-erp-integration/pig/:pigId/production
 */
router.post('/pig/:pigId/production', completeERPIntegrationController.syncPigProductionWithERP);

// ============================================================================
// BULK ERP INTEGRATION ROUTES
// ============================================================================

/**
 * Get ERP integration status for all modules
 * GET /api/v1/complete-erp-integration/status
 */
router.get('/status', completeERPIntegrationController.getERPIntegrationStatus);

/**
 * Force sync all ERP integrations
 * POST /api/v1/complete-erp-integration/force-sync
 */
router.post('/force-sync', completeERPIntegrationController.forceSyncAllERPIntegrations);

module.exports = router;
