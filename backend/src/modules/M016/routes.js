const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Federated identity management
router.post('/identities', authMiddleware, requireRole('admin'), controller.createFederatedIdentity);
router.get('/identities/:userId', authMiddleware, controller.getFederatedIdentities);
router.get('/identities/:identityId', authMiddleware, controller.getFederatedIdentity);
router.put('/identities/:identityId', authMiddleware, requireRole('admin'), controller.updateFederatedIdentity);
router.post('/identities/:identityId/revoke', authMiddleware, requireRole('admin'), controller.revokeFederatedIdentity);

// Identity attribute mapping
router.post('/attribute-mappings', authMiddleware, requireRole('admin'), controller.createAttributeMapping);
router.get('/attribute-mappings/:provider', authMiddleware, controller.getAttributeMappings);
router.post('/attribute-mappings/apply', authMiddleware, controller.applyAttributeMapping);

// Federation trust management
router.post('/trust-relationships', authMiddleware, requireRole('admin'), controller.createTrustRelationship);
router.get('/trust-relationships', authMiddleware, requireRole('admin'), controller.getTrustRelationships);
router.post('/trust-relationships/update-score', authMiddleware, requireRole('admin'), controller.updateTrustScore);

// Centralized identity directory
router.get('/directory/search', authMiddleware, controller.searchIdentities);

// AI-powered analysis
router.get('/analytics/patterns', authMiddleware, requireRole('admin'), controller.analyzeIdentityPatterns);

// Health monitoring
router.get('/health', authMiddleware, requireRole('admin'), controller.getFederationHealth);

module.exports = router;