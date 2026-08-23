const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../../middleware/roleGroups');

// Seed Planning CRUD
router.post('/plans', authMiddleware, controller.createSeedPlan);
router.get('/plans', authMiddleware, controller.listSeedPlans);
router.get('/plans/:planId', authMiddleware, controller.getSeedPlan);
router.put('/plans/:planId', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), controller.updateSeedPlan);
router.delete('/plans/:planId', authMiddleware, requireRole('admin'), controller.deleteSeedPlan);

// AI-powered calculation
router.post('/calculate-requirements', authMiddleware, controller.calculateSeedRequirements);

// Supplier management
router.post('/suppliers', authMiddleware, requireRole('admin'), controller.addSeedSupplier);
router.get('/suppliers', authMiddleware, controller.listSeedSuppliers);

// Analytics
router.get('/plans/analytics', authMiddleware, requireRole('admin'), controller.getSeedAnalytics);

module.exports = router;

