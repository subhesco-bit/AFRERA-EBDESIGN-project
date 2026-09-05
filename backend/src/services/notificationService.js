/**
 * Notification Service
 * Handles notification delivery and management
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { EventEmitter } = require('events');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.db = null;
    this.channels = new Map();
  }

  async initialize() {
    try {
      this.db = getPostgreSQL();
      logger.info('NotificationService initialized');
    } catch (error) {
      logger.error('NotificationService initialization failed', error);
    }
  }

  /**
   * Send notification
   */
  async sendNotification(notificationData) {
  // Validate inputs
  if (!notificationData) throw new Error('Missing required parameter');

    const { 
      userId, 
      type, 
      title, 
      message, 
      data = {},
      channels = ['in_app'],
      priority = 'normal',
      scheduledFor = null 
    } = notificationData;

    try {
      const query = `
        INSERT INTO notifications (
          user_id, type, title, message, data, 
          channels, priority, status, scheduled_for, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW())
        RETURNING *
      `;
      const result = await this.db.query(query, [
        userId,
        type,
        title,
        message,
        JSON.stringify(data),
        JSON.stringify(channels),
        priority,
        scheduledFor
      ]);

      const notification = result.rows[0];
      
      // Send through channels if not scheduled
      if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
        await this.deliverNotification(notification);
      }

      logger.info(`Notification sent to user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      logger.error('Send notification failed', error);
      throw error;
    }
  }

  /**
   * Deliver notification through channels
   */
  async deliverNotification(notification) {
    const { notification_id, channels, user_id, title, message, data } = notification;

    try {
      const deliveryResults = [];

      for (const channel of channels) {
        try {
          const result = await this.deliverToChannel(channel, {
            userId: user_id,
            title,
            message,
            data
          });
          deliveryResults.push({ channel, success: true, result });
        } catch (error) {
          deliveryResults.push({ channel, success: false, error: error.message });
        }
      }

      // Update notification status
      const allSuccessful = deliveryResults.every(r => r.success);
      await this.updateNotificationStatus(notification_id, 
        allSuccessful ? 'delivered' : 'partial',
        { deliveryResults }
      );

      this.emit('notificationDelivered', notification, deliveryResults);
      return deliveryResults;
    } catch (error) {
      logger.error('Deliver notification failed', error);
      throw error;
    }
  }

  /**
   * Deliver to specific channel
   */
  async deliverToChannel(channel, notificationData) {
    switch (channel) {
      case 'in_app':
        return await this.deliverInApp(notificationData);
      case 'email':
        return await this.deliverEmail(notificationData);
      case 'sms':
        return await this.deliverSMS(notificationData);
      case 'push':
        return await this.deliverPush(notificationData);
      case 'websocket':
        return await this.deliverWebSocket(notificationData);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  /**
   * Deliver in-app notification
   */
  async deliverInApp(notificationData) {
    // In-app notifications are stored in database and fetched by client
    return { delivered: true, method: 'in_app' };
  }

  /**
   * Deliver email notification
   */
  async deliverEmail(notificationData) {
    // Mock implementation - integrate with email service
    logger.info('Sending email notification', notificationData);
    return { delivered: true, method: 'email' };
  }

  /**
   * Deliver SMS notification
   */
  async deliverSMS(notificationData) {
    // Mock implementation - integrate with SMS service
    logger.info('Sending SMS notification', notificationData);
    return { delivered: true, method: 'sms' };
  }

  /**
   * Deliver push notification
   */
  async deliverPush(notificationData) {
    // Mock implementation - integrate with push service (FCM, APNs)
    logger.info('Sending push notification', notificationData);
    return { delivered: true, method: 'push' };
  }

  /**
   * Deliver WebSocket notification
   */
  async deliverWebSocket(notificationData) {
    // Integrate with Socket.IO service
    const io = require('../index').io;
    if (io) {
      io.to(`user_${notificationData.userId}`).emit('notification', {
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data
      });
      return { delivered: true, method: 'websocket' };
    }
    return { delivered: false, method: 'websocket', error: 'WebSocket not available' };
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, filters = {}) {
    const { limit = 50, offset = 0, unreadOnly = false, type } = filters;

    try {
      let query = `
        SELECT * FROM notifications 
        WHERE user_id = $1
      `;
      const params = [userId];
      let paramCount = 1;

      if (unreadOnly) {
        paramCount++;
        query += ` AND read = false`;
      }

      if (type) {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        params.push(type);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Get user notifications failed', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const query = `
        UPDATE notifications 
        SET read = true, read_at = NOW()
        WHERE notification_id = $1 AND user_id = $2
        RETURNING *
      `;
      const result = await this.db.query(query, [notificationId, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Notification not found');
      }

      logger.info(`Notification ${notificationId} marked as read`);
      return result.rows[0];
    } catch (error) {
      logger.error('Mark notification as read failed', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    try {
      const query = `
        UPDATE notifications 
        SET read = true, read_at = NOW()
        WHERE user_id = $1 AND read = false
        RETURNING *
      `;
      const result = await this.db.query(query, [userId]);
      
      logger.info(`Marked ${result.rows.length} notifications as read for user ${userId}`);
      return result.rows;
    } catch (error) {
      logger.error('Mark all notifications as read failed', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const query = `
        DELETE FROM notifications 
        WHERE notification_id = $1 AND user_id = $2
        RETURNING *
      `;
      const result = await this.db.query(query, [notificationId, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Notification not found');
      }

      logger.info(`Notification ${notificationId} deleted`);
      return true;
    } catch (error) {
      logger.error('Delete notification failed', error);
      throw error;
    }
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(notificationId, status, metadata = {}) {
    try {
      const query = `
        UPDATE notifications 
        SET status = $1, 
            metadata = COALESCE($2, metadata),
            updated_at = NOW()
        WHERE notification_id = $3
      `;
      await this.db.query(query, [
        status,
        Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
        notificationId
      ]);
    } catch (error) {
      logger.error('Update notification status failed', error);
    }
  }

  /**
   * Get notification preferences for user
   */
  async getUserPreferences(userId) {
    try {
      const query = `
        SELECT * FROM notification_preferences 
        WHERE user_id = $1
      `;
      const result = await this.db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        // Return default preferences
        return this.getDefaultPreferences();
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get user preferences failed', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const query = `
        INSERT INTO notification_preferences (
          user_id, email_enabled, sms_enabled, push_enabled, 
          in_app_enabled, categories, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          email_enabled = EXCLUDED.email_enabled,
          sms_enabled = EXCLUDED.sms_enabled,
          push_enabled = EXCLUDED.push_enabled,
          in_app_enabled = EXCLUDED.in_app_enabled,
          categories = EXCLUDED.categories,
          updated_at = NOW()
        RETURNING *
      `;
      const result = await this.db.query(query, [
        userId,
        preferences.email_enabled ?? true,
        preferences.sms_enabled ?? false,
        preferences.push_enabled ?? true,
        preferences.in_app_enabled ?? true,
        JSON.stringify(preferences.categories || {})
      ]);

      logger.info(`Notification preferences updated for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Update user preferences failed', error);
      throw error;
    }
  }

  /**
   * Get default notification preferences
   */
  getDefaultPreferences() {
    return {
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      in_app_enabled: true,
      categories: {
        system: true,
        alerts: true,
        updates: true,
        marketing: false
      }
    };
  }

  /**
   * Send bulk notification
   */
  async sendBulkNotification(notificationData, userIds) {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await this.sendNotification({
          ...notificationData,
          userId
        });
        results.push({ userId, success: true, notificationId: result.notification_id });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    logger.info(`Bulk notification sent to ${userIds.length} users`);
    return results;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStatistics(filters = {}) {
    const { userId, startDate, endDate } = filters;

    try {
      let query = `
        SELECT 
          COUNT(*) as total_notifications,
          SUM(CASE WHEN read = true THEN 1 ELSE 0 END) as read,
          SUM(CASE WHEN read = false THEN 1 ELSE 0 END) as unread,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM notifications
      `;
      const params = [];
      let paramCount = 0;

      if (userId) {
        paramCount++;
        query += ` WHERE user_id = $${paramCount}`;
        params.push(userId);
      }

      if (startDate) {
        paramCount++;
        query += paramCount === 1 ? ' WHERE' : ' AND';
        query += ` created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += paramCount === 1 ? ' WHERE' : ' AND';
        query += ` created_at <= $${paramCount}`;
        params.push(endDate);
      }

      const result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Get notification statistics failed', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
