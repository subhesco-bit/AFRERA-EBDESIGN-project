const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Admin settings (admin only)
router.get('/settings', authMiddleware, requireRole('admin'), controller.listSettings);
router.get('/settings/:name', authMiddleware, requireRole('admin'), controller.getSetting);
router.put('/settings/:name', authMiddleware, requireRole('admin'), controller.upsertSetting);

// Audit ingestion (authenticated services/users)
router.post('/audit', authMiddleware, requireRole('admin'), controller.ingestAudit);

// AI-powered analytics (admin only)
router.get('/analytics', authMiddleware, requireRole('admin'), controller.getSystemAnalytics);
router.get('/anomalies', authMiddleware, requireRole('admin'), controller.detectAnomalies);
router.get('/predictive-maintenance', authMiddleware, requireRole('admin'), controller.getPredictiveMaintenance);

module.exports = router;

