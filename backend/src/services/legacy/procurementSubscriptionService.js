/**
 * Procurement Subscription Service
 * 
 * Wires the existing `procurement_subscriptions` table (migration 042) to application logic
 * Implements REOS Missing Layer 1.9: Subscription Commerce / Subscription Farming
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get subscription by ID
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} Subscription details
 */
async function getSubscription(subscriptionId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM procurement_subscriptions WHERE subscription_id = $1`,
      [subscriptionId]
    );
    
    if (!rows.length) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get subscription: ${error.message}`);
    throw error;
  }
}

/**
 * Get subscriptions by subscriber (farmer/FPO)
 * @param {string} subscriberId - Subscriber ID
 * @returns {Promise<Array>} Subscriptions
 */
async function getSubscriptionsBySubscriber(subscriberId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM procurement_subscriptions 
       WHERE subscriber_id = $1 
       ORDER BY created_at DESC`,
      [subscriberId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get subscriptions by subscriber: ${error.message}`);
    throw error;
  }
}

/**
 * Get subscriptions by product
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} Subscriptions
 */
async function getSubscriptionsByProduct(productId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM procurement_subscriptions 
       WHERE product_id = $1 
       ORDER BY created_at DESC`,
      [productId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get subscriptions by product: ${error.message}`);
    throw error;
  }
}

/**
 * Create new subscription
 * @param {Object} subscription - Subscription data
 * @returns {Promise<Object>} Created subscription
 */
async function createSubscription(subscription) {
  try {
    const {
      subscription_id,
      subscriber_id,
      subscriber_type,
      product_id,
      subscription_type,
      frequency,
      quantity_per_cycle,
      delivery_address,
      start_date,
      end_date,
      auto_renew,
      payment_method,
      notes
    } = subscription;

    const { rows } = await pool.query(
      `INSERT INTO procurement_subscriptions 
        (subscription_id, subscriber_id, subscriber_type, product_id, subscription_type,
         frequency, quantity_per_cycle, delivery_address, start_date, end_date,
         auto_renew, payment_method, status, created_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', NOW(), $13)
       RETURNING *`,
      [subscription_id, subscriber_id, subscriber_type, product_id, subscription_type,
       frequency, quantity_per_cycle, delivery_address, start_date, end_date,
       auto_renew, payment_method, notes]
    );

    logger.info(`Subscription created: ${subscription_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to create subscription: ${error.message}`);
    throw error;
  }
}

/**
 * Update subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated subscription
 */
async function updateSubscription(subscriptionId, updates) {
  try {
    const allowedFields = [
      'quantity_per_cycle', 'delivery_address', 'end_date', 
      'auto_renew', 'payment_method', 'status', 'notes'
    ];
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(subscriptionId);

    const query = `
      UPDATE procurement_subscriptions
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE subscription_id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    
    if (!rows.length) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    logger.info(`Subscription updated: ${subscriptionId}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to update subscription: ${error.message}`);
    throw error;
  }
}

/**
 * Cancel subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Updated subscription
 */
async function cancelSubscription(subscriptionId, reason) {
  try {
    const { rows } = await pool.query(
      `UPDATE procurement_subscriptions
       SET status = 'cancelled', 
           cancellation_reason = $1,
           cancelled_at = NOW(),
           updated_at = NOW()
       WHERE subscription_id = $2
       RETURNING *`,
      [reason, subscriptionId]
    );
    
    if (!rows.length) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    logger.info(`Subscription cancelled: ${subscriptionId}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to cancel subscription: ${error.message}`);
    throw error;
  }
}

/**
 * Get active subscriptions due for delivery
 * @param {string} date - Date to check (default: today)
 * @returns {Promise<Array>} Subscriptions due for delivery
 */
async function getSubscriptionsDueForDelivery(date = new Date().toISOString().split('T')[0]) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM procurement_subscriptions
       WHERE status = 'active'
         AND start_date <= $1
         AND (end_date IS NULL OR end_date >= $1)
       ORDER BY subscriber_id, product_id`,
      [date]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get subscriptions due for delivery: ${error.message}`);
    throw error;
  }
}

/**
 * Get subscription statistics
 * @param {Object} filters - Optional filters (subscriber_id, product_id, status)
 * @returns {Promise<Object>} Subscription statistics
 */
async function getSubscriptionStatistics(filters = {}) {
  try {
    const { subscriber_id, product_id, status } = filters;
    
    let query = `
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_subscriptions,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
        SUM(quantity_per_cycle) as total_quantity_per_cycle,
        AVG(quantity_per_cycle) as avg_quantity_per_cycle
      FROM procurement_subscriptions
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (subscriber_id) {
      query += ` AND subscriber_id = $${paramIndex}`;
      params.push(subscriber_id);
      paramIndex++;
    }

    if (product_id) {
      query += ` AND product_id = $${paramIndex}`;
      params.push(product_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const { rows } = await pool.query(query, params);
    const stats = rows[0];

    return {
      totalSubscriptions: parseInt(stats.total_subscriptions),
      activeSubscriptions: parseInt(stats.active_subscriptions),
      pausedSubscriptions: parseInt(stats.paused_subscriptions),
      cancelledSubscriptions: parseInt(stats.cancelled_subscriptions),
      totalQuantityPerCycle: stats.total_quantity_per_cycle ? parseInt(stats.total_quantity_per_cycle) : 0,
      avgQuantityPerCycle: stats.avg_quantity_per_cycle ? r2(stats.avg_quantity_per_cycle) : 0
    };
  } catch (error) {
    logger.error(`Failed to get subscription statistics: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../../middleware/auth');

  router.use(authMiddleware);

  router.get('/subscriptions/:subscriptionId', async (req, res) => {
    try {
      const subscription = await getSubscription(req.params.subscriptionId);
      res.json({ success: true, data: subscription });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/subscriptions/subscriber/:subscriberId', async (req, res) => {
    try {
      const subscriptions = await getSubscriptionsBySubscriber(req.params.subscriberId);
      res.json({ success: true, data: subscriptions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/subscriptions/product/:productId', async (req, res) => {
    try {
      let subscriptions = await getSubscriptionsByProduct(req.params.productId);
      res.json({ success: true, data: subscriptions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/subscriptions', async (req, res) => {
    try {
      let subscription = await createSubscription(req.body);
      res.status(201).json({ success: true, data: subscription });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.put('/subscriptions/:subscriptionId', async (req, res) => {
    try {
      let subscription = await updateSubscription(req.params.subscriptionId, req.body);
      res.json({ success: true, data: subscription });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.post('/subscriptions/:subscriptionId/cancel', async (req, res) => {
    try {
      const { reason } = req.body;
      let subscription = await cancelSubscription(req.params.subscriptionId, reason);
      res.json({ success: true, data: subscription });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.get('/subscriptions/due/:date', async (req, res) => {
    try {
      let subscriptions = await getSubscriptionsDueForDelivery(req.params.date);
      res.json({ success: true, data: subscriptions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/subscriptions/statistics', async (req, res) => {
    try {
      let stats = await getSubscriptionStatistics(req.query);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/procurement-subscriptions', router);
  logger.info('Procurement subscription routes mounted at /api/v1/procurement-subscriptions');
}

module.exports = {
  getSubscription,
  getSubscriptionsBySubscriber,
  getSubscriptionsByProduct,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscriptionsDueForDelivery,
  getSubscriptionStatistics,
  setupRoutes
};
