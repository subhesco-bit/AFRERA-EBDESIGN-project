const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Notification CRUD
router.post('/notifications', authMiddleware, controller.createNotification);
router.get('/notifications', authMiddleware, controller.getNotifications);
router.get('/notifications/:id', authMiddleware, controller.getNotification);
router.put('/notifications/:id/read', authMiddleware, controller.markAsRead);
router.put('/notifications/read-all', authMiddleware, controller.markAllAsRead);

// Notification delivery
router.post('/notifications/:id/deliver', authMiddleware, requireRole('admin'), controller.deliverNotification);

// User preferences
router.get('/preferences/:userId', authMiddleware, controller.getUserPreferences);
router.get('/preferences', authMiddleware, controller.getUserPreferences);
router.put('/preferences', authMiddleware, controller.updateUserPreferences);

// Templates
router.post('/templates', authMiddleware, requireRole('admin'), controller.createTemplate);
router.get('/templates', authMiddleware, requireRole('admin'), controller.getTemplate);
router.post('/templates/render', authMiddleware, requireRole('admin'), controller.renderTemplate);

// Batching
router.post('/batch', authMiddleware, requireRole('admin'), controller.batchNotifications);

// Analytics
router.get('/analytics', authMiddleware, requireRole('admin'), controller.getNotificationAnalytics);

module.exports = router;