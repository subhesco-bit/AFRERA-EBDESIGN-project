// Express routes for User Management (M011) - AI Enhanced
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// List users (admin only)
router.get('/', authMiddleware, requireRole('admin'), controller.list);
// Create user (admin only)
router.post('/', authMiddleware, requireRole('admin'), controller.create);
// Get user by id (admin only)
router.get('/:id', authMiddleware, requireRole('admin'), controller.get);
// Update (admin only)
router.put('/:id', authMiddleware, requireRole('admin'), controller.update);
// Delete (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), controller.remove);

// AI-powered analytics (admin only)
router.get('/:userId/analytics', authMiddleware, requireRole('admin'), controller.getUserAnalytics);
router.get('/:userId/activity', authMiddleware, requireRole('admin'), controller.getUserActivity);
router.get('/:userId/engagement-score', authMiddleware, requireRole('admin'), controller.getUserEngagementScore);
router.get('/:userId/behavior-profile', authMiddleware, requireRole('admin'), controller.getUserBehaviorProfile);

// Bulk operations (admin only)
router.post('/bulk-create', authMiddleware, requireRole('admin'), controller.bulkCreateUsers);

module.exports = router;

