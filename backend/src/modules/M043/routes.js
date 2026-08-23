const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../../middleware/roleGroups');

// Crop Registration CRUD
router.post('/registrations', authMiddleware, controller.registerCrop);
router.get('/registrations', authMiddleware, controller.listCropRegistrations);
router.get('/registrations/:registrationId', authMiddleware, controller.getCropRegistration);
router.put('/registrations/:registrationId', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), controller.updateCropRegistration);
router.delete('/registrations/:registrationId', authMiddleware, requireRole('admin'), controller.deleteCropRegistration);

// AI-powered recommendations
router.get('/farmers/:farmerId/recommend', authMiddleware, controller.recommendCrops);

// Yield estimation
router.post('/registrations/:registrationId/estimate-yield', authMiddleware, controller.estimateYield);

// Analytics
router.get('/registrations/analytics', authMiddleware, requireRole('admin'), controller.getCropAnalytics);

module.exports = router;

