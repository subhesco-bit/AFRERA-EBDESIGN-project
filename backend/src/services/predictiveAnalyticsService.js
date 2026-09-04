const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class PredictiveAnalyticsService {
  async predictDemand(productId) {
    try {
      const orders = await db('orders').where('product_id', productId).orderBy('created_at', 'desc').limit(60);
      const avgMonthlyDemand = orders.length / 2; // Rough estimate
      const trend = orders.length > 20 ? 'increasing' : 'stable';
      const prediction = { product_id: productId, predicted_demand: avgMonthlyDemand, trend, confidence: 0.75 };
      await db('demand_predictions').insert({ id: require('uuid').v4(), product_id: productId, prediction_data: JSON.stringify(prediction), created_at: new Date() });
      logger.info(`Demand prediction generated: ${productId}`);
      return prediction;
    } catch (error) { logger.error(`Predict demand failed: ${error.message}`); throw error; }
  }
}

module.exports = new PredictiveAnalyticsService();
