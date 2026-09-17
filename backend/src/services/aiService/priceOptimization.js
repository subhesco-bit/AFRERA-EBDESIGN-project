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
  // FIXME: not wired to real historical price/demand data - returns the
  // identical -1.2 for every product regardless of productId, which then
  // directly scales the real optimal_price's reported demand/revenue
  // impact below. A generic "typical agricultural elasticity" is a
  // starting assumption, not a per-product measurement; fixing this needs
  // real historical price/demand data, not a different guessed constant.
  return -1.2;
}

function calculateRevenueImpact(currentPrice, optimalPrice, elasticity) {
  const priceChange = (optimalPrice - currentPrice) / currentPrice;
  const demandChange = elasticity * priceChange * 100;
  return demandChange + priceChange * 100;
}

function calculateMarginImpact(currentPrice, optimalPrice) {
  // FIXME: not wired to any real cost/COGS data - doesn't use currentPrice,
  // optimalPrice, or productId at all, and returns the identical margin
  // delta for every product. Needs a real product cost data source.
  const currentMargin = 0.25;
  const optimalMargin = 0.28;
  return ((optimalMargin - currentMargin) / currentMargin * 100).toFixed(2);
}

function getCompetitorPrices(productId) {
  // No real market-data API is configured - this used to return the
  // identical hardcoded [280, 295, 310, 275, 305] for every product,
  // presented as real competitor pricing. calculateOptimalPrice() already
  // falls back to currentPrice when this is empty, so an honest "no data"
  // result here doesn't break the weighted-average calculation, it just
  // drops the (fake) competitor signal from it.
  return [];
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
