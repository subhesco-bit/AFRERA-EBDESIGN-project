const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Password reset
router.post('/password-reset/initiate', controller.initiatePasswordReset);
router.post('/password-reset/verify', controller.verifyPasswordResetToken);
router.post('/password-reset/reset', controller.resetPassword);

// Security questions
router.post('/security-questions/setup', authMiddleware, controller.setupSecurityQuestions);
router.post('/security-questions/verify/:userId', controller.verifySecurityQuestions);
router.post('/security-questions/verify', authMiddleware, controller.verifySecurityQuestions);

// Account lockout
router.post('/accounts/lock', authMiddleware, requireRole('admin'), controller.lockAccount);
router.post('/accounts/unlock/:userId', authMiddleware, requireRole('admin'), controller.unlockAccount);
router.get('/accounts/:userId/lock-status', authMiddleware, controller.checkAccountLockStatus);
router.get('/accounts/lock-status', authMiddleware, controller.checkAccountLockStatus);

// Recovery tracking
router.get('/recovery-attempts/:userId', authMiddleware, requireRole('admin'), controller.getRecoveryAttempts);
router.get('/recovery-attempts', authMiddleware, controller.getRecoveryAttempts);

// AI-powered fraud detection
router.post('/fraud/detect', controller.detectRecoveryFraud);

// Temporary password
router.post('/temp-password/:userId', authMiddleware, requireRole('admin'), controller.generateTemporaryPassword);

// Analytics
router.get('/analytics', authMiddleware, requireRole('admin'), controller.getRecoveryAnalytics);

module.exports = router;