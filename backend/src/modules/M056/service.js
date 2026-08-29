/**
 * Payment Processing Service (M056)
 * Payment processing with AI-powered fraud detection and risk assessment
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

async function createPayment(paymentData) {
  try {
    const { order_id, amount, payment_method, payment_details } = paymentData;
    const payment = {
      payment_id: generateId(),
      order_id,
      amount,
      payment_method,
      payment_status: 'processing',
      created_at: new Date().toISOString()
    };

    const aiRequest = {
      task: 'payment_risk_assessment',
      parameters: { payment_data: paymentData, order_data: await getOrderData(order_id) }
    };
    payment.risk_assessment = await aiAPI.generateRecommendation(aiRequest);

    const result = await pool.query(
      `INSERT INTO payments (payment_id, order_id, amount, payment_method, payment_status, payment_details, risk_assessment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [payment.payment_id, payment.order_id, payment.amount, payment.payment_method, payment.payment_status, JSON.stringify(payment_details), JSON.stringify(payment.risk_assessment), payment.created_at]
    );

    logger.info(`Payment created: ${payment.payment_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating payment', { error: error.message });
    throw new Error('Failed to create payment');
  }
}

async function getPayment(paymentId) {
  try {
    const res = await pool.query('SELECT * FROM payments WHERE payment_id = $1', [paymentId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error getting payment', { error: error.message });
    throw new Error('Failed to get payment');
  }
}

async function updatePaymentStatus(paymentId, status) {
  try {
    const res = await pool.query('UPDATE payments SET payment_status = $1, updated_at = NOW() WHERE payment_id = $2 RETURNING *', [status, paymentId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating payment status', { error: error.message });
    throw new Error('Failed to update payment status');
  }
}

async function refundPayment(paymentId, amount, reason) {
  try {
    const refund = {
      refund_id: generateId(),
      payment_id: paymentId,
      amount,
      reason,
      status: 'processing',
      created_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO refunds (refund_id, payment_id, amount, reason, status, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [refund.refund_id, refund.payment_id, refund.amount, refund.reason, refund.status, refund.created_at]
    );

    await updatePaymentStatus(paymentId, 'refunded');
    return result.rows[0];
  } catch (error) {
    logger.error('Error processing refund', { error: error.message });
    throw new Error('Failed to process refund');
  }
}

function generateId() {
  return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getOrderData(orderId) {
  const res = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
  return res.rows[0] || {};
}

module.exports = { createPayment, getPayment, updatePaymentStatus, refundPayment };
