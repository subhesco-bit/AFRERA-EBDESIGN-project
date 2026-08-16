const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Authentication endpoints
router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/refresh-token', controller.refreshToken);
router.post('/logout', authMiddleware, controller.logout);

// Session management
router.post('/sessions', authMiddleware, controller.createSession);
router.post('/sessions/validate', controller.validateSession);
router.post('/sessions/invalidate', authMiddleware, controller.invalidateSession);
router.post('/sessions/invalidate-all/:userId', authMiddleware, controller.invalidateAllUserSessions);

// Device fingerprinting
router.post('/devices/fingerprint', authMiddleware, controller.recordDeviceFingerprint);
router.get('/devices/:userId', authMiddleware, controller.getUserDevices);

// Security events
router.get('/security-events/:userId', authMiddleware, controller.getUserSecurityEvents);

// Password management
router.post('/change-password', authMiddleware, controller.changePassword);

module.exports = router;
