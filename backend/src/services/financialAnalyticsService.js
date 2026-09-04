const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class FinancialAnalyticsService {
  async generateFinancialStatement(userId) {
    try {
      const orders = await db('orders').where('user_id', userId);
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
      const statement = { user_id: userId, total_revenue: totalRevenue, total_orders: totalOrders, avg_order_value: avgOrderValue };
      await db('financial_statements').insert({ id: require('uuid').v4(), user_id: userId, statement_data: JSON.stringify(statement), created_at: new Date() });
      logger.info(`Financial statement generated: ${userId}`);
      return statement;
    } catch (error) { logger.error(`Generate statement failed: ${error.message}`); throw error; }
  }
}

module.exports = new FinancialAnalyticsService();
