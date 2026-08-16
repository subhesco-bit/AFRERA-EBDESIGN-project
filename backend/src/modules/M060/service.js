/**
 * Review Management Service (M060)
 * Product reviews and ratings with AI-powered sentiment analysis
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

async function createReview(reviewData) {
  try {
    const { product_id, user_id, rating, title, comment, images } = reviewData;
    const review = {
      review_id: generateId(),
      product_id,
      user_id,
      rating,
      title,
      comment,
      images,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const aiRequest = {
      task: 'sentiment_analysis',
      parameters: { review_data: reviewData, product_context: await getProductContext(product_id) }
    };
    review.ai_analysis = await aiAPI.generateRecommendation(aiRequest);

    const result = await pool.query(
      `INSERT INTO reviews (review_id, product_id, user_id, rating, title, comment, images, status, ai_analysis, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [review.review_id, review.product_id, review.user_id, review.rating, review.title, review.comment, JSON.stringify(review.images), review.status, JSON.stringify(review.ai_analysis), review.created_at]
    );

    logger.info(`Review created: ${review.review_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating review', { error: error.message });
    throw new Error('Failed to create review');
  }
}

async function getReview(reviewId) {
  try {
    const res = await pool.query('SELECT * FROM reviews WHERE review_id = $1', [reviewId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error getting review', { error: error.message });
    throw new Error('Failed to get review');
  }
}

async function getProductReviews(productId, { page = 1, limit = 20 } = {}) {
  try {
    const offset = (page - 1) * limit;
    const res = await pool.query(
      'SELECT * FROM reviews WHERE product_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [productId, 'approved', limit, offset]
    );
    return { items: res.rows, pagination: { page, limit, total: res.rows.length, totalPages: Math.ceil(res.rows.length / limit) } };
  } catch (error) {
    logger.error('Error getting product reviews', { error: error.message });
    throw new Error('Failed to get product reviews');
  }
}

async function updateReviewStatus(reviewId, status) {
  try {
    const res = await pool.query('UPDATE reviews SET status = $1, updated_at = NOW() WHERE review_id = $2 RETURNING *', [status, reviewId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating review status', { error: error.message });
    throw new Error('Failed to update review status');
  }
}

function generateId() {
  return `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getProductContext(productId) {
  return { category: 'grains', average_rating: 4.2 };
}

module.exports = { createReview, getReview, getProductReviews, updateReviewStatus };
