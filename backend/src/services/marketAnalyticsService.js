const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class MarketAnalyticsService {
  async analyzeMarket(productId) {
  // Validate inputs
  if (!productId) throw new Error('Missing required parameter');

    try {
      const prices = await db('price_history').where('product_id', productId).orderBy('created_at', 'desc').limit(30);
      const avgPrice = prices.length ? prices.reduce((sum, p) => sum + p.price, 0) / prices.length : 0;
      const maxPrice = prices.length ? Math.max(...prices.map(p => p.price)) : 0;
      const minPrice = prices.length ? Math.min(...prices.map(p => p.price)) : 0;
      const analysis = { product_id: productId, avg_price: avgPrice, max_price: maxPrice, min_price: minPrice, volatility: maxPrice - minPrice };
      await db('market_analytics').insert({ id: require('uuid').v4(), product_id: productId, analysis_data: JSON.stringify(analysis), created_at: new Date() });
      logger.info(`Market analysis completed: ${productId}`);
      return analysis;
    } catch (error) { logger.error(`Analyze market failed: ${error.message}`); throw error; }
  }
}

module.exports = new MarketAnalyticsService();
