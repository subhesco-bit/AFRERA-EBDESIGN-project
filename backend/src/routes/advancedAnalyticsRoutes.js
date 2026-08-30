/**
 * M025: Advanced Analytics Routes
 * Production-level API routes for advanced analytics service
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/advancedAnalyticsService');
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
 * GET /api/analytics/farmer/:farmerId/performance
 * Get farmer performance analytics
 */
router.get('/farmer/:farmerId/performance', 
  authorize(['farmer', 'admin', 'analyst']),
  async (req, res) => {
    try {
      const { farmerId } = req.params;
      const { timeRange = '30d' } = req.query;

      // Authorization check - farmers can only see their own data
      if (req.user.role === 'farmer' && req.user.id !== farmerId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      const result = await analyticsService.getFarmerPerformanceAnalytics(farmerId, timeRange);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Farmer performance analytics retrieved');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'ANALYTICS_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to retrieve farmer performance analytics', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/analytics/market/trends
 * Get market trend analytics
 */
router.get('/market/trends',
  authorize(['admin', 'analyst', 'buyer']),
  async (req, res) => {
    try {
      const { cropType, region, timeRange = '90d' } = req.query;

      if (!cropType) {
        return apiResponseHandler.sendError(res, 'Crop type is required', 400, 'MISSING_PARAMETER');
      }

      const result = await analyticsService.getMarketTrendAnalytics(cropType, region, timeRange);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Market trend analytics retrieved');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'ANALYTICS_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to retrieve market trend analytics', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/analytics/platform
 * Get platform-wide analytics
 */
router.get('/platform',
  authorize(['admin', 'analyst']),
  async (req, res) => {
    try {
      const { timeRange = '30d' } = req.query;

      const result = await analyticsService.getPlatformAnalytics(timeRange);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Platform analytics retrieved');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'ANALYTICS_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to retrieve platform analytics', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/analytics/reports/custom
 * Generate custom analytics report
 */
router.post('/reports/custom',
  authorize(['admin', 'analyst']),
  async (req, res) => {
    try {
      const { metrics, filters, groupBy, timeRange } = req.body;

      if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
        return apiResponseHandler.sendError(res, 'Metrics array is required', 400, 'MISSING_PARAMETER');
      }

      const config = { metrics, filters, groupBy, timeRange };
      const result = await analyticsService.generateCustomReport(config);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Custom report generated');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'REPORT_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to generate custom report', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * DELETE /api/analytics/cache
 * Clear analytics cache
 */
router.delete('/cache',
  authorize(['admin']),
  async (req, res) => {
    try {
      const result = analyticsService.clearCache();
      return apiResponseHandler.sendSuccess(res, null, 'Analytics cache cleared');
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to clear cache', 500, 'SERVER_ERROR', error.message);
    }
  }
);

module.exports = router;