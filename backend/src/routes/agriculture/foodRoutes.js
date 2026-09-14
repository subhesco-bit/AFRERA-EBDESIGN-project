/**
 * Food Intelligence & Processing API Routes
 * Food processing, nutrition analysis, traceability, and compliance endpoints
 *
 * M2 (FIXES.md, Medium): reads are public here, matching demandRoutes.js's
 * documented-public pattern — a farmer/buyer should be able to look up batch
 * status or a shelf-life estimate without an account. Writes create/modify
 * supply-chain records (traceability checkpoints, compliance checks, batch
 * data) and now require authMiddleware so those records are attributable.
 * M5 (FIXES.md, Medium): write bodies are now validated with joi via
 * validateBody before the handler runs.
 */

const express = require('express');
const Joi = require('joi');
const FoodIntelligenceEngine = require('../../services/food/FoodIntelligenceEngine');
const { authMiddleware } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/inputValidation');

const router = express.Router();

const startBatchSchema = Joi.object({
  product_id: Joi.string().required(),
  product_name: Joi.string().required(),
  quantity_kg: Joi.number().positive().required(),
  source_location: Joi.string().allow('', null),
  harvest_date: Joi.alternatives(Joi.date(), Joi.string()).allow(null),
  processing_method: Joi.string().allow('', null),
  target_shelf_life: Joi.number().positive().allow(null)
});

/**
 * POST /api/v1/food/processing/start-batch
 * Initialize food processing batch
 */
