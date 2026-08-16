const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Security event logging
router.post('/events', authMiddleware, controller.createSecurityEvent);
router.get('/events', authMiddleware, requireRole('admin'), controller.getSecurityEvents);

// IP whitelist/blacklist
router.post('/ip-list', authMiddleware, requireRole('admin'), controller.addToIpList);
router.delete('/ip-list', authMiddleware, requireRole('admin'), controller.removeFromIpList);
router.get('/ip-list/:listType', authMiddleware, requireRole('admin'), controller.getIpLists);
router.post('/ip-list/check', controller.checkIpAccess);

// Rate limiting
router.post('/rate-limit/check', controller.checkRateLimit);

// AI-powered threat detection
router.get('/threats/detect', authMiddleware, requireRole('admin'), controller.detectThreats);

// Security score
router.get('/users/:userId/security-score', authMiddleware, requireRole('admin'), controller.calculateSecurityScore);

// Access control policies
router.post('/policies', authMiddleware, requireRole('admin'), controller.createAccessPolicy);
router.post('/policies/evaluate', authMiddleware, controller.evaluateAccessPolicy);

module.exports = router;