const db = require('../database/dbConnection');
const { logger } = require('../utils/logger');

class PriceForecastingService {
  async forecastProductPrice(productId, days = 30) {
    try {
      const history = await db('price_history').where('product_id', productId).orderBy('date', 'desc').limit(365);
      if (history.length === 0) return { error: 'Insufficient data' };

      const prices = history.map(item => Number(item.price)).filter(Number.isFinite);
      if (prices.length === 0) return { error: 'Insufficient numeric data' };
      const avgPrice = prices.reduce((total, price) => total + price, 0) / prices.length;
      const recent = prices.slice(0, Math.min(7, prices.length));
      const recentAverage = recent.reduce((total, price) => total + price, 0) / recent.length;
      const trendPerDay = recent.length > 1 ? (recent[0] - recent[recent.length - 1]) / (recent.length - 1) : 0;
      const confidence = Math.min(95, Math.max(35, 55 + Math.min(prices.length, 365) / 10));
      const forecast = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        forecasted_price: Number((recentAverage + trendPerDay * (i + 1)).toFixed(2)),
        confidence: Number(confidence.toFixed(1)),
      }));

      logger.info(`Forecast generated: ${productId}`);
      return { product_id: productId, forecast };
    } catch (error) { logger.error(`Forecast failed: ${error.message}`); throw error; }
  }

  async getHistoricalPrices(productId) {
  // Validate inputs
    if (!productId) throw new Error('Missing required parameter');

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
