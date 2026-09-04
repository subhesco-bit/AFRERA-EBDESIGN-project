/**
 * Buyer Trust Score Service
 * Calculates buyer trust/reputation from order history and behavior
 *
 * Priority: P0 - Critical for marketplace launch
 * Enables: buyer reputation display, trust-based ordering
 */

const db = require('../database/dbConnection');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

class BuyerTrustService {
  /**
   * Calculate buyer trust score
   * Based on: order history, payment reliability, review ratings, dispute history
   */
  async calculateBuyerTrustScore(buyerId) {
    try {
      if (!buyerId) {
        throw new ValidationError('Missing required fields: buyerId');
      }

      const buyer = await db('users').where('id', buyerId).first();
      if (!buyer) throw new NotFoundError('Buyer not found');

      const orders = await db('orders')
        .where('buyer_id', buyerId)
        .count('* as count').first();

      const completedOrders = await db('orders')
        .where('buyer_id', buyerId)
        .where('status', 'completed')
        .count('* as count').first();

      const reviews = await db('reviews')
        .where('buyer_id', buyerId)
        .avg('rating as avg_rating').first();

      const disputes = await db('disputes')
        .where('buyer_id', buyerId)
        .count('* as count').first();

      const payments = await db('order_payments')
        .where('buyer_id', buyerId)
        .where('status', 'completed')
        .count('* as count').first();

      let score = 50; // Base score

      if (completedOrders.count > 0) score += Math.min(completedOrders.count / 10, 15);
      if (reviews.avg_rating) score += reviews.avg_rating * 2;
      if (payments.count > 0) score += 15; // Payment reliability
      if (disputes.count === 0) score += 10; // No disputes bonus
      if (disputes.count > 0) score -= disputes.count * 5;

      const finalScore = Math.min(Math.max(score, 0), 100);

      logger.info(`Buyer trust score calculated: ${buyerId} = ${finalScore}`);

      return {
        buyer_id: buyerId,
        trust_score: Math.round(finalScore),
        factors: {
          total_orders: orders.count,
          completed_orders: completedOrders.count,
          average_rating: reviews.avg_rating || 0,
          disputes: disputes.count,
          on_time_payments: payments.count
        }
      };
    } catch (error) {
      logger.error(`Calculate buyer trust score failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get buyer reputation badge
   */
  async getBuyerReputation(buyerId) {
    try {
      const trustScore = await this.calculateBuyerTrustScore(buyerId);

      let badge = 'new_buyer';
      if (trustScore.trust_score >= 80) badge = 'trusted_buyer';
      if (trustScore.trust_score >= 60) badge = 'good_buyer';
      if (trustScore.trust_score < 40) badge = 'caution_buyer';

      return {
        buyer_id: buyerId,
        badge,
        score: trustScore.trust_score
      };
    } catch (error) {
      logger.error(`Get buyer reputation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Report fraud suspicion
   */
  async reportFraudSuspicion(buyerId, reason) {
    try {
      if (!buyerId || !reason) {
        throw new ValidationError('Missing required fields: buyerId, reason');
      }

      const report = await db('fraud_reports').insert({
        id: require('uuid').v4(),
        buyer_id: buyerId,
        reason,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');

      logger.info(`Fraud report created: ${buyerId}`);

      return {
        report_id: report[0].id,
        status: 'pending'
      };
    } catch (error) {
      logger.error(`Report fraud suspicion failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get buyer payment history
   */
  async getBuyerPaymentHistory(buyerId) {
    try {
      const payments = await db('order_payments')
        .where('buyer_id', buyerId)
        .orderBy('created_at', 'desc')
        .limit(100);

      const onTime = payments.filter(p => p.status === 'completed' && !p.late).length;
      const late = payments.filter(p => p.status === 'completed' && p.late).length;
      const failed = payments.filter(p => p.status === 'failed').length;

      return {
        buyer_id: buyerId,
        total_payments: payments.length,
        on_time: onTime,
        late,
        failed,
        reliability_percentage: Math.round((onTime / payments.length) * 100) || 0
      };
    } catch (error) {
      logger.error(`Get buyer payment history failed: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new BuyerTrustService();
