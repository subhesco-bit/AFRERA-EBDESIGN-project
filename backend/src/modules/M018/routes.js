const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Data access management
router.post('/access-policies', authMiddleware, requireRole('admin'), controller.createDataAccessPolicy);
router.get('/access-policies', authMiddleware, requireRole('admin'), controller.getDataAccessPolicies);
router.post('/access-check', authMiddleware, controller.checkDataAccess);

// Data masking
router.post('/masking/apply', authMiddleware, controller.applyDataMasking);
router.post('/masking-rules', authMiddleware, requireRole('admin'), controller.createMaskingRule);
router.get('/masking-rules', authMiddleware, requireRole('admin'), controller.getMaskingRules);

// Privacy policy management
router.post('/privacy-policies', authMiddleware, requireRole('admin'), controller.createPrivacyPolicy);
router.get('/privacy-policies', authMiddleware, controller.getPrivacyPolicies);
router.post('/privacy-policies/accept', authMiddleware, controller.acceptPrivacyPolicy);

// AI-powered risk assessment
router.post('/risk-assessment', authMiddleware, controller.assessPrivacyRisk);

// Privacy impact analysis
router.post('/impact-analysis', authMiddleware, controller.performPrivacyImpactAnalysis);

// Compliance monitoring
router.get('/compliance-status', authMiddleware, requireRole('admin'), controller.getPrivacyComplianceStatus);

// Data retention
router.post('/data-retention/enforce', authMiddleware, requireRole('admin'), controller.enforceDataRetention);

module.exports = router;