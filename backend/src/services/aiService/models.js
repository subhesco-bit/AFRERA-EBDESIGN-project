/**
 * AI model registry/config. Split out of the former monolithic
 * services/aiService.js (M11).
 */

// AI Models configuration
const AI_MODELS = {
  demand_forecasting: {
    type: 'regression',
    features: ['season', 'region', 'historical_demand', 'price', 'competitor_pricing'],
    target: 'demand_quantity',
    accuracy: 0.87
  },
  price_optimization: {
    type: 'optimization',
    factors: ['supply', 'demand', 'competitor_prices', 'seasonality', 'quality_grade'],
    constraints: ['min_price', 'max_price', 'market_conditions'],
    accuracy: 0.82
  },
  credit_scoring: {
    type: 'classification',
    features: ['fdi_score', 'repayment_history', 'farm_size', 'crop_diversity', 'certifications'],
    target: 'credit_risk_level',
    accuracy: 0.89
  },
  fraud_detection: {
    type: 'anomaly_detection',
    features: ['transaction_patterns', 'user_behavior', 'location_data', 'timing_patterns'],
    threshold: 0.95,
    accuracy: 0.91
  },
  recommendation: {
    type: 'collaborative_filtering',
    features: ['user_history', 'similar_users', 'item_attributes', 'context'],
    accuracy: 0.78
  }
};

module.exports = { AI_MODELS };
