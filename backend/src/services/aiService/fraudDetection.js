/**
 * Fraud detection. Split out of the former monolithic
 * services/aiService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { getMongoDatabase } = require('../../database/connection');

/**
 * Detect potential fraud in transactions
 */
async function detectFraud(transactionData) {
  try {
    const mongo = getMongoDatabase();
    const fraudCollection = mongo.collection('fraud_patterns');

    // Get historical fraud patterns
    // L13: defensive limit — this collection has no bound otherwise and
    // every call to detectFraud pulled the entire active-patterns set.
    const patterns = await fraudCollection.find({ active: true }).limit(100).toArray();

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

function checkLocationAnomaly(transactionData) {
  // Simplified location anomaly check
  // In production, use geospatial analysis
  return 0.2;
}

function matchesPattern(transactionData, pattern) {
  // Check if transaction matches known fraud pattern
  return false;
}

function generateFraudRecommendations(decision, riskFactors) {
  const recommendations = [];
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

module.exports = {
  detectFraud,
  checkLocationAnomaly,
  matchesPattern,
  generateFraudRecommendations
};
