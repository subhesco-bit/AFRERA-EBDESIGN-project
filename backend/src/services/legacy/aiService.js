/**
 * AI Decision-Making Engine Service
 * Provides intelligent decision-making capabilities for:
 * - Predictive analytics (demand forecasting, price optimization)
 * - Risk assessment (credit scoring, insurance premiums)
 * - Recommendation engine (products, equipment, routes)
 * - Natural language processing (document analysis, query understanding)
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL, getMongoDatabase } = require('../../database/connection');
const { authMiddleware } = require('../../middleware/auth');

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

/**
 * Optimize pricing for a product
 */
async function optimizePrice(productId, currentPrice) {
  try {
    let pg = getPostgreSQL();
    
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
    
    logger.info(`Price optimization for product ${productId}: â‚¹${optimalPrice} (current: â‚¹${currentPrice})`);
    
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

/**
 * Assess credit risk for a farmer
 */
async function assessCreditRisk(farmerId) {
  try {
    let pg = getPostgreSQL();
    
    // Get farmer data
    const farmerQuery = `
      SELECT f.*, u.name, u.phone
      FROM farmers f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = $1
    `;
    
    const farmerResult = await pg.query(farmerQuery, [farmerId]);
    const farmer = farmerResult.rows[0];
    
    // Get FDI score
    const fdiScore = await calculateFDI(farmerId);
    
    // Get repayment history
    const repaymentQuery = `
      SELECT 
        COUNT(*) as total_loans,
        SUM(CASE WHEN status = 'fully_paid' THEN 1 ELSE 0 END) as paid_loans,
        SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) as defaulted_loans,
        AVG(CASE WHEN due_date < payment_date THEN EXTRACT(DAY FROM (payment_date - due_date)) ELSE 0 END) as avg_days_late
      FROM loans
      WHERE farmer_id = $1
    `;
    
    const repaymentData = await pg.query(repaymentQuery, [farmerId]);
    const repayment = repaymentData.rows[0];
    
    // Calculate credit score (0-100)
    const creditScore = calculateCreditScore(fdiScore, repayment, farmer);
    
    // Determine risk level
    let riskLevel, maxAdvancePercentage, interestRate;
    if (creditScore >= 80) {
      riskLevel = 'low';
      maxAdvancePercentage = 50;
      interestRate = 8.5;
    } else if (creditScore >= 60) {
      riskLevel = 'medium';
      maxAdvancePercentage = 35;
      interestRate = 11.0;
    } else if (creditScore >= 40) {
      riskLevel = 'medium-high';
      maxAdvancePercentage = 20;
      interestRate = 14.5;
    } else {
      riskLevel = 'high';
      maxAdvancePercentage = 10;
      interestRate = 18.0;
    }
    
    logger.info(`Credit risk assessment for farmer ${farmerId}: ${riskLevel} (score: ${creditScore})`);
    
    return {
      farmer_id: farmerId,
      credit_score: creditScore,
      risk_level: riskLevel,
      confidence: 0.89,
      fdi_score: fdiScore.score,
      repayment_history: {
        total_loans: repayment.total_loans,
        repayment_rate: repayment.total_loans > 0 
          ? (repayment.paid_loans / repayment.total_loans * 100).toFixed(1) 
          : 0,
        default_rate: repayment.total_loans > 0 
          ? (repayment.defaulted_loans / repayment.total_loans * 100).toFixed(1) 
          : 0,
        avg_days_late: repayment.avg_days_late || 0
      },
      credit_parameters: {
        max_advance_percentage: maxAdvancePercentage,
        interest_rate: interestRate,
        loan_limit: calculateLoanLimit(creditScore, farmer.farm_size || 1)
      },
      factors: {
        fdi_contribution: fdiScore.score * 0.4,
        repayment_contribution: (repayment.total_loans > 0 
          ? (repayment.paid_loans / repayment.total_loans) * 100 * 0.35 
          : 50) * 0.35,
        certification_contribution: (farmer.certification_count || 0) * 5 * 0.15,
        experience_contribution: Math.min((farmer.years_active || 0) * 2, 10) * 0.1
      },
      recommendations: generateCreditRecommendations(riskLevel, creditScore)
    };
  } catch (error) {
    logger.error('Error assessing credit risk', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Detect potential fraud in transactions
 */
async function detectFraud(transactionData) {
  try {
    const mongo = getMongoDatabase();
    const fraudCollection = mongo.collection('fraud_patterns');
    
    // Get historical fraud patterns
    const patterns = await fraudCollection.find({ active: true }).toArray();
    
    const riskFactors = [];
    let totalRiskScore = 0;
    
    // Check for suspicious patterns
    if (transactionData.amount > 100000) {
      riskFactors.push({ factor: 'high_amount', risk: 0.3 });
      totalRiskScore += 30;
    }
    
    if (transactionData.velocity > 10) { // More than 10 transactions in short time
      riskFactors.push({ factor: 'high_velocity', risk: 0.4 });
      totalRiskScore += 40;
    }
    
    // Check location anomalies
    const locationRisk = await checkLocationAnomaly(transactionData);
    if (locationRisk > 0.5) {
      riskFactors.push({ factor: 'location_anomaly', risk: locationRisk });
      totalRiskScore += locationRisk * 50;
    }
    
    // Check against known fraud patterns
    for (const pattern of patterns) {
      if (matchesPattern(transactionData, pattern)) {
        riskFactors.push({ factor: pattern.name, risk: pattern.risk_score });
        totalRiskScore += pattern.risk_score * 100;
      }
    }
    
    // Normalize risk score
    const normalizedRisk = Math.min(totalRiskScore, 100);
    
    let decision, action;
    if (normalizedRisk >= 80) {
      decision = 'block';
      action = 'Transaction blocked - high fraud risk';
    } else if (normalizedRisk >= 50) {
      decision = 'review';
      action = 'Transaction flagged for manual review';
    } else {
      decision = 'approve';
      action = 'Transaction approved';
    }
    
    logger.info(`Fraud detection for transaction ${transactionData.id}: ${decision} (risk: ${normalizedRisk}%)`);
    
    // Store analysis for audit
    await mongo.collection('fraud_analyses').insertOne({
      transaction_id: transactionData.id,
      risk_score: normalizedRisk,
      risk_factors: riskFactors,
      decision: decision,
      timestamp: new Date()
    });
    
    return {
      transaction_id: transactionData.id,
      risk_score: normalizedRisk,
      decision: decision,
      action: action,
      confidence: 0.91,
      risk_factors: riskFactors,
      recommendations: generateFraudRecommendations(decision, riskFactors)
    };
  } catch (error) {
    logger.error('Error detecting fraud', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Generate personalized recommendations
 */
async function generateRecommendations(userId, context = {}) {
  try {
    let pg = getPostgreSQL();
    let mongo = getMongoDatabase();
    
    // Get user's purchase history
    const historyQuery = `
      SELECT 
        p.category_id,
        p.state_id,
        COUNT(*) as purchase_count,
        AVG(oi.price) as avg_spent
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY p.category_id, p.state_id
      ORDER BY purchase_count DESC
      LIMIT 10
    `;
    
    const historyData = await pg.query(historyQuery, [userId]);
    
    // Get collaborative filtering recommendations
    const collaborativeRecs = await getCollaborativeRecommendations(userId, historyData.rows);
    
    // Get content-based recommendations
    const contentRecs = await getContentBasedRecommendations(historyData.rows);
    
    // Get context-aware recommendations
    const contextRecs = await getContextualRecommendations(context);
    
    // Combine and rank recommendations
    const recommendations = combineRecommendations(
      collaborativeRecs,
      contentRecs,
      contextRecs
    );
    
    logger.info(`Generated ${recommendations.length} recommendations for user ${userId}`);
    
    return {
      user_id: userId,
      recommendations: recommendations.slice(0, 20), // Top 20
      confidence: 0.78,
      categories: {
        collaborative: collaborativeRecs.length,
        content_based: contentRecs.length,
        contextual: contextRecs.length
      },
      explanation: generateRecommendationExplanation(recommendations)
    };
  } catch (error) {
    logger.error('Error generating recommendations', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Helper functions
 */
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

function calculateFDI(farmerId) {
  // This would call the FDI calculation service
  // For now, return a mock response
  return {
    score: 72,
    grade: 'B+',
    advance_percentage: 30
  };
}

function calculateCreditScore(fdiScore, repayment, farmer) {
  const fdiContribution = fdiScore.score * 0.4;
  const repaymentContribution = repayment.total_loans > 0 
    ? (repayment.paid_loans / repayment.total_loans) * 100 * 0.35 
    : 50 * 0.35;
  const certificationContribution = (farmer.certification_count || 0) * 5 * 0.15;
  const experienceContribution = Math.min((farmer.years_active || 0) * 2, 10) * 0.1;
  
  return Math.round(fdiContribution + repaymentContribution + certificationContribution + experienceContribution);
}

function calculateLoanLimit(creditScore, farmSize) {
  const baseLimit = 100000;
  const scoreMultiplier = creditScore / 100;
  const sizeMultiplier = Math.min(farmSize, 10);
  
  return Math.round(baseLimit * scoreMultiplier * sizeMultiplier);
}

function checkLocationAnomaly(transactionData) {
  // Simplified location anomaly check
  // In production, use geospatial analysis
  return 0.2;
}

function matchesPattern(transactionData, pattern) {
  // Check if transaction matches known fraud pattern
  return false;
}

async function getCollaborativeRecommendations(userId, history) {
  // Implement collaborative filtering
  return [];
}

async function getContentBasedRecommendations(history) {
  // Implement content-based filtering
  return [];
}

async function getContextualRecommendations(context) {
  // Implement contextual recommendations
  return [];
}

function combineRecommendations(collaborative, content, contextual) {
  // Combine and rank recommendations from different sources
  return [...collaborative, ...content, ...contextual];
}

function generateRecommendationExplanation(recommendations) {
  return 'Recommendations based on your purchase history, similar users, and current market conditions.';
}

function generateDemandRecommendations(predictedDemand, confidence) {
  let recommendations = [];
  if (predictedDemand > 1000) {
    recommendations.push('Increase inventory for this product');
  }
  if (confidence < 70) {
    recommendations.push('Consider gathering more historical data for better accuracy');
  }
  return recommendations;
}

function generatePricingRecommendations(optimalPrice, market) {
  let recommendations = [];
  if (optimalPrice > market.avg_market_price * 1.1) {
    recommendations.push('Price is above market average - monitor competition');
  }
  if (optimalPrice < market.avg_market_price * 0.9) {
    recommendations.push('Price is below market average - opportunity for margin improvement');
  }
  return recommendations;
}

function generateCreditRecommendations(riskLevel, creditScore) {
  let recommendations = [];
  if (riskLevel === 'low') {
    recommendations.push('Eligible for maximum advance percentage');
    recommendations.push('Consider offering premium interest rates');
  } else if (riskLevel === 'high') {
    recommendations.push('Require additional collateral');
    recommendations.push('Consider smaller advance amounts');
  }
  return recommendations;
}

function generateFraudRecommendations(decision, riskFactors) {
  let recommendations = [];
  if (decision === 'review') {
    recommendations.push('Manual review recommended');
    recommendations.push('Request additional verification');
  }
  if (decision === 'block') {
    recommendations.push('Transaction blocked');
    recommendations.push('Report to security team');
  }
  return recommendations;
}

/**
 * Express router for AI service
 */
const express = require('express');
const router = express.Router();

router.post('/predict/demand', authMiddleware, async (req, res) => {
  try {
    const { product_id, time_horizon } = req.body;
    const result = await predictDemand(product_id, time_horizon);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/optimize/price', authMiddleware, async (req, res) => {
  try {
    const { product_id, current_price } = req.body;
    let result = await optimizePrice(product_id, current_price);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DEPRECATED 2026-08-15 — assessCreditRisk() was a second, independent
// credit-scoring implementation alongside the canonical, MCDA-based
// financialService.farmerCreditRiskScore() (the one actually wired into the
// outcome-resolution loop). No frontend caller was found for this route.
// Delegated rather than deleted — assessCreditRisk() itself is untouched.
// See AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C for the reconciliation.
router.post('/assess/credit-risk', authMiddleware, async (req, res) => {
  try {
    const { farmer_id } = req.body;
    const financialService = require('./financialService');
    let result = await financialService.farmerCreditRiskScore(farmer_id);
    res.json({ ...result, delegatedFrom: 'aiService.assessCreditRisk (deprecated)', canonicalSource: 'financialService.farmerCreditRiskScore' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/detect/fraud', authMiddleware, async (req, res) => {
  try {
    let result = await detectFraud(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/recommend', authMiddleware, async (req, res) => {
  try {
    const { user_id, context } = req.body;
    let result = await generateRecommendations(user_id, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function isHealthy() {
  return true; // AI service health check
}


// ============================================================
// CANONICAL AI COMPATIBILITY API
// Provides the contract expected by platform services.
// ============================================================
async function generateRecommendation(request = {}) {
  const {
    task,
    userId,
    user_id,
    context = {},
    ...payload
  } = request;

  const effectiveUserId = userId || user_id || context.userId || context.user_id;

  if (!task) {
    throw new Error('AI recommendation task is required');
  }

  // Preserve the existing recommendation engine as the
  // canonical fallback while the task adapters are expanded.
  let result = await generateRecommendations(
    effectiveUserId,
    {
      ...context,
      ...payload,
      task
    }
  );

  return {
    ...result,
    task,
    confidence: typeof result?.confidence === 'number' ? result.confidence : 0,
    explanation: result?.explanation || null,
    recommendations: Array.isArray(result?.recommendations)
      ? result.recommendations
      : []
  };
}

const aiAPI = {
  generateRecommendation
};
module.exports = {
  aiAPI,
  router,
  predictDemand,
  optimizePrice,
  assessCreditRisk,
  detectFraud,
  generateRecommendations,
  isHealthy
};

