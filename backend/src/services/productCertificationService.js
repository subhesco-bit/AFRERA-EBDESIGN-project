/**
 * Product Certification Service
 * Manages product certifications (GI, Organic, Fair-Trade)
 *
 * Priority: P0 - Critical for marketplace launch
 * Enables: certification badges, GI premium positioning, trust indicators
 */

const db = require('../database/dbConnection');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

class ProductCertificationService {
  /**
   * Add certification to product
   */
  async addCertification(productId, certData) {
    try {
      if (!productId || !certData.certification_type) {
        throw new ValidationError('Missing required fields: productId, certification_type');
      }

      const product = await db('products').where('id', productId).first();
      if (!product) throw new NotFoundError('Product not found');

      const certification = await db('product_certifications').insert({
        id: require('uuid').v4(),
        product_id: productId,
        certification_type: certData.certification_type,
        certificate_number: certData.certificate_number,
        issuer: certData.issuer,
        issued_date: certData.issued_date,
        valid_until: certData.valid_until,
        verification_status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');

      logger.info(`Certification added: ${productId} - ${certData.certification_type}`);

      return {
        certification_id: certification[0].id,
        status: 'pending'
      };
    } catch (error) {
      logger.error(`Add certification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify certification against registry
   */
  async verifyCertification(certCode) {
    try {
      if (!certCode) {
        throw new ValidationError('Missing required fields: certCode');
      }

      const registry = await db('certification_registry')
        .where('certificate_number', certCode)
        .first();

      if (!registry) {
        return {
          valid: false,
          message: 'Certificate not found in registry'
        };
      }

      const cert = await db('product_certifications')
        .where('certificate_number', certCode)
        .update({
          verification_status: 'verified',
          updated_at: new Date()
        });

      logger.info(`Certification verified: ${certCode}`);

      return {
        valid: true,
        certification_type: registry.certification_type,
        issuer: registry.issuer,
        issued_date: registry.issued_date,
        valid_until: registry.valid_until
      };
    } catch (error) {
      logger.error(`Verify certification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get product certifications
   */
  async getProductCertifications(productId) {
    try {
      const certs = await db('product_certifications')
        .where('product_id', productId)
        .where('verification_status', 'verified');

      return certs.map(cert => ({
        type: cert.certification_type,
        issuer: cert.issuer,
        certificate_number: cert.certificate_number,
        issued_date: cert.issued_date,
        valid_until: cert.valid_until,
        badge_icon: this.getCertificationBadge(cert.certification_type)
      }));
    } catch (error) {
      logger.error(`Get product certifications failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Revoke certification
   */
  async revokeCertification(certificationId, reason) {
    try {
      if (!certificationId) {
        throw new ValidationError('Missing required fields: certificationId');
      }

      await db('product_certifications')
        .where('id', certificationId)
        .update({
          verification_status: 'revoked',
          revocation_reason: reason,
          updated_at: new Date()
        });

      logger.info(`Certification revoked: ${certificationId}`);

      return {
        status: 'revoked'
      };
    } catch (error) {
      logger.error(`Revoke certification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get certification badge icon
   */
  getCertificationBadge(type) {
    const badges = {
      gi_certified: '🏆',
      organic: '🌿',
      fair_trade: '🤝',
      sustainable: '🌍'
    };
    return badges[type] || '🎖️';
  }
}

module.exports = new ProductCertificationService();
