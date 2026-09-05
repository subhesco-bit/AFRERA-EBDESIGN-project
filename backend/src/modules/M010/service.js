// Service for Notification System (M010) - AI Enhanced
// Comprehensive notification management with AI-powered routing and multi-channel delivery
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Notification creation
async function createNotification(notificationData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { userId, type, title, message, data, priority, channels, scheduledFor } = notificationData;
  
  // AI-powered priority assignment if not provided
  const finalPriority = priority || await calculateNotificationPriority(type, data);
  
  const res = await pg.query(
    `INSERT INTO notifications (user_id, type, title, message, data, priority, channels, scheduled_for, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), NOW())
     RETURNING *`,
    [userId, type, title, message, data ? JSON.stringify(data) : null, finalPriority, JSON.stringify(channels || ['in_app']), scheduledFor]
  );
  
  // Emit signal for notification creation
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'notification',
    notificationId: res.rows[0].id,
    userId,
    type,
    priority: finalPriority
  }, {
    severity: finalPriority === 'critical' ? SEVERITY.CRITICAL : finalPriority === 'high' ? SEVERITY.WARNING : SEVERITY.INFO,
    source: 'notification_service',
    entityId: userId
  });
  
  // Trigger delivery if not scheduled
  if (!scheduledFor) {
    await deliverNotification(res.rows[0].id);
  }
  
  return res.rows[0];
}

