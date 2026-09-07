const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware } = require('../../middleware/auth');

// login/register/refresh-token/logout were deleted here (2026-08-17), not
// just blocked: they duplicated the canonical authService.js (mounted at
// /api/v1/auth) against the same `users` table with a weaker implementation
// (hardcoded fallback JWT secret, no account-lockout logic). Leaving the
// dangerous code in place behind a 410 gate was still a live risk - it
// remained reachable by anything calling controller.login directly, and by
// anyone who removed the gate later without knowing why. Use
// /api/v1/auth/login, /register, /refresh, /logout instead. Sessions,
// devices, security-events, and change-password below are real and
// unrelated - kept as-is.

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
