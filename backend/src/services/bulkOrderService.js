const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class BulkOrderService {
  async createBulkOrder(data) {
    try {
      const id = require('uuid').v4();
      await db('bulk_orders').insert({
        id, buyer_id: data.buyer_id, quantity: data.quantity, total_amount: data.total_amount,
        status: 'requested', created_at: new Date()
      });
      logger.info(`Bulk order created: ${id}`);
      return { order_id: id, status: 'requested' };
    } catch (error) { logger.error(`Create order failed: ${error.message}`); throw error; }
  }

  async getQuotations(orderId) {
    try {
      const quotations = await db('bulk_quotations').where('bulk_order_id', orderId);
      return { order_id: orderId, quotations };
    } catch (error) { logger.error(`Get quotations failed: ${error.message}`); throw error; }
  }
}

module.exports = new BulkOrderService();