router.post('/processing/start-batch', authMiddleware, validateBody(startBatchSchema), async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      quantity_kg,
      source_location,
      harvest_date,
      processing_method,
      target_shelf_life,
    } = req.body;

    if (!product_id || !product_name || !quantity_kg) {
      return res.status(400).json({ 
        error: 'product_id, product_name, and quantity_kg are required' 
      });
    }

    const batch = FoodIntelligenceEngine.initializeBatch({
      productId: product_id,
      productName: product_name,
      quantityKg: quantity_kg,
      sourceLocation: source_location || 'Unknown',
      harvestDate: harvest_date || new Date(),
      processingMethod: processing_method || 'FRESH',
      targetShelfLife: target_shelf_life || 7,
    });

    res.status(201).json({
      success: true,
      data: batch,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const nutritionAnalyzeSchema = Joi.object({
  product_name: Joi.string().required(),
  product_type: Joi.string().required(),
  raw_quantity_g: Joi.number().positive().required(),
  processing_loss: Joi.number().min(0).allow(null),
  cooking_method: Joi.string().allow('', null)
});

/**
 * POST /api/v1/food/nutrition/analyze
 * Analyze nutritional content of food product
 */
router.post('/nutrition/analyze', authMiddleware, validateBody(nutritionAnalyzeSchema), async (req, res) => {
  try {
    const {
      product_name,
      product_type,
      raw_quantity_g,
      processing_loss,
      cooking_method,
    } = req.body;

    if (!product_name || !product_type || !raw_quantity_g) {
      return res.status(400).json({ 
        error: 'product_name, product_type, and raw_quantity_g are required' 
      });
    }

    const analysis = FoodIntelligenceEngine.analyzeNutrition({
      productName: product_name,
      productType: product_type,
      rawQuantityG: raw_quantity_g,
      processingLoss: processing_loss || 0,
      cookingMethod: cooking_method || null,
    });

    res.status(200).json({
      success: true,
      data: analysis,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const recordMovementSchema = Joi.object({
  batch_id: Joi.string().required(),
  location: Joi.string().required(),
  operation: Joi.string().required(),
  operator: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  environmental_conditions: Joi.object().unknown(true).allow(null),
  blockchain_hash: Joi.string().allow('', null)
});

/**
 * POST /api/v1/food/traceability/record-movement
 * Record product movement in supply chain
 */
router.post('/traceability/record-movement', authMiddleware, validateBody(recordMovementSchema), async (req, res) => {
  try {
    const {
      batch_id,
      location,
      operation,
      operator,
      notes,
      environmental_conditions,
      blockchain_hash,
    } = req.body;

    if (!batch_id || !location || !operation) {
      return res.status(400).json({ 
        error: 'batch_id, location, and operation are required' 
      });
    }

    const checkpoint = FoodIntelligenceEngine.recordTraceabilityCheckpoint({
      batchId: batch_id,
      location,
      operation,
      operator: operator || null,
      notes: notes || '',
      environmentalConditions: environmental_conditions || {},
      blockchainHash: blockchain_hash || null,
    });

    res.status(201).json({
      success: true,
      data: checkpoint,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const shelfLifeSchema = Joi.object({
  product_type: Joi.string().required(),
  processing_method: Joi.string().allow('', null),
  storage_temperature: Joi.number().required(),
  storage_humidity: Joi.number().min(0).max(100).allow(null),
  packaging_type: Joi.string().allow('', null),
  initial_quality: Joi.number().min(0).max(100).allow(null)
});

/**
 * POST /api/v1/food/shelf-life/predict
 * Predict shelf life based on storage conditions
 */
router.post('/shelf-life/predict', authMiddleware, validateBody(shelfLifeSchema), async (req, res) => {
  try {
    const {
      product_type,
      processing_method,
      storage_temperature,
      storage_humidity,
      packaging_type,
      initial_quality,
    } = req.body;

    if (!product_type || storage_temperature === undefined) {
      return res.status(400).json({ 
        error: 'product_type and storage_temperature are required' 
      });
    }

    const prediction = FoodIntelligenceEngine.predictShelfLife({
      productType: product_type,
      processingMethod: processing_method || 'FRESH',
      storageTemperature: storage_temperature,
      storageHumidity: storage_humidity || 55,
      packagingType: packaging_type || 'STANDARD',
      initialQuality: initial_quality || 100,
    });

    res.status(200).json({
      success: true,
      data: prediction,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const complianceCheckSchema = Joi.object({
  batch_id: Joi.string().required(),
  product_type: Joi.string().required(),
  processing_facility_id: Joi.string().allow('', null),
  certifications_held: Joi.array().items(Joi.string()).allow(null),
  storage_conditions: Joi.object().unknown(true).allow(null)
});

/**
 * POST /api/v1/food/safety/compliance-check
 * Verify compliance with food safety standards
 */
router.post('/safety/compliance-check', authMiddleware, validateBody(complianceCheckSchema), async (req, res) => {
  try {
    const {
      batch_id,
      product_type,
      processing_facility_id,
      certifications_held,
      storage_conditions,
    } = req.body;

    if (!batch_id || !product_type) {
      return res.status(400).json({ 
        error: 'batch_id and product_type are required' 
      });
    }

    const compliance = FoodIntelligenceEngine.verifyCompliance({
      batchId: batch_id,
      productType: product_type,
      processingFacilityId: processing_facility_id || null,
      certificationsHeld: certifications_held || [],
      storageConditions: storage_conditions || {},
    });

    res.status(200).json({
      success: true,
      data: compliance,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/food/batch/:batch_id
 * Get batch details and history
 */
router.get('/batch/:batch_id', async (req, res) => {
  try {
    const { batch_id } = req.params;

    // Placeholder for actual database lookup
    const batch = {
      batch_id,
      product_name: 'Sample Product',
      quantity_kg: 1000,
      status: 'IN_PROCESSING',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      current_stage: 'DRYING',
      quality_score: 95,
      estimated_completion: new Date(Date.now() + 12 * 60 * 60 * 1000),
      traceability_chain: [
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          location: 'Farm ABC',
          operation: 'HARVEST',
        },
        {
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          location: 'Processing Unit XYZ',
          operation: 'RECEIVE',
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: batch,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const organicRecommendSchema = Joi.object({
  batch_id: Joi.string().required(),
  farm_id: Joi.string().required(),
  crop_history: Joi.array().items(Joi.object().unknown(true)).allow(null),
  chemical_usage_records: Joi.array().items(Joi.object().unknown(true)).allow(null),
  pest_management_logs: Joi.array().items(Joi.object().unknown(true)).allow(null)
});

/**
 * POST /api/v1/food/certification/organic-recommend
 * Get organic certification recommendation
 */
router.post('/certification/organic-recommend', authMiddleware, validateBody(organicRecommendSchema), async (req, res) => {
  try {
    const {
      batch_id,
      farm_id,
      crop_history,
      chemical_usage_records,
      pest_management_logs,
    } = req.body;

    if (!batch_id || !farm_id) {
      return res.status(400).json({ 
        error: 'batch_id and farm_id are required' 
      });
    }

    const recommendation = FoodIntelligenceEngine.recommendOrganicCertification({
      batchId: batch_id,
      farmId: farm_id,
      cropHistory: crop_history || [],
      chemicalUsageRecords: chemical_usage_records || [],
      pestManagementLogs: pest_management_logs || [],
    });

    res.status(200).json({
      success: true,
      data: recommendation,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
