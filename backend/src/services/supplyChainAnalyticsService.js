const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class SupplyChainAnalyticsService {
  async analyzeShipments(origin, destination) {
  // Validate inputs
  if (!origin) throw new Error('Missing required parameter');

    try {
      const shipments = await db('shipments').where('origin', origin).andWhere('destination', destination);
      const avgDeliveryTime = shipments.length ? shipments.reduce((sum, s) => sum + (s.delivery_time || 0), 0) / shipments.length : 0;
      const totalCost = shipments.reduce((sum, s) => sum + (s.cost || 0), 0);
      const analysis = { origin, destination, shipment_count: shipments.length, avg_delivery_time: avgDeliveryTime, total_cost: totalCost };
      await db('supply_chain_analytics').insert({ id: require('uuid').v4(), analysis_data: JSON.stringify(analysis), created_at: new Date() });
      logger.info(`Supply chain analysis completed: ${origin}-${destination}`);
      return analysis;
    } catch (error) { logger.error(`Analyze shipments failed: ${error.message}`); throw error; }
  }
}

module.exports = new SupplyChainAnalyticsService();
