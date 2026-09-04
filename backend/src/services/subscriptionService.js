const db = require('../database/dbConnection');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

class SubscriptionService {
  async createSubscription(userId, planId) {
    try {
      const subId = require('uuid').v4();
      const sub = await db('subscriptions').insert({
        id: subId, user_id: userId, plan_id: planId,
        status: 'active', start_date: new Date(), created_at: new Date()
      }).returning('*');
      logger.info(`Subscription created: ${userId}`);
      return { subscription_id: subId, status: 'active' };
    } catch (error) {
      logger.error(`Create subscription failed: ${error.message}`);
      throw error;
    }
  }

  async getActiveSubscription(userId) {
    try {
      const sub = await db('subscriptions').where('user_id', userId).where('status', 'active').first();
      if (!sub) return { active: false };
      return { active: true, plan_id: sub.plan_id, started: sub.start_date };
    } catch (error) {
      logger.error(`Get subscription failed: ${error.message}`);
      throw error;
    }
  }

  async upgradeSubscription(subscriptionId, newPlanId) {
    try {
      await db('subscriptions').where('id', subscriptionId).update({
        plan_id: newPlanId, upgraded_date: new Date(), updated_at: new Date()
      });
      logger.info(`Subscription upgraded: ${subscriptionId}`);
      return { subscription_id: subscriptionId, new_plan: newPlanId };
    } catch (error) {
      logger.error(`Upgrade failed: ${error.message}`);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      await db('subscriptions').where('id', subscriptionId).update({
        status: 'cancelled', cancelled_date: new Date()
      });
      logger.info(`Subscription cancelled: ${subscriptionId}`);
      return { subscription_id: subscriptionId, status: 'cancelled' };
    } catch (error) {
      logger.error(`Cancel failed: ${error.message}`);
      throw error;
    }
  }

  async processRecurringPayment(subscriptionId) {
    try {
      const sub = await db('subscriptions').where('id', subscriptionId).first();
      if (!sub) throw new NotFoundError('Subscription not found');

      const payment = await db('subscription_payments').insert({
        id: require('uuid').v4(), subscription_id: subscriptionId, amount: 0,
        status: 'pending', created_at: new Date()
      }).returning('*');
      logger.info(`Payment processed: ${subscriptionId}`);
      return { payment_id: payment[0].id, status: 'pending' };
    } catch (error) {
      logger.error(`Process payment failed: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SubscriptionService();