async function getNotifications({ page = 1, limit = 20, userId, type, status, priority } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM notifications WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (userId) {
    query += ` AND user_id = $${paramIndex++}`;
    params.push(userId);
  }
  if (type) {
    query += ` AND type = $${paramIndex++}`;
    params.push(type);
  }
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  if (priority) {
    query += ` AND priority = $${paramIndex++}`;
    params.push(priority);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);
  
  let res = await pg.query(query, params);
  const totalRes = await pg.query(query.replace(`SELECT * FROM notifications`, 'SELECT COUNT(*) FROM notifications').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');
  
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function getNotification(id) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let res = await pg.query('SELECT * FROM notifications WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function markAsRead(id, userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let res = await pg.query(
    `UPDATE notifications 
     SET read = true, read_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
  return res.rows[0] || null;
}

async function markAllAsRead(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let res = await pg.query(
    `UPDATE notifications 
     SET read = true, read_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND read = false
     RETURNING *`,
    [userId]
  );
  return res.rows;
}

// Notification delivery
async function deliverNotification(notificationId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const notification = await getNotification(notificationId);
  if (!notification) {
    logger.error('Notification not found for delivery', { notificationId });
    return { success: false, error: 'Notification not found' };
  }
  
  const deliveryResults = [];
  const channels = notification.channels || ['in_app'];
  
  for (const channel of channels) {
    try {
      const result = await deliverViaChannel(notification, channel);
      deliveryResults.push({ channel, success: true, result });
      
      // Log delivery
      await pg.query(
        `INSERT INTO notification_deliveries (notification_id, channel, status, delivered_at, details)
         VALUES ($1, $2, 'delivered', NOW(), $3)`,
        [notificationId, channel, JSON.stringify(result)]
      );
    } catch (error) {
      logger.error(`Failed to deliver notification via ${channel}`, { error: error.message, notificationId });
      deliveryResults.push({ channel, success: false, error: error.message });
      
      // Log failure
      await pg.query(
        `INSERT INTO notification_deliveries (notification_id, channel, status, error_message, details)
         VALUES ($1, $2, 'failed', $3, $4)`,
        [notificationId, channel, error.message, JSON.stringify({ stack: error.stack })]
      );
    }
  }
  
  // Update notification status
  const allDelivered = deliveryResults.every(r => r.success);
  await pg.query(
    `UPDATE notifications 
     SET status = $1, delivered_at = NOW(), updated_at = NOW()
     WHERE id = $2`,
    [allDelivered ? 'delivered' : 'partial', notificationId]
  );
  
  return { success: allDelivered, deliveryResults };
}

async function deliverViaChannel(notification, channel) {
  switch (channel) {
    case 'in_app':
      // In-app notifications are stored and fetched by frontend
      return { method: 'in_app', status: 'queued' };
    
    case 'email':
      // Email delivery (would integrate with email service)
      return await deliverEmail(notification);
    
    case 'sms':
      // SMS delivery (would integrate with SMS service)
      return await deliverSMS(notification);
    
    case 'push':
      // Push notification (would integrate with push service)
      return await deliverPush(notification);
    
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
}

async function deliverEmail(notification) {
  // Placeholder for email delivery
  // Would integrate with email service
  logger.info('Email notification queued', { notificationId: notification.id, userId: notification.user_id });
  return { method: 'email', status: 'queued', messageId: `email_${notification.id}_${Date.now()}` };
}

async function deliverSMS(notification) {
  // Placeholder for SMS delivery
  // Would integrate with SMS service
  logger.info('SMS notification queued', { notificationId: notification.id, userId: notification.user_id });
  return { method: 'sms', status: 'queued', messageId: `sms_${notification.id}_${Date.now()}` };
}

async function deliverPush(notification) {
  // Placeholder for push notification
  // Would integrate with push service
  logger.info('Push notification queued', { notificationId: notification.id, userId: notification.user_id });
  return { method: 'push', status: 'queued', messageId: `push_${notification.id}_${Date.now()}` };
}

// Notification preferences
async function getUserPreferences(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query(
    'SELECT * FROM notification_preferences WHERE user_id = $1',
    [userId]
  );
  
  return res.rows[0] || getDefaultPreferences();
}

async function updateUserPreferences(userId, preferences) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { channels, types, quietHours, digestFrequency } = preferences;
  
  let res = await pg.query(
    `INSERT INTO notification_preferences (user_id, channels, types, quiet_hours, digest_frequency, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       channels = COALESCE(EXCLUDED.channels, notification_preferences.channels),
       types = COALESCE(EXCLUDED.types, notification_preferences.types),
       quiet_hours = COALESCE(EXCLUDED.quiet_hours, notification_preferences.quiet_hours),
       digest_frequency = COALESCE(EXCLUDED.digest_frequency, notification_preferences.digest_frequency),
       updated_at = NOW()
     RETURNING *`,
    [userId, JSON.stringify(channels), JSON.stringify(types), JSON.stringify(quietHours), digestFrequency]
  );
  
  return res.rows[0];
}

function getDefaultPreferences() {
  return {
    channels: ['in_app', 'email'],
    types: ['all'],
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    digestFrequency: 'daily'
  };
}

// Notification templates
async function createTemplate(templateData) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { name, type, subject, bodyTemplate, variables, language } = templateData;
  
  let res = await pg.query(
    `INSERT INTO notification_templates (name, type, subject, body_template, variables, language, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [name, type, subject, bodyTemplate, JSON.stringify(variables), language || 'en']
  );
  
  return res.rows[0];
}

async function getTemplate(type, language = 'en') {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query(
    'SELECT * FROM notification_templates WHERE type = $1 AND language = $2 AND is_active = true',
    [type, language]
  );
  
  return res.rows[0] || null;
}

async function renderTemplate(templateId, variables) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const template = await pg.query(
    'SELECT * FROM notification_templates WHERE id = $1',
    [templateId]
  );
  
  if (!template.rows[0]) {
    throw new Error('Template not found');
  }
  
  const tmpl = template.rows[0];
  let renderedSubject = tmpl.subject;
  let renderedBody = tmpl.body_template;
  
  // Simple variable substitution
  const vars = tmpl.variables || [];
  vars.forEach(variable => {
    const value = variables[variable] || '';
    renderedSubject = renderedSubject.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    renderedBody = renderedBody.replace(new RegExp(`{{${variable}}}`, 'g'), value);
  });
  
  return {
    subject: renderedSubject,
    body: renderedBody
  };
}

// AI-powered priority calculation
async function calculateNotificationPriority(type, data) {
  // AI-based priority assignment based on notification type and context
  const criticalTypes = ['security_alert', 'emergency', 'system_critical', 'payment_failed'];
  const highTypes = ['deadline_reminder', 'approval_required', 'account_change', 'subscription_expiry'];
  const mediumTypes = ['update', 'announcement', 'report_ready', 'task_assigned'];
  
  if (criticalTypes.includes(type)) return 'critical';
  if (highTypes.includes(type)) return 'high';
  if (mediumTypes.includes(type)) return 'medium';
  
  // Context-aware priority
  if (data && data.urgency) {
    return data.urgency;
  }
  
  return 'low';
}

// Notification batching and throttling
async function batchNotifications(notificationIds) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const notifications = await Promise.all(
    notificationIds.map(id => getNotification(id))
  );
  
  // Group by user and channel
  const grouped = {};
  notifications.forEach(notification => {
    const key = `${notification.user_id}_${notification.channels.join(',')}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(notification);
  });
  
  const batchResults = [];
  
  for (const [key, group] of Object.entries(grouped)) {
    if (group.length > 1) {
      // Create digest notification
      const digest = await createDigestNotification(group);
      batchResults.push({ type: 'digest', notifications: group.length, digestId: digest.id });
    } else {
      // Deliver individual
      await deliverNotification(group[0].id);
      batchResults.push({ type: 'individual', notifications: 1 });
    }
  }
  
  return batchResults;
}

async function createDigestNotification(notifications) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const first = notifications[0];
  const digestData = {
    userId: first.user_id,
    type: 'digest',
    title: `You have ${notifications.length} new notifications`,
    message: `Summary of ${notifications.length} notifications`,
    data: { notificationIds: notifications.map(n => n.id) },
    priority: 'low',
    channels: ['in_app', 'email']
  };
  
  return await createNotification(digestData);
}

// Notification analytics
async function getNotificationAnalytics({ userId, startDate, endDate } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = 'SELECT type, status, COUNT(*) as count FROM notifications WHERE 1=1';
  let params = [];
  let paramIndex = 1;
  
  if (userId) {
    query += ` AND user_id = $${paramIndex++}`;
    params.push(userId);
  }
  if (startDate) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  query += ' GROUP BY type, status';
  
  let res = await pg.query(query, params);
  
  return {
    summary: res.rows,
    total: res.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
    byType: groupBy(res.rows, 'type'),
    byStatus: groupBy(res.rows, 'status')
  };
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
}

// Real-time notification delivery via WebSocket
async function emitRealTimeNotification(notification) {
  // This would integrate with the WebSocket server
  // For now, emit via signal bus
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'realtime_notification',
    notificationId: notification.id,
    userId: notification.user_id,
    type: notification.type
  }, {
    severity: SEVERITY.INFO,
    source: 'notification_service',
    entityId: notification.user_id
  });
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
  deliverViaChannel,
  
  // User preferences
  getUserPreferences,
  updateUserPreferences,
  
  // Templates
  createTemplate,
  getTemplate,
  renderTemplate,
  
  // AI-powered features
  calculateNotificationPriority,
  
  // Batching
  batchNotifications,
  createDigestNotification,
  
  // Analytics
  getNotificationAnalytics,
  
  // Real-time
  emitRealTimeNotification,
};