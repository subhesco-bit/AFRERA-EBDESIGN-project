const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { rateLimiters } = require('../../middleware/rateLimit');

const read = [rateLimiters.read, authMiddleware];
const write = [rateLimiters.write, authMiddleware, requireRole('admin', 'superadmin')];

// Federated identity management
router.post('/identities', write, controller.createFederatedIdentity);
router.get('/identities/:userId([0-9a-fA-F-]{36})', read, controller.getFederatedIdentities);
router.get('/identities/:identityId([1-9][0-9]*)', read, controller.getFederatedIdentity);
router.put('/identities/:identityId', write, controller.updateFederatedIdentity);
router.post('/identities/:identityId/revoke', write, controller.revokeFederatedIdentity);

// Identity attribute mapping
router.post('/attribute-mappings', write, controller.createAttributeMapping);
router.get('/attribute-mappings/:provider', read, controller.getAttributeMappings);
router.post('/attribute-mappings/apply', read, controller.applyAttributeMapping);

// Federation trust management
router.post('/trust-relationships', write, controller.createTrustRelationship);
router.get('/trust-relationships', read, requireRole('admin', 'superadmin'), controller.getTrustRelationships);
router.post('/trust-relationships/update-score', write, controller.updateTrustScore);

// Centralized identity directory
router.get('/directory/search', read, requireRole('admin', 'superadmin'), controller.searchIdentities);

// AI-powered analysis
router.get('/analytics/patterns', read, requireRole('admin', 'superadmin'), controller.analyzeIdentityPatterns);

// Health monitoring
router.get('/health', read, requireRole('admin', 'superadmin'), controller.getFederationHealth);

module.exports = router;