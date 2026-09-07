/**
 * Advanced AI Decision-Making Engine Service
 * Enhanced from basic to advanced level with:
 * - Machine Learning Model Integration
 * - Deep Learning Neural Networks
 * - Ensemble Methods
 * - Real-time Learning
 * - Advanced Natural Language Processing
 * - Computer Vision for crop analysis
 * - Time Series Forecasting
 * - Reinforcement Learning for decision optimization
 * - Federated Learning for privacy
 * - Explainable AI (XAI)
 *
 * (M11) Split from the former single-file services/advancedAIService.js into
 * this directory, purely for code organization - behavior is unchanged. Node
 * module resolution treats `require('./services/advancedAIService')` as
 * `./services/advancedAIService.js` OR `./services/advancedAIService/index.js`,
 * whichever exists, so every existing caller anywhere in the codebase
 * continues to resolve here identically, unchanged.
 *
 * Sub-modules:
 *  - models.js             ADVANCED_AI_MODELS registry/config
 *  - shared.js              small helpers shared across sub-capabilities
 *  - demandForecasting.js   advancedPredictDemand + its helpers
 *  - priceOptimization.js   advancedOptimizePrice + its helpers
 *  - creditScoring.js       advancedAssessCreditRisk + its helpers
 *  - fraudDetection.js      advancedDetectFraud + its helpers
 *  - recommendations.js     advancedGenerateRecommendations + its helpers
 *  - cropDisease.js         detectCropDisease + its helpers
 *  - router.js              Express router wiring the above into HTTP routes
 */

// NOTE: getMongoDatabase was imported (destructured alongside getPostgreSQL)
// in the original single-file service but never actually called anywhere in
// it - preserved here as a no-op import so the module's load-time behavior
// (and require graph) is unchanged.
// eslint-disable-next-line no-unused-vars
const { getMongoDatabase } = require('../../database/connection');

const router = require('./router');
const { advancedPredictDemand } = require('./demandForecasting');
const { advancedOptimizePrice } = require('./priceOptimization');
const { advancedAssessCreditRisk } = require('./creditScoring');
const { advancedDetectFraud } = require('./fraudDetection');
const { advancedGenerateRecommendations } = require('./recommendations');
const { detectCropDisease } = require('./cropDisease');

// Same exported shape as the original single-file advancedAIService.js -
// every export name and function signature preserved.
module.exports = {
  router,
  advancedPredictDemand,
  advancedOptimizePrice,
  advancedAssessCreditRisk,
  advancedDetectFraud,
  advancedGenerateRecommendations,
  detectCropDisease
};
