/**
 * Advanced fraud detection (statistical anomaly detection). Split out of
 * the former monolithic services/advancedAIService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const stats = require('../../utils/statistics');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');
const { ADVANCED_AI_MODELS } = require('./models');
const { column } = require('./shared');

/**
 * Advanced Fraud Detection with Multiple Algorithms
 */
async function advancedDetectFraud(transactionData, userId) {
  try {
    const pg = getPostgreSQL();

    // Get user behavior patterns
    const behaviorPatterns = await getUserBehaviorPatterns(userId);

    // Get transaction context
    const transactionContext = await getTransactionContext(transactionData);

    // Load fraud detection models
    const models = await loadFraudDetectionModels();

    // Run anomaly detection
    const anomalyScores = {};
    for (const [modelName, model] of Object.entries(models)) {
      anomalyScores[modelName] = await model.detectAnomaly(transactionData, behaviorPatterns, transactionContext);
    }

    // Ensemble anomaly scores
    const ensembleScore = ensembleAnomalyScores(anomalyScores);

    // Get detailed analysis
    const detailedAnalysis = await analyzeAnomalyDetails(transactionData, behaviorPatterns, ensembleScore);

    // Determine fraud probability
    const fraudProbability = calculateFraudProbability(ensembleScore, detailedAnalysis);

    // Generate fraud report
    const fraudReport = generateFraudReport(transactionData, ensembleScore, detailedAnalysis, fraudProbability);

    // Store fraud detection results
    await storeFraudDetectionResults(transactionData.transaction_id, fraudReport);

    logger.info(`Advanced fraud detection for transaction ${transactionData.transaction_id}: ${fraudProbability}`);

    // Afferent signal: publish the finding so the decision engine can correlate
    // it with payment/order activity for the same actor. Previously this
    // assessment died inside this function - no other module could react to it.
    signalBus.emitSignal(
      SIGNAL.FRAUD_SUSPECTED,
      { probability: fraudProbability, transaction_id: transactionData.transaction_id },
      {
        severity: fraudProbability >= 0.8 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
        source: 'advancedAIService',
        entityId: userId
      }
    );

    return {
      transaction_id: transactionData.transaction_id,
      fraud_probability: fraudProbability,
      risk_level: assessFraudRiskLevel(fraudProbability),
      anomaly_scores: anomalyScores,
      ensemble_score: ensembleScore,
      detailed_analysis: detailedAnalysis,
      fraud_report: fraudReport,
      recommended_actions: generateFraudResponseActions(fraudProbability),
      model_info: {
        algorithms: ADVANCED_AI_MODELS.fraud_detection.algorithms,
        version: ADVANCED_AI_MODELS.fraud_detection.model_version,
        threshold: ADVANCED_AI_MODELS.fraud_detection.threshold
      }
    };
  } catch (error) {
    logger.error('Advanced fraud detection failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

// --- fraud helpers -----------------------------------------------------------

async function loadFraudDetectionModels() {
  return {
    modelType: 'statistical_anomaly',
    detect: (series, value) => {
      const z = stats.stdDev(series) === 0
        ? 0
        : Math.abs((value - stats.mean(series)) / stats.stdDev(series));
      const outliers = stats.iqrOutliers([...series, value]);
      const isIqrOutlier = outliers.some((o) => o.value === value);
      return { z_score: z, iqr_outlier: isIqrOutlier };
    }
  };
}

async function getUserBehaviorPatterns(userId) {
  try {
    const pg = getPostgreSQL();
    if (!pg) return { available: false, amounts: [] };
    const r = await pg.query(
      `SELECT total_amount FROM orders WHERE buyer_id = $1
       ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    return { available: true, amounts: column(r.rows, 'total_amount').filter(Number.isFinite) };
  } catch (error) {
    logger.warn('getUserBehaviorPatterns unavailable', { error: error.message });
    return { available: false, amounts: [] };
  }
}

async function getTransactionContext(transactionData) {
  return {
    amount: parseFloat(transactionData?.amount) || 0,
    hour: new Date().getHours(),
    is_unusual_hour: new Date().getHours() < 5 || new Date().getHours() > 23
  };
}

function ensembleAnomalyScores(signals) {
  const vals = Object.values(signals || {}).filter((v) => Number.isFinite(v));
  if (vals.length === 0) return 0;
  return Math.min(1, stats.mean(vals));
}

function calculateFraudProbability(zScore, isOutlier, context) {
  // Logistic squashing of the z-score, nudged by corroborating signals.
  let x = zScore - 2.5;
  if (isOutlier) x += 1;
  if (context?.is_unusual_hour) x += 0.5;
  return 1 / (1 + Math.exp(-x));
}

function assessFraudRiskLevel(probability) {
  if (probability >= 0.8) return 'critical';
  if (probability >= 0.6) return 'high';
  if (probability >= 0.35) return 'medium';
  return 'low';
}

function analyzeAnomalyDetails(zScore, isOutlier, context, history) {
  return {
    z_score: zScore,
    iqr_outlier: isOutlier,
    baseline_mean: stats.mean(history),
    baseline_std_dev: stats.stdDev(history),
    sample_size: history.length,
    unusual_hour: !!context?.is_unusual_hour,
    sufficient_history: history.length >= 10
  };
}

function generateFraudResponseActions(riskLevel) {
  switch (riskLevel) {
    case 'critical':
      return [{ action: 'block_transaction' }, { action: 'notify_security' }, { action: 'require_manual_review' }];
    case 'high':
      return [{ action: 'hold_for_review' }, { action: 'request_additional_verification' }];
    case 'medium':
      return [{ action: 'flag_for_monitoring' }];
    default:
      return [{ action: 'allow' }];
  }
}

async function generateFraudReport(transactionData, details, probability, riskLevel) {
  return {
    transaction: transactionData?.id ?? null,
    probability,
    risk_level: riskLevel,
    details,
    generated_at: new Date().toISOString()
  };
}

async function storeFraudDetectionResults(userId, report) {
  try {
    const pg = getPostgreSQL();
    if (!pg) return { stored: false, reason: 'no_database' };
    await pg.query(
      `INSERT INTO fraud_detection_results (user_id, risk_level, probability, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, report.risk_level, report.probability, JSON.stringify(report.details)]
    );
    return { stored: true };
  } catch (error) {
    // Never let audit-logging failure break the fraud decision itself.
    logger.warn('storeFraudDetectionResults failed', { error: error.message });
    return { stored: false, reason: error.message };
  }
}

module.exports = {
  advancedDetectFraud,
  loadFraudDetectionModels,
  getUserBehaviorPatterns,
  getTransactionContext,
  ensembleAnomalyScores,
  calculateFraudProbability,
  assessFraudRiskLevel,
  analyzeAnomalyDetails,
  generateFraudResponseActions,
  generateFraudReport,
  storeFraudDetectionResults
};
