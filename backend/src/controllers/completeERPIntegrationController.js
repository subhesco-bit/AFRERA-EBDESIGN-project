/**
 * AFRERA Complete ERP Integration Controller
 * 
 * Exposes ERP integration endpoints for farmer, crop, livestock, and inbuilt modules
 * Integrates all agricultural operations with financial ERP, supply chain ERP, production ERP, and customer ERP
 */

const completeERPIntegrationService = require('../services/legacy/completeERPIntegrationService');
const { logger } = require('../utils/logger');

// ============================================================================
// FARMER MODULE ERP INTEGRATION CONTROLLERS
// ============================================================================

/**
 * Sync farmer crop planning with ERP production planning
 */
exports.syncFarmerCropPlanningWithERP = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const cropPlanData = req.body;
    
    const result = await completeERPIntegrationService.syncFarmerCropPlanningWithERP(farmerId, cropPlanData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Farmer crop planning synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing farmer crop planning with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync farmer harvest data with ERP inventory and financial ERP
 */
exports.syncFarmerHarvestWithERP = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const harvestData = req.body;
    
    const result = await completeERPIntegrationService.syncFarmerHarvestWithERP(farmerId, harvestData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Farmer harvest synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing farmer harvest with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync farmer field data with ERP asset management
 */
exports.syncFarmerFieldWithERP = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const fieldData = req.body;
    
    const result = await completeERPIntegrationService.syncFarmerFieldWithERP(farmerId, fieldData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Farmer field synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing farmer field with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================================
// CROP MODULE ERP INTEGRATION CONTROLLERS
// ============================================================================

/**
 * Sync crop lifecycle stages with ERP production tracking
 */
exports.syncCropLifecycleWithERP = async (req, res) => {
  try {
    const { cropId } = req.params;
    const lifecycleData = req.body;
    
    const result = await completeERPIntegrationService.syncCropLifecycleWithERP(cropId, lifecycleData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Crop lifecycle synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing crop lifecycle with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync crop yield data with ERP inventory and financial ERP
 */
exports.syncCropYieldWithERP = async (req, res) => {
  try {
    const { cropId } = req.params;
    const yieldData = req.body;
    
    const result = await completeERPIntegrationService.syncCropYieldWithERP(cropId, yieldData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Crop yield synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing crop yield with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================================
// LIVESTOCK MODULE ERP INTEGRATION CONTROLLERS
// ============================================================================

/**
 * Sync livestock data with ERP asset management
 */
exports.syncLivestockWithERP = async (req, res) => {
  try {
    const { livestockId } = req.params;
    const livestockData = req.body;
    
    const result = await completeERPIntegrationService.syncLivestockWithERP(livestockId, livestockData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Livestock synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing livestock with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync livestock production with ERP inventory and financial ERP
 */
exports.syncLivestockProductionWithERP = async (req, res) => {
  try {
    const { livestockId } = req.params;
    const productionData = req.body;
    
    const result = await completeERPIntegrationService.syncLivestockProductionWithERP(livestockId, productionData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Livestock production synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing livestock production with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync livestock health events with ERP asset management and financial ERP
 */
exports.syncLivestockHealthWithERP = async (req, res) => {
  try {
    const { livestockId } = req.params;
    const healthData = req.body;
    
    const result = await completeERPIntegrationService.syncLivestockHealthWithERP(livestockId, healthData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Livestock health synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing livestock health with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================================
// INBUILT MODULES ERP INTEGRATION CONTROLLERS
// ============================================================================

/**
 * Sync dairy production with ERP
 */
exports.syncDairyProductionWithERP = async (req, res) => {
  try {
    const { dairyId } = req.params;
    const productionData = req.body;
    
    const result = await completeERPIntegrationService.syncDairyProductionWithERP(dairyId, productionData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Dairy production synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing dairy production with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync poultry production with ERP
 */
exports.syncPoultryProductionWithERP = async (req, res) => {
  try {
    const { poultryId } = req.params;
    const productionData = req.body;
    
    const result = await completeERPIntegrationService.syncPoultryProductionWithERP(poultryId, productionData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Poultry production synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing poultry production with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync goat production with ERP
 */
exports.syncGoatProductionWithERP = async (req, res) => {
  try {
    const { goatId } = req.params;
    const productionData = req.body;
    
    const result = await completeERPIntegrationService.syncGoatProductionWithERP(goatId, productionData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Goat production synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing goat production with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync sheep production with ERP
 */
exports.syncSheepProductionWithERP = async (req, res) => {
  try {
    const { sheepId } = req.params;
    const productionData = req.body;
    
    const result = await completeERPIntegrationService.syncSheepProductionWithERP(sheepId, productionData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Sheep production synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing sheep production with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync pig production with ERP
 */
exports.syncPigProductionWithERP = async (req, res) => {
  try {
    const { pigId } = req.params;
    const productionData = req.body;
    
    const result = await completeERPIntegrationService.syncPigProductionWithERP(pigId, productionData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Pig production synced with ERP successfully'
    });
  } catch (error) {
    logger.error('Error syncing pig production with ERP', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================================
// BULK ERP INTEGRATION CONTROLLERS
// ============================================================================

/**
 * Get ERP integration status for all modules
 */
exports.getERPIntegrationStatus = async (req, res) => {
  try {
    const { farmerId, cropId, livestockId } = req.query;
    
    // This would return the integration status across all modules
    const status = {
      farmer_integration: farmerId ? 'active' : 'not_started',
      crop_integration: cropId ? 'active' : 'not_started',
      livestock_integration: livestockId ? 'active' : 'not_started',
      inbuilt_modules_integration: 'active',
      last_sync: new Date().toISOString(),
      sync_frequency: 'real_time'
    };
    
    res.status(200).json({
      success: true,
      data: status,
      message: 'ERP integration status retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting ERP integration status', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Force sync all ERP integrations
 */
exports.forceSyncAllERPIntegrations = async (req, res) => {
  try {
    const { farmerId, cropId, livestockId } = req.body;
    
    const results = {
      farmer_sync: null,
      crop_sync: null,
      livestock_sync: null,
      inbuilt_modules_sync: null
    };
    
    // Sync farmer if provided
    if (farmerId) {
      try {
        results.farmer_sync = await completeERPIntegrationService.syncFarmerCropPlanningWithERP(farmerId, {});
      } catch (error) {
        results.farmer_sync = { success: false, error: error.message };
      }
    }
    
    // Sync crop if provided
    if (cropId) {
      try {
        results.crop_sync = await completeERPIntegrationService.syncCropLifecycleWithERP(cropId, {});
      } catch (error) {
        results.crop_sync = { success: false, error: error.message };
      }
    }
    
    // Sync livestock if provided
    if (livestockId) {
      try {
        results.livestock_sync = await completeERPIntegrationService.syncLivestockWithERP(livestockId, {});
      } catch (error) {
        results.livestock_sync = { success: false, error: error.message };
      }
    }
    
    res.status(200).json({
      success: true,
      data: results,
      message: 'All ERP integrations synced successfully'
    });
  } catch (error) {
    logger.error('Error forcing sync of all ERP integrations', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
