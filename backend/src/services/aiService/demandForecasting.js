/**
 * Demand forecasting. Split out of the former monolithic
 * services/aiService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

/**
 * Predict demand for a product
 */
async function predictDemand(productId, timeHorizon = 30) {
  try {
    const pg = getPostgreSQL();

    // Get historical data
    const historicalQuery = `
      SELECT
        DATE_TRUNC('month', order_date) as month,
        SUM(quantity) as demand,
        AVG(price) as avg_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = $1
        AND order_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', order_date)
      ORDER BY month DESC
    `;

    const historicalData = await pg.query(historicalQuery, [productId]);

    // Get product details
    const productQuery = `
      SELECT p.*, c.name as category_name, s.name as state_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE p.id = $1
    `;

    const productResult = await pg.query(productQuery, [productId]);
    const product = productResult.rows[0];

    // Simple demand forecasting model (in production, use ML models)
    const seasonalFactor = getSeasonalFactor(product.category_name);
    const trendFactor = calculateTrend(historicalData.rows);
    const baseDemand = historicalData.rows.length > 0
      ? historicalData.rows.reduce((sum, row) => sum + parseFloat(row.demand), 0) / historicalData.rows.length
      : 100;

    const predictedDemand = Math.round(baseDemand * seasonalFactor * trendFactor);

    const confidence = calculateConfidence(historicalData.rows.length, product.gi_status);

    logger.info(`Demand prediction for product ${productId}: ${predictedDemand} (confidence: ${confidence}%)`);

    return {
      product_id: productId,
      predicted_demand: predictedDemand,
      time_horizon_days: timeHorizon,
      confidence: confidence,
      factors: {
        seasonal: seasonalFactor,
        trend: trendFactor,
        base_demand: baseDemand
      },
      recommendations: generateDemandRecommendations(predictedDemand, confidence)
    };
  } catch (error) {
    logger.error('Error predicting demand', { error: error.message, stack: error.stack });
    throw error;
  }
}

function getSeasonalFactor(category) {
  const seasonalFactors = {
    'Grains & Millets': 1.2,
    'Spices': 1.4,
    'Fruits': 1.3,
    'Vegetables & Greens': 1.1,
    'Tea & Beverages': 0.9,
    'Honey & Sweeteners': 1.0
  };
  return seasonalFactors[category] || 1.0;
}

function calculateTrend(historicalData) {
  if (historicalData.length < 2) return 1.0;

  const recent = historicalData.slice(0, 3).reduce((sum, row) => sum + parseFloat(row.demand), 0) / 3;
  const older = historicalData.slice(3, 6).reduce((sum, row) => sum + parseFloat(row.demand), 0) / 3;

  return older > 0 ? recent / older : 1.0;
}

function calculateConfidence(dataPoints, giStatus) {
  const baseConfidence = Math.min(dataPoints * 5, 80);
  const giBonus = giStatus ? 10 : 0;
  return Math.min(baseConfidence + giBonus, 95);
}

function generateDemandRecommendations(predictedDemand, confidence) {
  const recommendations = [];
  if (predictedDemand > 1000) {
    recommendations.push('Increase inventory for this product');
  }
  if (confidence < 70) {
    recommendations.push('Consider gathering more historical data for better accuracy');
  }
  return recommendations;
}

module.exports = {
  predictDemand,
  getSeasonalFactor,
  calculateTrend,
  calculateConfidence,
  generateDemandRecommendations
};
