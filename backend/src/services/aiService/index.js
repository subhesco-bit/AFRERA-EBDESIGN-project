/**
 * AI Decision-Making Engine Service
 * Provides intelligent decision-making capabilities for:
 * - Predictive analytics (demand forecasting, price optimization)
 * - Risk assessment (credit scoring, insurance premiums)
 * - Recommendation engine (products, equipment, routes)
 * - Natural language processing (document analysis, query understanding)
 *
 * (M11) Split from the former single-file services/aiService.js into this
 * directory, purely for code organization - behavior is unchanged. Node
 * module resolution treats `require('./services/aiService')` as
 * `./services/aiService.js` OR `./services/aiService/index.js`, whichever
 * exists, so every existing caller anywhere in the codebase continues to
 * resolve here identically, unchanged.
 *
 * Sub-modules:
 *  - models.js                  AI_MODELS registry/config
 *  - demandForecasting.js        predictDemand + its helpers
 *  - priceOptimization.js        optimizePrice + its helpers
 *  - creditRisk.js                assessCreditRisk + its helpers
 *  - fraudDetection.js             detectFraud + its helpers
 *  - recommendationEngine.js        generateRecommendations + its helpers
 *  - recommendationBuilders.js       aiAPI.generateRecommendation task builders
 *  - router.js                       Express router wiring the above into HTTP routes
 */

const router = require('./router');
const { predictDemand } = require('./demandForecasting');
const { optimizePrice } = require('./priceOptimization');
const { assessCreditRisk } = require('./creditRisk');
const { detectFraud } = require('./fraudDetection');
const { generateRecommendations } = require('./recommendationEngine');
const { generateRecommendation } = require('./recommendationBuilders');

function isHealthy() {
  return true; // AI service health check
}

// Same exported shape as the original single-file aiService.js - every
// export name and function signature preserved.
module.exports = {
  router,
  predictDemand,
  optimizePrice,
  assessCreditRisk,
  detectFraud,
  generateRecommendations,
  isHealthy,
  aiAPI: { generateRecommendation }
};
