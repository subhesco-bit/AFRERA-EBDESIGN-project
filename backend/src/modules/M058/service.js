/**
 * Returns Management Service (M058)
 * Product returns and refunds with AI-powered analytics
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

async function createReturn(returnData) {
  try {
    const { order_id, product_id, reason, quantity } = returnData;
    const returnRequest = {
      return_id: generateId(),
      order_id,
      product_id,
      reason,
      quantity,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const aiRequest = {
      task: 'return_analysis',
      parameters: { return_data: returnData, product_quality: await assessProductQuality(product_id) }
    };
    returnRequest.ai_recommendations = await aiAPI.generateRecommendation(aiRequest);

    const result = await pool.query(
      `INSERT INTO returns (return_id, order_id, product_id, reason, quantity, status, ai_recommendations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [returnRequest.return_id, returnRequest.order_id, returnRequest.product_id, returnRequest.reason, returnRequest.quantity, returnRequest.status, JSON.stringify(returnRequest.ai_recommendations), returnRequest.created_at]
    );

    logger.info(`Return created: ${returnRequest.return_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating return', { error: error.message });
    throw new Error('Failed to create return');
  }
}

async function getReturn(returnId) {
  try {
    const res = await pool.query('SELECT * FROM returns WHERE return_id = $1', [returnId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error getting return', { error: error.message });
    throw new Error('Failed to get return');
  }
}

async function updateReturnStatus(returnId, status, notes = null) {
  try {
    const res = await pool.query(
      'UPDATE returns SET status = $1, notes = COALESCE($2, notes), updated_at = NOW() WHERE return_id = $3 RETURNING *',
      [status, notes, returnId]
    );
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating return status', { error: error.message });
    throw new Error('Failed to update return status');
  }
}

function generateId() {
  return `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function assessProductQuality(productId) {
  return { quality_score: 85, defect_rate: 0.05 };
}

module.exports = { createReturn, getReturn, updateReturnStatus };
