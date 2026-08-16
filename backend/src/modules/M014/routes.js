const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// OAuth2/OIDC endpoints
router.post('/oauth/initiate', controller.initiateOAuthFlow);
router.post('/oauth/callback', controller.handleOAuthCallback);

// SAML endpoints
router.post('/saml/initiate', controller.initiateSAMLFlow);
router.post('/saml/response', controller.handleSAMLResponse);

// Provider management (admin only)
router.post('/providers', authMiddleware, requireRole('admin'), controller.createProviderConfig);
router.get('/providers', authMiddleware, requireRole('admin'), controller.listProviders);

// AI-powered analytics (admin only)
router.get('/analytics', authMiddleware, requireRole('admin'), controller.getSSOAnalytics);
router.get('/anomalies', authMiddleware, requireRole('admin'), controller.detectSSOAnomalies);

module.exports = router;