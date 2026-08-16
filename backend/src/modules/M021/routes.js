const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Farmer CRUD
router.post('/farmers', authMiddleware, requireRole('admin'), controller.registerFarmer);
router.get('/farmers', authMiddleware, controller.listFarmers);
router.get('/farmers/:farmerId', authMiddleware, controller.getFarmer);
router.put('/farmers/:farmerId', authMiddleware, requireRole('admin'), controller.updateFarmer);

// AI-powered analysis
router.get('/farmers/:farmerId/analysis', authMiddleware, controller.analyzeFarmerProfile);

// Verification
router.post('/farmers/:farmerId/verify', authMiddleware, requireRole('admin'), controller.verifyFarmer);
router.post('/farmers/:farmerId/verify/approve', authMiddleware, requireRole('admin'), controller.approveFarmerVerification);

// Onboarding
router.post('/farmers/:farmerId/onboarding', authMiddleware, controller.initiateOnboarding);
router.put('/farmers/:farmerId/onboarding/progress', authMiddleware, controller.updateOnboardingProgress);

// Analytics
router.get('/farmers/analytics', authMiddleware, requireRole('admin'), controller.getFarmerAnalytics);

module.exports = router;