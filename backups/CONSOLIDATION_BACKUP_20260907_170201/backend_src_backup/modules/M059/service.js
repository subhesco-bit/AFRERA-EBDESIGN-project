/**
 * Discount Management Service (M059)
 * Discount and promotion management with AI-powered optimization
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

async function createDiscount(discountData) {
  try {
    const { name, discount_type, value, min_purchase, max_discount, start_date, end_date, applicable_products } = discountData;
    const discount = {
      discount_id: generateId(),
      name,
      discount_type,
      value,
      min_purchase,
      max_discount,
      start_date,
      end_date,
      applicable_products,
      status: 'active',
      created_at: new Date().toISOString()
    };

    const aiRequest = {
      task: 'discount_optimization',
      parameters: { discount_data: discountData, historical_data: await getHistoricalSalesData() }
    };
    discount.ai_recommendations = await aiAPI.generateRecommendation(aiRequest);

    const result = await pool.query(
      `INSERT INTO discounts (discount_id, name, discount_type, value, min_purchase, max_discount, start_date, end_date, applicable_products, status, ai_recommendations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [discount.discount_id, discount.name, discount.discount_type, discount.value, discount.min_purchase, discount.max_discount, discount.start_date, discount.end_date, JSON.stringify(discount.applicable_products), discount.status, JSON.stringify(discount.ai_recommendations), discount.created_at]
    );

    logger.info(`Discount created: ${discount.discount_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating discount', { error: error.message });
    throw new Error('Failed to create discount');
  }
}

async function getDiscount(discountId) {
  try {
    const res = await pool.query('SELECT * FROM discounts WHERE discount_id = $1', [discountId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error getting discount', { error: error.message });
    throw new Error('Failed to get discount');
  }
}

async function updateDiscount(discountId, updates) {
  try {
    const { name, discount_type, value, min_purchase, max_discount, start_date, end_date, applicable_products, status } = updates;
    const res = await pool.query(
      `UPDATE discounts SET name = COALESCE($1, name), discount_type = COALESCE($2, discount_type), value = COALESCE($3, value), min_purchase = COALESCE($4, min_purchase), max_discount = COALESCE($5, max_discount), start_date = COALESCE($6, start_date), end_date = COALESCE($7, end_date), applicable_products = COALESCE($8, applicable_products::jsonb), status = COALESCE($9, status), updated_at = NOW() WHERE discount_id = $10 RETURNING *`,
      [name, discount_type, value, min_purchase, max_discount, start_date, end_date, applicable_products ? JSON.stringify(applicable_products) : null, status, discountId]
    );
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating discount', { error: error.message });
    throw new Error('Failed to update discount');
  }
}

async function deleteDiscount(discountId) {
  try {
    const res = await pool.query('DELETE FROM discounts WHERE discount_id = $1 RETURNING discount_id', [discountId]);
    return !!res.rows[0];
  } catch (error) {
    logger.error('Error deleting discount', { error: error.message });
    throw new Error('Failed to delete discount');
  }
}

function generateId() {
  return `DISC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getHistoricalSalesData() {
  return { average_order_value: 5000, conversion_rate: 0.05 };
}

module.exports = { createDiscount, getDiscount, updateDiscount, deleteDiscount };
