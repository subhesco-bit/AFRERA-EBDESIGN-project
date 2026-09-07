/**
 * Product Review Service
 * Handles product reviews, ratings, and feedback for AFRERA marketplace
 */

const { logger } = require('../../utils/logger');

class ProductReviewService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../../database/pool');
  }

  /**
   * Create a new product review
   */
  async createReview(userId, productId, reviewData) {
    const { rating, title, comment, images, verifiedPurchase } = reviewData;

    try {
      // Check if user has purchased the product
      const purchaseCheck = await this.pool.query(
        `SELECT id FROM order_items 
         WHERE product_id = $1 
         AND order_id IN (SELECT id FROM orders WHERE user_id = $2)`,
        [productId, userId]
      );

      const hasPurchased = purchaseCheck.rows.length > 0;

      if (verifiedPurchase && !hasPurchased) {
        throw new Error('Cannot mark as verified purchase - no purchase found');
      }

      const query = `
        INSERT INTO product_reviews 
        (user_id, product_id, rating, title, comment, images, verified_purchase, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        userId,
        productId,
        rating,
        title,
        comment,
        JSON.stringify(images || []),
        hasPurchased
      ]);

      // Update product average rating
      await this.updateProductRating(productId);

      logger.info(`Review created for product ${productId} by user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating review', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get reviews for a product
   */
  async getProductReviews(productId, filters = {}) {
    const { rating, verified, status = 'approved', sort = 'recent', page = 1, limit = 20 } = filters;

    try {
      let query = `
        SELECT 
          pr.*,
          u.name as user_name,
          u.avatar as user_avatar,
          u.fdi_score as user_fdi
        FROM product_reviews pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.product_id = $1
      `;

      const params = [productId];
      let paramCount = 1;

      if (rating) {
        paramCount++;
        query += ` AND pr.rating >= $${paramCount}`;
        params.push(rating);
      }

      if (verified) {
        paramCount++;
        query += ` AND pr.verified_purchase = $${paramCount}`;
        params.push(true);
      }

      if (status) {
        paramCount++;
        query += ` AND pr.status = $${paramCount}`;
        params.push(status);
      }

      // Sorting
      if (sort === 'recent') {
        query += ' ORDER BY pr.created_at DESC';
      } else if (sort === 'helpful') {
        query += ' ORDER BY pr.helpful_count DESC';
      } else if (sort === 'rating_high') {
        query += ' ORDER BY pr.rating DESC';
      } else if (sort === 'rating_low') {
        query += ' ORDER BY pr.rating ASC';
      }

      // Pagination
      const offset = (page - 1) * limit;
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await this.pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM product_reviews
        WHERE product_id = $1
        ${status ? `AND status = '${status}'` : ''}
      `;
      const countResult = await this.pool.query(countQuery, [productId]);

      return {
        reviews: result.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting product reviews', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get review statistics for a product
   */
  async getProductReviewStats(productId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_reviews,
          AVG(rating) as average_rating,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
          COUNT(CASE WHEN verified_purchase = true THEN 1 END) as verified_purchase_count
        FROM product_reviews
        WHERE product_id = $1 AND status = 'approved'
      `;

      const result = await this.pool.query(query, [productId]);
      const stats = result.rows[0];

      return {
        productId,
        totalReviews: parseInt(stats.total_reviews),
        averageRating: parseFloat(stats.average_rating) || 0,
        ratingDistribution: {
          5: parseInt(stats.five_star),
          4: parseInt(stats.four_star),
          3: parseInt(stats.three_star),
          2: parseInt(stats.two_star),
          1: parseInt(stats.one_star)
        },
        verifiedPurchaseCount: parseInt(stats.verified_purchase_count)
      };
    } catch (error) {
      logger.error('Error getting review stats', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Update product average rating
   */
  async updateProductRating(productId) {
    try {
      const query = `
        UPDATE products
        SET 
          average_rating = (
            SELECT COALESCE(AG(rating), 0)
            FROM product_reviews
            WHERE product_id = $1 AND status = 'approved'
          ),
          review_count = (
            SELECT COUNT(*)
            FROM product_reviews
            WHERE product_id = $1 AND status = 'approved'
          ),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.pool.query(query, [productId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating product rating', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId, userId) {
    try {
      // Check if already marked
      const existing = await this.pool.query(
        `SELECT id FROM review_helpful 
         WHERE review_id = $1 AND user_id = $2`,
        [reviewId, userId]
      );

      if (existing.rows.length > 0) {
        // Remove helpful mark
        await this.pool.query(
          `DELETE FROM review_helpful 
           WHERE review_id = $1 AND user_id = $2`,
          [reviewId, userId]
        );

        await this.pool.query(
          `UPDATE product_reviews 
           SET helpful_count = helpful_count - 1 
           WHERE id = $1`,
          [reviewId]
        );

        return { marked: false };
      } else {
        // Add helpful mark
        await this.pool.query(
          `INSERT INTO review_helpful (review_id, user_id)
           VALUES ($1, $2)`,
          [reviewId, userId]
        );

        await this.pool.query(
          `UPDATE product_reviews 
           SET helpful_count = helpful_count + 1 
           WHERE id = $1`,
          [reviewId]
        );

        return { marked: true };
      }
    } catch (error) {
      logger.error('Error marking review helpful', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Update review
   */
  async updateReview(reviewId, userId, updateData) {
    const { rating, title, comment, images } = updateData;

    try {
      const query = `
        UPDATE product_reviews
        SET 
          rating = COALESCE($1, rating),
          title = COALESCE($2, title),
          comment = COALESCE($3, comment),
          images = COALESCE($4, images),
          updated_at = NOW()
        WHERE id = $5 AND user_id = $6
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        rating,
        title,
        comment,
        images ? JSON.stringify(images) : null,
        reviewId,
        userId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Review not found or unauthorized');
      }

      // Update product rating
      await this.updateProductRating(result.rows[0].product_id);

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating review', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId, userId, isAdmin = false) {
    try {
      let query = 'DELETE FROM product_reviews WHERE id = $1';
      const params = [reviewId];

      if (!isAdmin) {
        query += ' AND user_id = $2';
        params.push(userId);
      }

      const result = await this.pool.query(query, params);

      if (result.rowCount === 0) {
        throw new Error('Review not found or unauthorized');
      }

      logger.info(`Review ${reviewId} deleted by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting review', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Moderate review (approve/reject)
   */
  async moderateReview(reviewId, status, moderatorId) {
    try {
      const query = `
        UPDATE product_reviews
        SET 
          status = $1,
          moderated_by = $2,
          moderated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await this.pool.query(query, [status, moderatorId, reviewId]);

      // Update product rating if approved
      if (status === 'approved') {
        await this.updateProductRating(result.rows[0].product_id);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error moderating review', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get user's reviews
   */
  async getUserReviews(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          pr.*,
          p.name as product_name,
          p.image as product_image,
          p.gi_tag
        FROM product_reviews pr
        JOIN products p ON pr.product_id = p.id
        WHERE pr.user_id = $1
        ORDER BY pr.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.pool.query(query, [userId, limit, offset]);

      return {
        reviews: result.rows,
        pagination: { page, limit }
      };
    } catch (error) {
      logger.error('Error getting user reviews', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Report review
   */
  async reportReview(reviewId, userId, reason) {
    try {
      const query = `
        INSERT INTO review_reports (review_id, reporter_id, reason, status)
        VALUES ($1, $2, $3, 'pending')
        RETURNING *
      `;

      const result = await this.pool.query(query, [reviewId, userId, reason]);

      logger.info(`Review ${reviewId} reported by user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error reporting review', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new ProductReviewService();

// Merged unique operations from backend/src/modules/M060 (see git history there for
// full context) - complementary functionality this service did not have. createReview and
// getProductReviews collided with different signatures AND different table/schema
// (product_reviews+users join vs a simpler reviews table) - both already had live callers
// with the original signature (marketplaceEnhancements.js) - aliased rather than overwritten.
{
  const m060 = require("../../modules/M060/service");
  const { createReview: createReviewSimple, getProductReviews: getProductReviewsSimple, ...rest } = m060;
  Object.assign(module.exports, rest, { createReviewSimple, getProductReviewsSimple });
}

// Merged from backend/src/modules/M052
{
  const m052 = require("../../modules/M052/service");
  const { ...rest } = m052;
  Object.assign(module.exports, rest);
}

// Merged from backend/src/modules/M058
{
  const m058 = require("../../modules/M058/service");
  const { ...rest } = m058;
  Object.assign(module.exports, rest);
}
