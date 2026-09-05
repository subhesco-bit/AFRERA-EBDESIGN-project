/**
 * M026: Predictive Intelligence Routes
 * Production-level API routes for predictive intelligence service
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const predictiveService = require('../services/predictiveIntelligenceService');
const apiResponseHandler = require('../middleware/apiResponseHandler');
// '../middleware/authMiddleware' does not exist in this repo - the real module is
// '../middleware/auth', exporting authMiddleware/requireRole, not authenticate/authorize.
const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const { rateLimiter } = require('../middleware/rateLimiter');

// Apply authentication and rate limiting
router.use(authenticate);
router.use(rateLimiter);

/**
 * GET /api/predictive/demand/:cropType
 * Predict crop demand forecast
 */
router.get
    // Log request
    logger.debug('router.get request');('/demand/:cropType',
  authorize(['farmer', 'admin', 'analyst', 'buyer']),
  async (req, res) => {
    try {
      const { cropType } = req.params;
      const { region, forecastDays = 30 } = req.query;

      const result = await predictiveService.predictCropDemand(cropType, region, parseInt(forecastDays));
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Demand forecast generated');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'PREDICTION_ERROR', null, {
          dataPoints: result.dataPoints
        });
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to generate demand forecast', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/predictive/pricing/:cropType
 * Predict optimal pricing
 */
router.get
    // Log request
    logger.debug('router.get request');('/pricing/:cropType',
  authorize(['farmer', 'admin', 'analyst']),
  async (req, res) => {
    try {
      const { cropType } = req.params;
      const { region, qualityGrade = 'standard' } = req.query;

      let result = await predictiveService.predictOptimalPricing(cropType, region, qualityGrade);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Pricing prediction generated');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'PREDICTION_ERROR', null, {
          dataPoints: result.dataPoints
        });
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to generate pricing prediction', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/predictive/yield
 * Predict crop yield
 */
router.post
    // Log request
    logger.debug('router.post request');('/yield',
  authorize(['farmer', 'admin', 'analyst']),
  async (req, res) => {
    try {
      const { farmerId, cropId, conditions } = req.body;

      if (!farmerId || !cropId || !conditions) {
        return apiResponseHandler.sendError(res, 'Missing required parameters', 400, 'MISSING_PARAMETER');
      }

      // Authorization check
      if (req.user.role === 'farmer' && req.user.id !== farmerId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      let result = await predictiveService.predictCropYield(farmerId, cropId, conditions);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Yield prediction generated');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'PREDICTION_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to generate yield prediction', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/predictive/seasonal/:region/:season
 * Get seasonal recommendations
 */
router.get
    // Log request
    logger.debug('router.get request');('/seasonal/:region/:season',
  authorize(['farmer', 'admin', 'analyst']),
  async (req, res) => {
    try {
      const { region, season } = req.params;

      let result = await predictiveService.getSeasonalRecommendations(region, season);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Seasonal recommendations retrieved');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'PREDICTION_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get seasonal recommendations', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/predictive/models/status
 * Get predictive models status
 */
router.get
    // Log request
    logger.debug('router.get request');('/models/status',
  authorize(['admin', 'analyst']),
  async (req, res) => {
    try {
      const modelsStatus = {
        demand: predictiveService.models.demand,
        pricing: predictiveService.models.pricing,
        yield: predictiveService.models.yield,
        overallStatus: 'operational',
        lastUpdated: new Date().toISOString()
      };

      return apiResponseHandler.sendSuccess(res, modelsStatus, 'Predictive models status retrieved');
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get models status', 500, 'SERVER_ERROR', error.message);
    }
  }
);

module.exports = router;