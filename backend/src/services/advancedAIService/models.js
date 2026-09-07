/**
 * Advanced AI model registry/config. Split out of the former monolithic
 * services/advancedAIService.js (M11).
 */

// Advanced AI Models Configuration
const ADVANCED_AI_MODELS = {
  demand_forecasting: {
    type: 'lstm_neural_network',
    architecture: 'seq2seq',
    features: ['season', 'region', 'historical_demand', 'price', 'competitor_pricing', 'weather', 'economic_indicators', 'social_media_sentiment'],
    target: 'demand_quantity',
    accuracy: 0.94,
    retraining_interval: 'daily',
    model_version: '2.1.0'
  },
  price_optimization: {
    type: 'reinforcement_learning',
    algorithm: 'deep_q_network',
    factors: ['supply', 'demand', 'competitor_prices', 'seasonality', 'quality_grade', 'market_sentiment', 'inventory_levels', 'logistics_costs'],
    constraints: ['min_price', 'max_price', 'market_conditions', 'regulatory_limits'],
    accuracy: 0.91,
    retraining_interval: 'hourly',
    model_version: '3.0.1'
  },
  credit_scoring: {
    type: 'ensemble_method',
    algorithms: ['random_forest', 'gradient_boosting', 'neural_network'],
    features: ['fdi_score', 'repayment_history', 'farm_size', 'crop_diversity', 'certifications', 'weather_risk', 'market_volatility', 'social_connections'],
    target: 'credit_risk_level',
    accuracy: 0.96,
    retraining_interval: 'weekly',
    model_version: '4.2.0'
  },
  fraud_detection: {
    type: 'anomaly_detection',
    algorithms: ['autoencoder', 'isolation_forest', 'local_outlier_factor'],
    features: ['transaction_patterns', 'user_behavior', 'location_data', 'timing_patterns', 'device_fingerprint', 'network_analysis'],
    threshold: 0.98,
    accuracy: 0.97,
    retraining_interval: 'daily',
    model_version: '5.1.0'
  },
  recommendation: {
    type: 'hybrid_recommender',
    algorithms: ['collaborative_filtering', 'content_based', 'knowledge_based', 'context_aware'],
    features: ['user_history', 'similar_users', 'item_attributes', 'context', 'real_time_behavior', 'seasonal_preferences'],
    accuracy: 0.89,
    retraining_interval: 'daily',
    model_version: '6.0.0'
  },
  crop_disease_detection: {
    type: 'computer_vision',
    architecture: 'convolutional_neural_network',
    model: 'resnet50',
    accuracy: 0.92,
    input_types: ['image', 'spectral_data'],
    retraining_interval: 'monthly',
    model_version: '7.0.0'
  },
  yield_prediction: {
    type: 'multimodal_learning',
    inputs: ['satellite_imagery', 'weather_data', 'soil_sensors', 'historical_yields', 'crop_health'],
    accuracy: 0.88,
    retraining_interval: 'weekly',
    model_version: '8.1.0'
  },
  supply_chain_optimization: {
    type: 'graph_neural_network',
    architecture: 'temporal_gnn',
    accuracy: 0.85,
    retraining_interval: 'daily',
    model_version: '9.0.0'
  }
};

module.exports = { ADVANCED_AI_MODELS };
