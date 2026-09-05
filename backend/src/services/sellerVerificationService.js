/**
 * Seller Verification Service
 * Handles seller identity verification, KYC, and trust establishment
 *
 * P0 - Critical for marketplace launch
 * Enables: seller verification, certification badges, trust indicators
 */

const db = require('../database/dbConnection');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

class SellerVerificationService {
  /**
   * Create verification request for seller
   * Initiates KYC/business verification process
   */
  async createVerificationRequest(sellerId, data) {
    try {
      // Validate input
      if (!sellerId || !data.business_name) {
        throw new ValidationError('Missing required fields: sellerId, business_name');
      }

      // Check if seller exists
      const seller = await db('users').where('id', sellerId).first();
      if (!seller) throw new NotFoundError('Seller not found');

      // Create verification record
      const verificationId = require('uuid').v4();

      const verification = await db('seller_verifications').insert({
        id: verificationId,
        seller_id: sellerId,
        business_name: data.business_name,
        business_type: data.business_type || 'individual', // individual, partnership, corporation
        gst_number: data.gst_number,
        pan_number: data.pan_number,
        business_address: data.business_address,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        documents: JSON.stringify(data.documents || []), // URLs to uploaded docs
        status: 'pending', // pending, verified, rejected, expired
        submission_date: new Date(),
        verified_date: null,
        rejection_reason: null,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');

      logger.info(`Verification request created: ${verificationId} for seller ${sellerId}`);

      return {
        id: verificationId,
        status: 'pending',
        submitted_at: new Date(),
        expected_review_days: 3
      };
    } catch (error) {
      logger.error(`Verification creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get verification status for seller
   */
  async getVerificationStatus(sellerId) {
    try {
      let verification = await db('seller_verifications')
        .where('seller_id', sellerId)
        .orderBy('submission_date', 'desc')
        .first();

      if (!verification) {
        return {
          status: 'not_submitted',
          verified: false
        };
      }

      return {
        id: verification.id,
        status: verification.status,
        verified: verification.status === 'verified',
        submitted_at: verification.submission_date,
        verified_at: verification.verified_date,
        rejection_reason: verification.rejection_reason,
        business_name: verification.business_name,
        documents: JSON.parse(verification.documents || '[]')
      };
    } catch (error) {
      logger.error(`Get verification status failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify seller (admin action)
   * Updates seller profile with verification badge
   */
  async verifySellerAccount(sellerId, adminNotes = '') {
    try {
      let verification = await db('seller_verifications')
        .where('seller_id', sellerId)
        .orderBy('submission_date', 'desc')
        .first();

      if (!verification) throw new NotFoundError('No verification request found');

      // Update verification record
      await db('seller_verifications')
        .where('id', verification.id)
        .update({
          status: 'verified',
          verified_date: new Date(),
          admin_notes: adminNotes,
          updated_at: new Date()
        });

      // Update seller profile
      await db('seller_profiles')
        .where('seller_id', sellerId)
        .update({
          verified: true,
          verified_date: new Date(),
          verification_id: verification.id
        });

      // Add verified badge to user
      await db('user_certifications').insert({
        user_id: sellerId,
        certification_type: 'verified_seller',
        issued_date: new Date(),
        valid_until: null,
        issuer: 'AFRERA'
      });

      logger.info(`Seller ${sellerId} verified successfully`);

      return {
        status: 'verified',
        verified_date: new Date(),
        badge: 'verified_seller'
      };
    } catch (error) {
      logger.error(`Seller verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reject verification (admin action)
   */
  async rejectVerification(sellerId, reason) {
    try {
      let verification = await db('seller_verifications')
        .where('seller_id', sellerId)
        .orderBy('submission_date', 'desc')
        .first();

      if (!verification) throw new NotFoundError('No verification request found');

      await db('seller_verifications')
        .where('id', verification.id)
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date()
        });

      logger.info(`Seller ${sellerId} verification rejected: ${reason}`);

      return {
        status: 'rejected',
        reason
      };
    } catch (error) {
      logger.error(`Rejection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get seller certifications
   * Returns badges: verified, organic, fair-trade, gi-certified, etc.
   */
  async getSellerCertifications(sellerId) {
    try {
      const certs = await db('user_certifications')
        .where('user_id', sellerId)
        .where('valid_until', null)
        .orWhere('valid_until', '>', new Date());

      return certs.map(cert => ({
        type: cert.certification_type,
        issued_date: cert.issued_date,
        issuer: cert.issuer,
        badge_icon: this.getBadgeIcon(cert.certification_type)
      }));
    } catch (error) {
      logger.error(`Get certifications failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate seller trust score
   * Based on: verification, certifications, order history, reviews
   */
  async calculateTrustScore(sellerId) {
    try {
      let verification = await db('seller_verifications')
        .where('seller_id', sellerId)
        .where('status', 'verified')
        .first();

      const certifications = await db('user_certifications')
        .where('user_id', sellerId)
        .count('* as count').first();

      const orders = await db('orders')
        .where('seller_id', sellerId)
        .count('* as count').first();

      const reviews = await db('reviews')
        .where('seller_id', sellerId)
        .avg('rating as avg_rating').first();

      // Calculate score (0-100)
      let score = 50; // Base score

      if (verification) score += 20; // Verification boost
      if (certifications.count > 0) score += 10 * Math.min(certifications.count, 3);
      if (orders.count > 0) score += Math.min(orders.count / 10, 10); // Scale by orders
      if (reviews.avg_rating) score += reviews.avg_rating; // Add average rating

      const finalScore = Math.min(score, 100);

      return {
        seller_id: sellerId,
        trust_score: Math.round(finalScore),
        factors: {
          verified: !!verification,
          certifications: certifications.count,
          total_orders: orders.count,
          average_rating: reviews.avg_rating || 0
        }
      };
    } catch (error) {
      logger.error(`Calculate trust score failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get badge icon for certification
   */
  getBadgeIcon(type) {
    const icons = {
      verified_seller: '✓',
      organic: '🌿',
      fair_trade: '🤝',
      gi_certified: '🏆',
      top_seller: '⭐'
    };
    return icons[type] || '🎖️';
  }
}

module.exports = new SellerVerificationService();
