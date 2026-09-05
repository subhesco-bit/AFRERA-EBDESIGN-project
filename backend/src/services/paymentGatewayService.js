/**
 * Payment Gateway Service
 * Handles payment processing through multiple payment gateways
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');

class PaymentGatewayService {
  constructor() {
    this.db = null;
    this.supportedGateways = ['stripe', 'razorpay', 'paytm', 'phonepe'];
  }

  async initialize() {
    try {
      this.db = getPostgreSQL();
      logger.info('PaymentGatewayService initialized');
    } catch (error) {
      logger.error('PaymentGatewayService initialization failed', error);
    }
  }

  /**
   * Process a payment through the specified gateway
   */
  async processPayment(paymentData) {
    const { 
      userId, 
      amount, 
      currency = 'INR', 
      gateway = 'razorpay',
      paymentMethod,
      description,
      metadata = {} 
    } = paymentData;

    try {
      // Validate payment data
      if (!userId || !amount || !paymentMethod) {
        throw new Error('Missing required payment fields');
      }

      // Create payment record in database
      const paymentId = await this.createPaymentRecord({
        userId,
        amount,
        currency,
        gateway,
        paymentMethod,
        description,
        status: 'pending',
        metadata
      });

      // Process payment through gateway
      const gatewayResult = await this.processWithGateway(gateway, {
        paymentId,
        amount,
        currency,
        paymentMethod,
        description
      });

      // Update payment status
      await this.updatePaymentStatus(paymentId, gatewayResult.status, gatewayResult);

      return {
        paymentId,
        status: gatewayResult.status,
        gatewayResponse: gatewayResult
      };
    } catch (error) {
      logger.error('Payment processing failed', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const query = `
        SELECT * FROM payments 
        WHERE payment_id = $1
      `;
      const result = await this.db.query(query, [paymentId]);
      
      if (result.rows.length === 0) {
        throw new Error('Payment not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get payment status failed', error);
      throw error;
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId, refundData) {
    const { amount, reason } = refundData;

    try {
      // Get payment details
      const payment = await this.getPaymentStatus(paymentId);
      
      if (payment.status !== 'completed') {
        throw new Error('Can only refund completed payments');
      }

      // Process refund through gateway
      const refundResult = await this.processRefundWithGateway(
        payment.gateway,
        payment.gateway_transaction_id,
        amount || payment.amount,
        reason
      );

      // Create refund record
      await this.createRefundRecord({
        paymentId,
        amount: amount || payment.amount,
        reason,
        gatewayRefundId: refundResult.refund_id,
        status: refundResult.status
      });

      return refundResult;
    } catch (error) {
      logger.error('Payment refund failed', error);
      throw error;
    }
  }

  /**
   * Get supported payment gateways
   */
  async getSupportedGateways() {
    return {
      gateways: this.supportedGateways,
      features: {
        stripe: { cards: true, upi: false, netbanking: true },
        razorpay: { cards: true, upi: true, netbanking: true, wallet: true },
        paytm: { cards: true, upi: true, wallet: true, netbanking: true },
        phonepe: { cards: true, upi: true, wallet: true }
      }
    };
  }

  /**
   * Create payment record in database
   */
  async createPaymentRecord(paymentData) {
    try {
      let query = `
        INSERT INTO payments (
          user_id, amount, currency, gateway, payment_method, 
          description, status, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING payment_id
      `;
      const values = [
        paymentData.userId,
        paymentData.amount,
        paymentData.currency,
        paymentData.gateway,
        paymentData.paymentMethod,
        paymentData.description,
        paymentData.status,
        JSON.stringify(paymentData.metadata)
      ];
      
      let result = await this.db.query(query, values);
      return result.rows[0].payment_id;
    } catch (error) {
      logger.error('Create payment record failed', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId, status, gatewayResponse) {
    try {
      let query = `
        UPDATE payments 
        SET status = $1, 
            gateway_transaction_id = $2,
            gateway_response = $3,
            updated_at = NOW()
        WHERE payment_id = $4
      `;
      await this.db.query(query, [
        status,
        gatewayResponse.transaction_id,
        JSON.stringify(gatewayResponse),
        paymentId
      ]);
    } catch (error) {
      logger.error('Update payment status failed', error);
      throw error;
    }
  }

  /**
   * Process payment with specific gateway
   */
  async processWithGateway(gateway, paymentData) {
    // Mock implementation - replace with actual gateway SDK calls
    logger.info(`Processing payment with ${gateway}`, paymentData);
    
    // Simulate gateway processing
    return {
      status: 'completed',
      transaction_id: `txn_${Date.now()}`,
      message: 'Payment processed successfully'
    };
  }

  /**
   * Process refund with specific gateway
   */
  async processRefundWithGateway(gateway, transactionId, amount, reason) {
    // Mock implementation - replace with actual gateway SDK calls
    logger.info(`Processing refund with ${gateway}`, { transactionId, amount, reason });
    
    return {
      status: 'completed',
      refund_id: `ref_${Date.now()}`,
      message: 'Refund processed successfully'
    };
  }

  /**
   * Create refund record
   */
  async createRefundRecord(refundData) {
    try {
      let query = `
        INSERT INTO refunds (
          payment_id, amount, reason, gateway_refund_id, 
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      await this.db.query(query, [
        refundData.paymentId,
        refundData.amount,
        refundData.reason,
        refundData.gatewayRefundId,
        refundData.status
      ]);
    } catch (error) {
      logger.error('Create refund record failed', error);
      throw error;
    }
  }
}

module.exports = new PaymentGatewayService();
