/**
 * Price optimization. Split out of the former monolithic
 * services/aiService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

/**
 * Optimize pricing for a product
 */
async function optimizePrice(productId, currentPrice) {
  try {
    const pg = getPostgreSQL();

    // Get market data
    const marketQuery = `
      SELECT
        AVG(price) as avg_market_price,
        MIN(price) as min_market_price,
        MAX(price) as max_market_price,
        STDDEV(price) as price_stddev
      FROM order_items oi
      WHERE oi.product_id = $1
        AND oi.order_date >= NOW() - INTERVAL '3 months'
    `;

    const marketData = await pg.query(marketQuery, [productId]);
    const market = marketData.rows[0];

    // Get competitor pricing (simulated)
    const competitorPrices = await getCompetitorPrices(productId);

    // Calculate optimal price using multi-objective optimization
    const optimalPrice = calculateOptimalPrice(currentPrice, market, competitorPrices);

    const priceElasticity = calculatePriceElasticity(productId);
    const revenueImpact = calculateRevenueImpact(currentPrice, optimalPrice, priceElasticity);

    logger.info(`Price optimization for product ${productId}: ₹${optimalPrice} (current: ₹${currentPrice})`);

    return {
      product_id: productId,
      current_price: currentPrice,
      optimal_price: optimalPrice,
      price_change: ((optimalPrice - currentPrice) / currentPrice * 100).toFixed(2),
      confidence: 0.82,
      market_analysis: {
        average_price: market.avg_market_price,
        price_range: {
          min: market.min_market_price,
          max: market.max_market_price
        },
        competitor_prices: competitorPrices
      },
      impact: {
        expected_demand_change: priceElasticity * ((optimalPrice - currentPrice) / currentPrice * 100),
        revenue_impact: revenueImpact,
        margin_impact: calculateMarginImpact(currentPrice, optimalPrice)
      },
      recommendations: generatePricingRecommendations(optimalPrice, market)
    };
  } catch (error) {
    logger.error('Error optimizing price', { error: error.message, stack: error.stack });
    throw error;
  }
}

function calculateOptimalPrice(currentPrice, market, competitorPrices) {
  const avgMarketPrice = market.avg_market_price || currentPrice;
  const avgCompetitorPrice = competitorPrices.length > 0
    ? competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length
    : currentPrice;

  // Weighted average of market and competitor prices
  const marketWeight = 0.4;
  const competitorWeight = 0.3;
  const currentWeight = 0.3;

  return Math.round(
    avgMarketPrice * marketWeight +
    avgCompetitorPrice * competitorWeight +
    currentPrice * currentWeight
  );
}

function calculatePriceElasticity(productId) {
  // Simplified elasticity calculation
  // In production, use historical price/demand data
  return -1.2; // Typical agricultural product elasticity
}

function calculateRevenueImpact(currentPrice, optimalPrice, elasticity) {
  const priceChange = (optimalPrice - currentPrice) / currentPrice;
  const demandChange = elasticity * priceChange * 100;
  return demandChange + priceChange * 100;
}

function calculateMarginImpact(currentPrice, optimalPrice) {
  const currentMargin = 0.25; // 25% margin
  const optimalMargin = 0.28; // Slightly better margin at optimal price
  return ((optimalMargin - currentMargin) / currentMargin * 100).toFixed(2);
}

function getCompetitorPrices(productId) {
  // Simulated competitor prices
  // In production, fetch from market data APIs
  return [280, 295, 310, 275, 305];
}

function generatePricingRecommendations(optimalPrice, market) {
  const recommendations = [];
  if (optimalPrice > market.avg_market_price * 1.1) {
    recommendations.push('Price is above market average - monitor competition');
  }
  if (optimalPrice < market.avg_market_price * 0.9) {
    recommendations.push('Price is below market average - opportunity for margin improvement');
  }
  return recommendations;
}

module.exports = {
  optimizePrice,
  calculateOptimalPrice,
  calculatePriceElasticity,
  calculateRevenueImpact,
  calculateMarginImpact,
  getCompetitorPrices,
  generatePricingRecommendations
};
