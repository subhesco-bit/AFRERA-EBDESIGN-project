/**
 * Order Management Service (M053)
 * Order processing, fulfillment, and tracking with AI-powered optimization
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create order with AI-powered validation
 */
async function createOrder(orderData) {
  try {
    const {
      customer_id,
      items,
      shipping_address,
      billing_address,
      payment_method,
      delivery_method,
      notes,
      metadata
    } = orderData;

    const order = {
      order_id: generateId(),
      customer_id,
      items,
      shipping_address,
      billing_address,
      payment_method,
      delivery_method,
      subtotal: calculateSubtotal(items),
      tax: calculateTax(items),
      shipping_cost: calculateShippingCost(items, delivery_method),
      total: 0,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    order.total = order.subtotal + order.tax + order.shipping_cost;

    // AI-powered order optimization
    const aiRequest = {
      task: 'order_optimization',
      parameters: {
        order_data: orderData,
        inventory_check: await checkInventoryAvailability(items),
        delivery_optimization: await optimizeDeliveryRoute(shipping_address, items),
        payment_risk: await assessPaymentRisk(customer_id, order.total),
        fraud_detection: await detectFraud(orderData)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    order.ai_recommendations = aiResponse;

    // Insert into database
    const result = await pool.query(
      `INSERT INTO orders 
       (order_id, customer_id, items, shipping_address, billing_address, 
        payment_method, delivery_method, subtotal, tax, shipping_cost, total, 
        status, ai_recommendations, notes, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        order.order_id,
        order.customer_id,
        JSON.stringify(order.items),
        JSON.stringify(order.shipping_address),
        JSON.stringify(order.billing_address),
        order.payment_method,
        order.delivery_method,
        order.subtotal,
        order.tax,
        order.shipping_cost,
        order.total,
        order.status,
        JSON.stringify(order.ai_recommendations),
        notes,
        JSON.stringify(metadata || {}),
        order.created_at
      ]
    );

    // Deduct inventory
    await deductInventory(items);

    logger.info(`Order created: ${order.order_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating order', { error: error.message, stack: error.stack });
    throw new Error('Failed to create order');
  }
}

/**
 * List orders with filtering
 */
async function listOrders({ page = 1, limit = 20, status = null, customerId = null } = {}) {
  try {
    const offset = (page - 1) * limit;
    
    let countQuery = 'SELECT COUNT(*) FROM orders';
    let countParams = [];
    let conditions = [];
    
    if (status) {
      conditions.push('status = $' + (conditions.length + 1));
      countParams.push(status);
    }
    if (customerId) {
      conditions.push('customer_id = $' + (conditions.length + 1));
      countParams.push(customerId);
    }
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalRes = await pool.query(countQuery, countParams);
    const total = parseInt(totalRes.rows[0].count || '0');
    
    let dataQuery = 'SELECT * FROM orders';
    let dataParams = [...countParams];
    
    if (conditions.length > 0) {
      dataQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    dataQuery += ' ORDER BY created_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);
    
    const res = await pool.query(dataQuery, dataParams);
    return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  } catch (error) {
    logger.error('Error listing orders', { error: error.message });
    throw new Error('Failed to list orders');
  }
}

/**
 * Get order by ID
 */
async function getOrder(orderId) {
  try {
    const res = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error getting order', { error: error.message });
    throw new Error('Failed to get order');
  }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status, notes = null) {
  try {
    const result = await pool.query(
      `UPDATE orders 
       SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
       WHERE order_id = $3
       RETURNING *`,
      [status, notes, orderId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error updating order status', { error: error.message });
    throw new Error('Failed to update order status');
  }
}

/**
 * Cancel order
 */
async function cancelOrder(orderId, reason = null) {
  try {
    const order = await getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Restore inventory
    await restoreInventory(order.items);

    const result = await pool.query(
      `UPDATE orders 
       SET status = 'cancelled', cancellation_reason = $1, cancelled_at = NOW()
       WHERE order_id = $2
       RETURNING *`,
      [reason, orderId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error cancelling order', { error: error.message });
    throw new Error('Failed to cancel order');
  }
}

/**
 * Process payment
 */
async function processPayment(orderId, paymentDetails) {
  try {
    const order = await getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const payment = {
      payment_id: generateId(),
      order_id: orderId,
      amount: order.total,
      payment_method: paymentDetails.payment_method,
      payment_status: 'processing',
      transaction_id: paymentDetails.transaction_id,
      payment_details: paymentDetails,
      created_at: new Date().toISOString()
    };

    // AI-powered payment risk assessment
    const aiRequest = {
      task: 'payment_risk_assessment',
      parameters: {
        payment_details: paymentDetails,
        order_data: order,
        customer_history: await getCustomerPaymentHistory(order.customer_id),
        fraud_indicators: await checkFraudIndicators(paymentDetails)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    payment.risk_assessment = aiResponse;

    const result = await pool.query(
      `INSERT INTO payments 
       (payment_id, order_id, amount, payment_method, payment_status, 
        transaction_id, payment_details, risk_assessment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        payment.payment_id,
        payment.order_id,
        payment.amount,
        payment.payment_method,
        payment.payment_status,
        payment.transaction_id,
        JSON.stringify(payment.payment_details),
        JSON.stringify(payment.risk_assessment),
        payment.created_at
      ]
    );

    // Update order status
    if (payment.risk_assessment.risk_level === 'low') {
      await updateOrderStatus(orderId, 'processing');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error processing payment', { error: error.message });
    throw new Error('Failed to process payment');
  }
}

/**
 * Track order
 */
async function trackOrder(orderId) {
  try {
    const order = await getOrder(orderId);
    const tracking = await getOrderTracking(orderId);

    const trackingInfo = {
      order_id: orderId,
      order_status: order.status,
      tracking_info: tracking,
      estimated_delivery: await calculateEstimatedDelivery(orderId),
      current_location: await getCurrentLocation(orderId),
      milestones: await getOrderMilestones(orderId)
    };

    return trackingInfo;
  } catch (error) {
    logger.error('Error tracking order', { error: error.message });
    throw new Error('Failed to track order');
  }
}

// Helper functions
function generateId() {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateTax(items) {
  const subtotal = calculateSubtotal(items);
  return subtotal * 0.18; // 18% GST
}

function calculateShippingCost(items, deliveryMethod) {
  const weight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  if (deliveryMethod === 'express') {
    return weight * 50 + 100;
  }
  return weight * 30 + 50;
}

async function checkInventoryAvailability(items) {
  const availability = [];
  for (const item of items) {
    const res = await pool.query('SELECT quantity FROM products WHERE product_id = $1', [item.product_id]);
    availability.push({
      product_id: item.product_id,
      available: res.rows[0]?.quantity || 0,
      requested: item.quantity,
      in_stock: (res.rows[0]?.quantity || 0) >= item.quantity
    });
  }
  return availability;
}

async function optimizeDeliveryRoute(address, items) {
  return {
    estimated_distance: 50,
    estimated_time: '2-3 days',
    recommended_carrier: 'local_logistics',
    cost_optimization: 'standard'
  };
}

async function assessPaymentRisk(customerId, amount) {
  return {
    risk_level: 'low',
    confidence: 0.95,
    factors: ['good_payment_history', 'verified_customer']
  };
}

async function detectFraud(orderData) {
  return {
    fraud_score: 0.1,
    indicators: [],
    recommendation: 'approve'
  };
}

async function deductInventory(items) {
  for (const item of items) {
    await pool.query(
      'UPDATE products SET quantity = quantity - $1 WHERE product_id = $2',
      [item.quantity, item.product_id]
    );
  }
}

async function restoreInventory(items) {
  for (const item of items) {
    await pool.query(
      'UPDATE products SET quantity = quantity + $1 WHERE product_id = $2',
      [item.quantity, item.product_id]
    );
  }
}

async function getCustomerPaymentHistory(customerId) {
  return [];
}

async function checkFraudIndicators(paymentDetails) {
  return [];
}

async function getOrderTracking(orderId) {
  const res = await pool.query('SELECT * FROM order_tracking WHERE order_id = $1 ORDER BY timestamp DESC', [orderId]);
  return res.rows;
}

async function calculateEstimatedDelivery(orderId) {
  return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
}

async function getCurrentLocation(orderId) {
  return 'warehouse';
}

async function getOrderMilestones(orderId) {
  return [
    { status: 'order_placed', timestamp: new Date().toISOString() },
    { status: 'processing', timestamp: null },
    { status: 'shipped', timestamp: null },
    { status: 'delivered', timestamp: null }
  ];
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  processPayment,
  trackOrder
};
