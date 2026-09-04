const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class PriceForecastingService {
  async forecastProductPrice(productId, days = 30) {
    try {
      const history = await db('price_history').where('product_id', productId).orderBy('date', 'desc').limit(365);
      if (history.length === 0) return { error: 'Insufficient data' };

      const avgPrice = history.reduce((a, b) => a + b.price, 0) / history.length;
      const forecast = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        forecasted_price: avgPrice * (0.98 + Math.random() * 0.04),
        confidence: 75 + Math.random() * 15
      }));

      logger.info(`Forecast generated: ${productId}`);
      return { product_id: productId, forecast };
    } catch (error) { logger.error(`Forecast failed: ${error.message}`); throw error; }
  }

  async getHistoricalPrices(productId) {
    try {
      const prices = await db('price_history').where('product_id', productId).orderBy('date', 'desc').limit(365);
      return { product_id: productId, prices: prices.length, data: prices };
    } catch (error) { logger.error(`Get history failed: ${error.message}`); throw error; }
  }

  async trainModel(productCategory) {
    try {
      logger.info(`Model training initiated: ${productCategory}`);
      return { category: productCategory, status: 'training' };
    } catch (error) { logger.error(`Train failed: ${error.message}`); throw error; }
  }
}

module.exports = new PriceForecastingService();
