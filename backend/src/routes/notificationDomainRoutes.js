/**
 * Real backend routes for NotificationBell.jsx, backed by
 * services/notificationService.js. getNotifications->getUserNotifications,
 * markAsRead/markAllAsRead are exact matches. userId is server-derived
 * from the authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/notificationService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/notifications', wrap((req) => svc.getUserNotifications(req.user.id, req.query)));
router.put('/notifications/:id/read', wrap((req) => svc.markAsRead(req.params.id, req.user.id)));
router.put('/notifications/read-all', wrap((req) => svc.markAllAsRead(req.user.id)));

module.exports = router;
