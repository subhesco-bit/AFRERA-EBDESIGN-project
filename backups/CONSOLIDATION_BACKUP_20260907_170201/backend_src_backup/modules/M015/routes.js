const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// TOTP endpoints
router.post('/totp/setup', authMiddleware, controller.setupTOTP);
router.post('/totp/verify', authMiddleware, controller.verifyTOTP);

// SMS OTP endpoints
router.post('/sms/send', authMiddleware, controller.sendSMSOTP);
router.post('/sms/verify', authMiddleware, controller.verifySMSOTP);

// Email OTP endpoints
router.post('/email/send', authMiddleware, controller.sendEmailOTP);
router.post('/email/verify', authMiddleware, controller.verifyEmailOTP);

// Biometric endpoints
router.post('/biometric/register', authMiddleware, controller.registerBiometric);
router.post('/biometric/verify', authMiddleware, controller.verifyBiometric);

// Device trust endpoints
router.post('/device/trust', authMiddleware, controller.setDeviceTrust);
router.post('/device/check', authMiddleware, controller.checkDeviceTrust);

// Recovery codes endpoints
router.post('/recovery-codes/generate', authMiddleware, controller.generateRecoveryCodes);
router.post('/recovery-codes/verify', authMiddleware, controller.verifyRecoveryCode);

// Status and management
router.get('/status/:userId', authMiddleware, controller.getMFAStatus);
router.get('/status', authMiddleware, controller.getMFAStatus);
router.post('/disable', authMiddleware, controller.disableMFA);

// AI-powered fraud detection
router.post('/fraud/detect', authMiddleware, controller.detectMFAFraud);

module.exports = router;