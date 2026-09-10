/**
 * STRIPE INTEGRATION - COMPLETE
 * Handles all Stripe payment operations
 */

const Stripe = require('stripe');
const db = require('../database/connection');
const { logger } = require('../utils/logger');
const { sendEmail } = require('../services/emailService');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class StripeIntegrationComplete {
  // Create payment intent
  async createPaymentIntent(data) {
    try {
      const {
        amount,
        currency = 'usd',
        customer_id,
        description,
        metadata = {},
      } = data;

      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customer_id,
        description,
        metadata,
        confirmation_method: 'automatic',
      });

      logger.info(`Created Stripe payment intent: ${paymentIntent.id}`);

      // Save to database
      await db.query(
        `INSERT INTO payments (id, user_id, stripe_payment_intent_id, amount, status, data)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          paymentIntent.id,
          metadata.user_id,
          paymentIntent.id,
          amount,
          paymentIntent.status,
          JSON.stringify(paymentIntent),
        ]
      );

      return paymentIntent;
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId, data = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: data.payment_method,
        return_url: data.return_url,
      });

      logger.info(`Confirmed Stripe payment: ${paymentIntentId}`);

      // Update database
      await db.query(
        `UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_payment_intent_id = $2`,
        [paymentIntent.status, paymentIntentId]
      );

      return paymentIntent;
    } catch (error) {
      logger.error('Error confirming payment:', error);
      throw error;
    }
  }

  // Handle payment success
  async handlePaymentSuccess(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Update database
      await db.query(
        `UPDATE payments SET status = $1, completed_at = NOW(), updated_at = NOW()
         WHERE stripe_payment_intent_id = $2`,
        ['succeeded', paymentIntentId]
      );

      // Get order details
      const paymentResult = await db.query(
        `SELECT user_id, data FROM payments WHERE stripe_payment_intent_id = $1`,
        [paymentIntentId]
      );

      if (paymentResult.rows.length > 0) {
        const { user_id, data } = paymentResult.rows[0];

        // Get user email
        const userResult = await db.query(
          'SELECT email FROM users WHERE id = $1',
          [user_id]
        );

        if (userResult.rows.length > 0) {
          const { email } = userResult.rows[0];

          // Send success email
          await sendEmail({
            to: email,
            subject: 'Payment Successful',
            template: 'payment-success',
            data: {
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency.toUpperCase(),
              transactionId: paymentIntentId,
              date: new Date().toLocaleDateString(),
            },
          });
        }
      }

      logger.info(`Payment succeeded: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error handling payment success:', error);
      throw error;
    }
  }

  // Handle payment failure
  async handlePaymentFailure(paymentIntentId, reason) {
    try {
      // Update database
      await db.query(
        `UPDATE payments SET status = $1, failure_reason = $2, updated_at = NOW()
         WHERE stripe_payment_intent_id = $3`,
        ['failed', reason, paymentIntentId]
      );

      // Get user and send failure email
      const paymentResult = await db.query(
        `SELECT user_id FROM payments WHERE stripe_payment_intent_id = $1`,
        [paymentIntentId]
      );

      if (paymentResult.rows.length > 0) {
        const { user_id } = paymentResult.rows[0];
        const userResult = await db.query(
          'SELECT email FROM users WHERE id = $1',
          [user_id]
        );

        if (userResult.rows.length > 0) {
          const { email } = userResult.rows[0];
          await sendEmail({
            to: email,
            subject: 'Payment Failed',
            template: 'payment-failed',
            data: {
              reason,
              transactionId: paymentIntentId,
            },
          });
        }
      }

      logger.warn(`Payment failed: ${paymentIntentId} - ${reason}`);
    } catch (error) {
      logger.error('Error handling payment failure:', error);
      throw error;
    }
  }

  // Process refund
  async processRefund(paymentIntentId, amount = null) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      // Update database
      await db.query(
        `UPDATE payments SET status = $1, refunded_amount = $2, updated_at = NOW()
         WHERE stripe_payment_intent_id = $3`,
        ['refunded', refund.amount / 100, paymentIntentId]
      );

      logger.info(`Refund processed: ${refund.id}`);
      return refund;
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get payment status
  async getPaymentStatus(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      const dbResult = await db.query(
        `SELECT * FROM payments WHERE stripe_payment_intent_id = $1`,
        [paymentIntentId]
      );

      return {
        stripeStatus: paymentIntent.status,
        dbStatus: dbResult.rows[0]?.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        lastError: paymentIntent.last_payment_error,
      };
    } catch (error) {
      logger.error('Error getting payment status:', error);
      throw error;
    }
  }

  // Create customer
  async createCustomer(userData) {
    try {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.name,
        metadata: {
          user_id: userData.user_id,
        },
      });

      // Save to database
      await db.query(
        `UPDATE users SET stripe_customer_id = $1 WHERE id = $2`,
        [customer.id, userData.user_id]
      );

      logger.info(`Created Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(customerId, priceId, metadata = {}) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Save to database
      await db.query(
        `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_price_id, status, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          metadata.user_id,
          subscription.id,
          priceId,
          subscription.status,
          JSON.stringify(subscription),
        ]
      );

      logger.info(`Created subscription: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.del(subscriptionId);

      // Update database
      await db.query(
        `UPDATE subscriptions SET status = $1, cancelled_at = NOW(), updated_at = NOW()
         WHERE stripe_subscription_id = $2`,
        ['canceled', subscriptionId]
      );

      logger.info(`Cancelled subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Handle webhook event
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object.id);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(
            event.data.object.id,
            event.data.object.last_payment_error?.message || 'Unknown error'
          );
          break;

        case 'charge.refunded':
          logger.info(`Refund confirmed: ${event.data.object.id}`);
          await db.query(
            `UPDATE payments SET status = $1 WHERE stripe_payment_intent_id = $2`,
            ['refunded', event.data.object.payment_intent]
          );
          break;

        case 'customer.subscription.deleted':
          logger.info(`Subscription deleted: ${event.data.object.id}`);
          await db.query(
            `UPDATE subscriptions SET status = $1, cancelled_at = NOW()
             WHERE stripe_subscription_id = $2`,
            ['canceled', event.data.object.id]
          );
          break;

        case 'customer.subscription.updated':
          logger.info(`Subscription updated: ${event.data.object.id}`);
          await db.query(
            `UPDATE subscriptions SET status = $1, data = $2, updated_at = NOW()
             WHERE stripe_subscription_id = $3`,
            [
              event.data.object.status,
              JSON.stringify(event.data.object),
              event.data.object.id,
            ]
          );
          break;

        default:
          logger.debug(`Unhandled webhook event: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Error handling webhook event:', error);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(userId, limit = 50) {
    try {
      const result = await db.query(
        `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting payment history:', error);
      throw error;
    }
  }

  // Webhook verification
  verifyWebhookSignature(rawBody, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw error;
    }
  }
}

module.exports = new StripeIntegrationComplete();
