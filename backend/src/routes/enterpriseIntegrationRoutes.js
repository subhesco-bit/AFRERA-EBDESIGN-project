/**
 * M030: Enterprise Integration Routes
 * Production-level API routes for enterprise integration service
 */

const express = require('express');
const router = express.Router();
const enterpriseService = require('../services/enterpriseIntegrationService');
const apiResponseHandler = require('../middleware/apiResponseHandler');
// '../middleware/authMiddleware' does not exist in this repo - the real module is
// '../middleware/auth', exporting authMiddleware/requireRole, not authenticate/authorize.
const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply authentication and rate limiting
router.use(authenticate);
router.use(apiLimiter);

/**
 * POST /api/enterprise/integrations
 * Register new integration
 */
router.post('/integrations',
  authorize(['admin', 'organization_admin']),
  async (req, res) => {
    try {
      const integrationData = req.body;
      const { organizationId } = integrationData;

      // Authorization check
      if (req.user.role === 'organization_admin' && req.user.organizationId !== organizationId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      const result = await enterpriseService.registerIntegration(integrationData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Integration registered successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'REGISTRATION_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to register integration', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/enterprise/integrations/:integrationId/sync
 * Sync data with ERP system
 */
router.post('/integrations/:integrationId/sync',
  authorize(['admin', 'organization_admin']),
  async (req, res) => {
    try {
      const { integrationId } = req.params;
      const syncConfig = req.body;

      let result = await enterpriseService.syncWithERP(integrationId, syncConfig);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'ERP sync completed successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'SYNC_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to sync with ERP', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/enterprise/integrations/:integrationId/payments
 * Process payment through gateway
 */
router.post('/integrations/:integrationId/payments',
  authorize(['admin', 'organization_admin', 'system']),
  async (req, res) => {
    try {
      const { integrationId } = req.params;
      const paymentData = req.body;

      let result = await enterpriseService.processPayment(integrationId, paymentData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Payment processed successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'PAYMENT_ERROR', result.validationErrors);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to process payment', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/enterprise/integrations/:integrationId/logistics
 * Sync logistics data
 */
router.post('/integrations/:integrationId/logistics',
  authorize(['admin', 'organization_admin', 'logistics_provider']),
  async (req, res) => {
    try {
      const { integrationId } = req.params;
      const logisticsData = req.body;

      let result = await enterpriseService.syncLogistics(integrationId, logisticsData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Logistics sync completed successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'LOGISTICS_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to sync logistics', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/enterprise/integrations/:integrationId/analytics
 * Send analytics data
 */
router.post('/integrations/:integrationId/analytics',
  authorize(['admin', 'organization_admin', 'system']),
  async (req, res) => {
    try {
      const { integrationId } = req.params;
      const analyticsData = req.body;

      let result = await enterpriseService.sendAnalytics(integrationId, analyticsData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Analytics data sent successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'ANALYTICS_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to send analytics', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/enterprise/integrations/:integrationId/communications
 * Send communication message
 */
router.post('/integrations/:integrationId/communications',
  authorize(['admin', 'organization_admin']),
  async (req, res) => {
    try {
      const { integrationId } = req.params;
      const messageData = req.body;

      let result = await enterpriseService.sendCommunication(integrationId, messageData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Communication sent successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'COMMUNICATION_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to send communication', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/enterprise/integrations/:integrationId
 * Get integration details
 */
router.get('/integrations/:integrationId',
  authorize(['admin', 'organization_admin']),
  async (req, res) => {
    try {
      const { integrationId } = req.params;

      const integration = await enterpriseService.getIntegration(integrationId);
      
      if (!integration) {
        return apiResponseHandler.sendError(res, 'Integration not found', 404, 'INTEGRATION_NOT_FOUND', integrationId);
      }

      // Remove sensitive data
      const { api_key, ...safeIntegration } = integration;

      return apiResponseHandler.sendSuccess(res, safeIntegration, 'Integration details retrieved');
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get integration details', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/enterprise/organizations/:organizationId/integrations
 * Get organization integrations
 */
router.get('/organizations/:organizationId/integrations',
  authorize(['admin', 'organization_admin']),
  async (req, res) => {
    try {
      const { organizationId } = req.params;

      // Authorization check
      if (req.user.role === 'organization_admin' && req.user.organizationId !== organizationId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      let result = await enterpriseService.getOrganizationIntegrations(organizationId);
      
      if (result.success) {
        // Remove sensitive data from each integration
        const safeIntegrations = result.data.integrations.map(integration => {
          const { api_key, ...safeIntegration } = integration;
          return safeIntegration;
        });

        return apiResponseHandler.sendSuccess(res, {
          ...result.data,
          integrations: safeIntegrations
        }, 'Organization integrations retrieved');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'RETRIEVAL_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get organization integrations', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/enterprise/integrations/:integrationId/health
 * Get integration health status
 */
router.get('/integrations/:integrationId/health',
  authorize(['admin', 'organization_admin']),
  async (req, res) => {
    try {
      const { integrationId } = req.params;

      let result = await enterpriseService.getIntegrationHealth(integrationId);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Integration health status retrieved');
      } else {
        return apiResponseHandler.sendError(res, result.error, 404, 'INTEGRATION_NOT_FOUND', result.integrationId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get integration health', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * DELETE /api/enterprise/integrations/:integrationId
 * Deactivate integration
 */
router.delete('/integrations/:integrationId',
  authorize(['admin', 'organization_admin']),
  async (req, res) => {
    try {
      const { integrationId } = req.params;

      let result = await enterpriseService.deactivateIntegration(integrationId);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Integration deactivated successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 404, 'INTEGRATION_NOT_FOUND', result.integrationId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to deactivate integration', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * DELETE /api/enterprise/cache
 * Clear integration cache
 */
router.delete('/cache',
  authorize(['admin']),
  async (req, res) => {
    try {
      let result = enterpriseService.clearCache();
      return apiResponseHandler.sendSuccess(res, null, result.message);
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to clear cache', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/enterprise/system/status
 * Get enterprise integration system status
 */
router.get('/system/status',
  authorize(['admin', 'analyst']),
  async (req, res) => {
    try {
      const systemStatus = {
        activeIntegrations: enterpriseService.getActiveIntegrationsCount(),
        systemHealth: 'operational',
        supportedIntegrationTypes: ['erp', 'payment_gateway', 'logistics', 'analytics', 'communication'],
        timestamp: new Date().toISOString()
      };

      return apiResponseHandler.sendSuccess(res, systemStatus, 'Enterprise integration system status retrieved');
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get system status', 500, 'SERVER_ERROR', error.message);
    }
  }
);

module.exports = router;