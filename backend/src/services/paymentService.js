/**
 * Unified Payment Service
 * Handles Stripe/Razorpay payment processing, wallet management, transactions
 * STUB: Requires real Stripe/Razorpay credentials in .env
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_');
const Razorpay = require('razorpay');
const db = require('../database/db');
const cacheService = require('./cacheService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'test_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_key_secret',
});

class PaymentService {
  // Initialize payment gateways
  async init() {
    try {
      console.log('✅ Payment service initialized');
      this.setupWebhooks();
    } catch (error) {
      console.error('Payment service init error:', error);
    }
  }

  // Create wallet for user
  async createWallet(userId) {
    try {
      const result = await db.query(
        'INSERT INTO wallets (user_id, balance, created_at) VALUES ($1, $2, NOW()) RETURNING *',
        [userId, 0]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Create wallet error:', error);
      throw error;
    }
  }

  // Get wallet balance
  async getBalance(userId) {
    try {
      const cached = await cacheService.get(`wallet:${userId}:balance`);
      if (cached) return cached;

      const result = await db.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      const balance = result.rows[0]?.balance || 0;
      await cacheService.set(`wallet:${userId}:balance`, balance, 300);
      return balance;
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  // Process payment via Stripe
  async processStripePayment(userId, amount, paymentMethodId) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'inr',
        payment_method: paymentMethodId,
        confirm: true,
        metadata: { userId },
      });

      if (paymentIntent.status === 'succeeded') {
        await this.recordTransaction(userId, amount, 'stripe', paymentIntent.id);
        await this.updateBalance(userId, amount);
        return { success: true, transactionId: paymentIntent.id };
      }

      return { success: false, error: 'Payment failed' };
    } catch (error) {
      console.error('Stripe payment error:', error);
      throw error;
    }
  }

  // Process payment via Razorpay
  async processRazorpayPayment(userId, amount, orderId) {
    try {
      const payment = await razorpay.payments.fetch(orderId);

      if (payment.status === 'captured') {
        await this.recordTransaction(userId, amount, 'razorpay', payment.id);
        await this.updateBalance(userId, amount);
        return { success: true, transactionId: payment.id };
      }

      return { success: false, error: 'Payment verification failed' };
    } catch (error) {
      console.error('Razorpay payment error:', error);
      throw error;
    }
  }

  // Record transaction
  async recordTransaction(userId, amount, gateway, transactionId) {
    try {
      const result = await db.query(
        `INSERT INTO transactions
         (user_id, amount, gateway, transaction_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [userId, amount, gateway, transactionId, 'completed']
      );

      await cacheService.invalidate(`transactions:${userId}:*`);
      return result.rows[0];
    } catch (error) {
      console.error('Record transaction error:', error);
      throw error;
    }
  }

  // Update wallet balance
  async updateBalance(userId, amount) {
    try {
      const result = await db.query(
        'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 RETURNING *',
        [amount, userId]
      );

      await cacheService.del(`wallet:${userId}:balance`);
      return result.rows[0];
    } catch (error) {
      console.error('Update balance error:', error);
      throw error;
    }
  }

  // Transfer funds between users
  async transferFunds(fromUserId, toUserId, amount) {
    try {
      const fromBalance = await this.getBalance(fromUserId);
      if (fromBalance < amount) {
        throw new Error('Insufficient balance');
      }

      // Debit from user
      await db.query(
        'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
        [amount, fromUserId]
      );

      // Credit to user
      await db.query(
        'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
        [amount, toUserId]
      );

      // Record transactions
      await this.recordTransaction(fromUserId, -amount, 'transfer', `transfer-${Date.now()}`);
      await this.recordTransaction(toUserId, amount, 'transfer', `transfer-${Date.now()}`);

      return { success: true };
    } catch (error) {
      console.error('Transfer error:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactionHistory(userId, limit = 50) {
    try {
      const cached = await cacheService.get(`transactions:${userId}:history`);
      if (cached) return cached;

      const result = await db.query(
        `SELECT * FROM transactions WHERE user_id = $1
         ORDER BY created_at DESC LIMIT $2`,
        [userId, limit]
      );

      const transactions = result.rows;
      await cacheService.set(`transactions:${userId}:history`, transactions, 600);
      return transactions;
    } catch (error) {
      console.error('Get transaction history error:', error);
      throw error;
    }
  }

  // Handle Stripe webhook
  async handleStripeWebhook(event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
  }

  // Handle Razorpay webhook
  async handleRazorpayWebhook(event) {
    const { payload } = event;
    if (event.event === 'payment.authorized') {
      console.log('Payment authorized:', payload.payment.entity);
    }
  }

  setupWebhooks() {
    // Webhooks would be configured in routes/paymentRoutes.js
    console.log('Payment webhooks configured');
  }
}

module.exports = new PaymentService();
