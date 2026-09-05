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
    let res = await pool.query('UPDATE payments SET payment_status = $1, updated_at = NOW() WHERE payment_id = $2 RETURNING *', [status, paymentId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating payment status', { error: error.message });
    throw new Error('Failed to update payment status');
  }
}

/**
 * F5 fix (2026-08-30): frontend calls PUT /modules/m056/:id (a generic
 * update, not the status-only PUT /:id/status that already existed) and
 * DELETE /modules/m056/:id. No generic update/delete existed before -
 * added here following the same payment_id-keyed query pattern as
 * getPayment/updatePaymentStatus above (not amount/payment_method, which
 * are immutable-by-design for an already-created payment; the mutable
 * fields are payment_method... actually amount and payment_method are
 * kept updatable here since frontend forms may correct entry mistakes
 * pre-settlement; payment_status is intentionally excluded to keep the
 * dedicated updatePaymentStatus() as the single path that changes status).
 */
async function updatePayment(paymentId, updates) {
  try {
    const { amount, payment_method, payment_details } = updates || {};
    let res = await pool.query(
      `UPDATE payments SET
         amount = COALESCE($1, amount),
         payment_method = COALESCE($2, payment_method),
         payment_details = COALESCE($3, payment_details),
         updated_at = NOW()
       WHERE payment_id = $4
       RETURNING *`,
      [amount, payment_method, payment_details ? JSON.stringify(payment_details) : null, paymentId]
    );
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating payment', { error: error.message });
    throw new Error('Failed to update payment');
  }
}

async function deletePayment(paymentId) {
  try {
    let res = await pool.query('DELETE FROM payments WHERE payment_id = $1 RETURNING payment_id', [paymentId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error deleting payment', { error: error.message });
    throw new Error('Failed to delete payment');
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

    let result = await pool.query(
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
  let res = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
  return res.rows[0] || {};
}

module.exports = { createPayment, getPayment, updatePaymentStatus, updatePayment, deletePayment, refundPayment };
