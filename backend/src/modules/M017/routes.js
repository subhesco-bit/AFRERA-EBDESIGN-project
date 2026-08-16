const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Consent management
router.post('/consents', authMiddleware, controller.createConsent);
router.get('/consents/:userId', authMiddleware, controller.getUserConsents);
router.get('/consents/:consentId', authMiddleware, controller.getConsent);
router.put('/consents/:consentId', authMiddleware, controller.updateConsent);
router.post('/consents/:consentId/revoke', authMiddleware, controller.revokeConsent);

// Consent category management
router.post('/categories', authMiddleware, requireRole('admin'), controller.createConsentCategory);
router.get('/categories', authMiddleware, controller.getConsentCategories);

// Consent template management
router.post('/templates', authMiddleware, requireRole('admin'), controller.createConsentTemplate);
router.get('/templates', authMiddleware, controller.getConsentTemplates);
router.post('/templates/apply', authMiddleware, controller.applyConsentTemplate);

// AI-powered analysis
router.get('/consents/:userId/compliance', authMiddleware, controller.analyzeConsentCompliance);

// Consent history and audit
router.get('/consents/:consentId/history', authMiddleware, controller.getConsentHistory);

// Automated expiration
router.post('/consents/check-expired', authMiddleware, requireRole('admin'), controller.checkExpiredConsents);

// Analytics
router.get('/analytics', authMiddleware, requireRole('admin'), controller.getConsentAnalytics);

// Bulk operations
router.post('/consents/bulk', authMiddleware, requireRole('admin'), controller.bulkCreateConsents);

module.exports = router;