/**
 * AI MODULES INTEGRATION ROUTER
 * Unified endpoint for all AI modules
 * Routes requests to appropriate AI specialist modules
 */

'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');

// Import all AI module services
const aiModules = {
  M403: require('../../../modules/M403_AGRICULTURAL_AI/backend/service'),
  M405: require('../../../modules/M405_PREDICTIVE_ANALYTICS/backend/service'),
  M407: require('../../../modules/M407_CONVERSATIONAL_AI/backend/service'),
  M777: require('../../../modules/M777_VETERINARY_AI/backend/service'),
  M778: require('../../../modules/M778_CULINARY_AI/backend/service'),
  M779: require('../../../modules/M779_NUTRITION_AI/backend/service'),
  M780: require('../../../modules/M780_IMAGE_GENERATION_AI/backend/service'),
  M781: require('../../../modules/M781_SCRIPT_WRITER_AI/backend/service'),
  M782: require('../../../modules/M782_DISEASE_ANALYZER_AI/backend/service'),
  M783: require('../../../modules/M783_CARTOON_MAKER_AI/backend/service'),
  M784: require('../../../modules/M784_PRESCRIPTION_WRITER_AI/backend/service'),
  M785: require('../../../modules/M785_FARMER_SUPPORT_AI/backend/service'),
};

// Module metadata
const moduleRegistry = {
  'agricultural': { key: 'M403', capabilities: ['crop_recommendation', 'livestock_management', 'dairy_optimization'] },
  'predictive': { key: 'M405', capabilities: ['yield_prediction', 'disease_prediction', 'market_trends'] },
  'chat': { key: 'M407', capabilities: ['farmer_support', 'q_a_system', 'language_translation'] },
  'veterinary': { key: 'M777', capabilities: ['animal_diagnosis', 'disease_detection', 'treatment_recommendation'] },
  'chef': { key: 'M778', capabilities: ['recipe_generation', 'meal_planning', 'nutrition_analysis'] },
  'nutrition': { key: 'M779', capabilities: ['nutrition_planning', 'dietary_recommendation', 'health_assessment'] },
  'image': { key: 'M780', capabilities: ['image_generation', 'design_creation'] },
  'script': { key: 'M781', capabilities: ['script_generation', 'story_writing'] },
  'disease_analyzer': { key: 'M782', capabilities: ['disease_identification', 'treatment_recommendation', 'farmer_letter'] },
  'cartoon': { key: 'M783', capabilities: ['character_design', 'story_animation'] },
  'prescription': { key: 'M784', capabilities: ['prescription_generation', 'medicine_recommendation'] },
  'farmer_support': { key: 'M785', capabilities: ['farming_guidance', 'crisis_management', 'market_information'] },
};

/**
 * POST /api/v1/ai-modules/process
 * Universal endpoint for all AI modules
 */
router.post('/process', async (req, res) => {
  try {
    const { module, capability, data, provider } = req.body;

    if (!module || !capability || !data) {
      return res.status(400).json({
        success: false,
        error: 'module, capability, and data are required'
      });
    }

    const moduleConfig = moduleRegistry[module.toLowerCase()];
    if (!moduleConfig) {
      return res.status(400).json({
        success: false,
        error: `Unknown module: ${module}. Available: ${Object.keys(moduleRegistry).join(', ')}`
      });
    }

    if (!moduleConfig.capabilities.includes(capability)) {
      return res.status(400).json({
        success: false,
        error: `Unknown capability: ${capability}. Available for ${module}: ${moduleConfig.capabilities.join(', ')}`
      });
    }

    const service = aiModules[moduleConfig.key];
    const result = await service.process({ capability, data, provider });

    res.json(result);
  } catch (error) {
    logger.error('AI Modules error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/ai-modules/registry
 * List all available AI modules and capabilities
 */
router.get('/registry', (req, res) => {
  const modules = Object.entries(moduleRegistry).map(([name, config]) => ({
    name,
    moduleId: config.key,
    capabilities: config.capabilities,
  }));

  res.json({
    success: true,
    totalModules: modules.length,
    modules,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/ai-modules/:module/capabilities
 * Get capabilities for specific module
 */
router.get('/:module/capabilities', (req, res) => {
  const { module } = req.params;
  const config = moduleRegistry[module.toLowerCase()];

  if (!config) {
    return res.status(404).json({
      success: false,
      error: `Module not found: ${module}`
    });
  }

  const service = aiModules[config.key];
  const svc = service.getInstance();

  res.json({
    success: true,
    moduleId: svc.moduleId,
    name: svc.name,
    capabilities: svc.capabilities,
  });
});

/**
 * GET /api/v1/ai-modules/:module/metrics
 * Get metrics for specific module
 */
router.get('/:module/metrics', (req, res) => {
  const { module } = req.params;
  const config = moduleRegistry[module.toLowerCase()];

  if (!config) {
    return res.status(404).json({
      success: false,
      error: `Module not found: ${module}`
    });
  }

  const service = aiModules[config.key];
  const metrics = service.getMetrics();

  res.json({
    success: true,
    module: config.key,
    metrics,
  });
});

/**
 * Error handler
 */
router.use((err, req, res, next) => {
  logger.error('AI Modules route error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

module.exports = router;
