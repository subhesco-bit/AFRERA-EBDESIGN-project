// Controller for Notification System (M010) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Notification CRUD
async function createNotification(req, res) {
  try {
    const notification = await service.createNotification(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    logger.error('createNotification error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getNotifications(req, res) {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      userId: req.query.userId,
      type: req.query.type,
      status: req.query.status,
      priority: req.query.priority
    };
    const result = await service.getNotifications(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('getNotifications error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getNotification(req, res) {
  try {
    const notification = await service.getNotification(req.params.id);
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('getNotification error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function markAsRead(req, res) {
  try {
    const userId = req.user?.id;
    const notification = await service.markAsRead(req.params.id, userId);
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('markAsRead error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    const userId = req.user?.id;
    const notifications = await service.markAllAsRead(userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    logger.error('markAllAsRead error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Notification delivery
async function deliverNotification(req, res) {
  try {
    const result = await service.deliverNotification(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('deliverNotification error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// User preferences
async function getUserPreferences(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const preferences = await service.getUserPreferences(userId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    logger.error('getUserPreferences error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateUserPreferences(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const preferences = await service.updateUserPreferences(userId, req.body);
    res.json({ success: true, data: preferences });
  } catch (error) {
    logger.error('updateUserPreferences error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Templates
async function createTemplate(req, res) {
  try {
    const template = await service.createTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    logger.error('createTemplate error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getTemplate(req, res) {
  try {
    const { type, language } = req.query;
    const template = await service.getTemplate(type, language);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error) {
    logger.error('getTemplate error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function renderTemplate(req, res) {
  try {
    const { templateId, variables } = req.body;
    const rendered = await service.renderTemplate(templateId, variables);
    res.json({ success: true, data: rendered });
  } catch (error) {
    logger.error('renderTemplate error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Batching
async function batchNotifications(req, res) {
  try {
    const { notificationIds } = req.body;
    const results = await service.batchNotifications(notificationIds);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('batchNotifications error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getNotificationAnalytics(req, res) {
  try {
    const { userId, startDate, endDate } = req.query;
    const analytics = await service.getNotificationAnalytics({ userId, startDate, endDate });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getNotificationAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  // Notification CRUD
  createNotification,
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  
  // Notification delivery
  deliverNotification,
  
  // User preferences
  getUserPreferences,
  updateUserPreferences,
  
  // Templates
  createTemplate,
  getTemplate,
  renderTemplate,
  
  // Batching
  batchNotifications,
  
  // Analytics
  getNotificationAnalytics,
};