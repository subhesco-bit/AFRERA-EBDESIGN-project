/**
 * AI Confidence Engine
 * Component ID: EBD-CMP-00000004
 * Purpose: AI confidence scoring and threshold management
 * 
 * This module provides confidence scoring for AI decisions across
 * multiple dimensions: model confidence, source confidence, retrieval
 * confidence, rule confidence, data quality, consistency, and historical accuracy.
 */

'use strict';

const { logger } = require('../../utils/logger');

/**
 * Confidence dimensions
 */
const CONFIDENCE_DIMENSIONS = {
  MODEL_CONFIDENCE: 'model_confidence',
  SOURCE_CONFIDENCE: 'source_confidence',
  RETRIEVAL_CONFIDENCE: 'retrieval_confidence',
  RULE_CONFIDENCE: 'rule_confidence',
  DATA_QUALITY: 'data_quality',
  CONSISTENCY: 'consistency',
  HISTORICAL_ACCURACY: 'historical_accuracy',
};

/**
 * Default confidence thresholds
 */
const DEFAULT_THRESHOLDS = {
  AUTO_EXECUTE: 0.9,
  HUMAN_REVIEW: 0.7,
  REJECT: 0.5,
};

/**
 * Calculate overall confidence from dimensions
 */
function calculateOverallConfidence(scores) {
  if (!scores || Object.keys(scores).length === 0) {
    return { overall: 0, dimensions: {}, decision: 'reject' };
  }
  
  const weights = {
    [CONFIDENCE_DIMENSIONS.MODEL_CONFIDENCE]: 0.25,
    [CONFIDENCE_DIMENSIONS.SOURCE_CONFIDENCE]: 0.20,
    [CONFIDENCE_DIMENSIONS.RETRIEVAL_CONFIDENCE]: 0.15,
    [CONFIDENCE_DIMENSIONS.RULE_CONFIDENCE]: 0.15,
    [CONFIDENCE_DIMENSIONS.DATA_QUALITY]: 0.10,
    [CONFIDENCE_DIMENSIONS.CONSISTENCY]: 0.10,
    [CONFIDENCE_DIMENSIONS.HISTORICAL_ACCURACY]: 0.05,
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const [dimension, score] of Object.entries(scores)) {
    const weight = weights[dimension] || 0.1;
    weightedSum += score * weight;
    totalWeight += weight;
  }
  
  const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  return {
    overall: Math.round(overall * 100) / 100,
    dimensions: scores,
    decision: getDecision(overall),
  };
}

/**
 * Get decision based on confidence score
 */
function getDecision(confidence, thresholds = DEFAULT_THRESHOLDS) {
  if (confidence >= thresholds.AUTO_EXECUTE) {
    return 'auto_execute';
  } else if (confidence >= thresholds.HUMAN_REVIEW) {
    return 'human_review';
  } else if (confidence >= thresholds.REJECT) {
    return 'fallback';
  } else {
    return 'reject';
  }
}

/**
 * Evaluate confidence with specific criteria
 */
function evaluateConfidence(criteria) {
  const scores = {};
  
  // Model confidence
  if (criteria.modelScore !== undefined) {
    scores[CONFIDENCE_DIMENSIONS.MODEL_CONFIDENCE] = criteria.modelScore;
  }
  
  // Source confidence
  if (criteria.sourceReliability !== undefined) {
    scores[CONFIDENCE_DIMENSIONS.SOURCE_CONFIDENCE] = criteria.sourceReliability;
  }
  
  // Retrieval confidence
  if (criteria.retrievalScore !== undefined) {
    scores[CONFIDENCE_DIMENSIONS.RETRIEVAL_CONFIDENCE] = criteria.retrievalScore;
  }
  
  // Rule confidence
  if (criteria.ruleMatchStrength !== undefined) {
    scores[CONFIDENCE_DIMENSIONS.RULE_CONFIDENCE] = criteria.ruleMatchStrength;
  }
  
  // Data quality
  if (criteria.dataFreshness !== undefined) {
    scores[CONFIDENCE_DIMENSIONS.DATA_QUALITY] = criteria.dataFreshness;
  }
  
  // Consistency
  if (criteria.consistencyScore !== undefined) {
    scores[CONFIDENCE_DIMENSIONS.CONSISTENCY] = criteria.consistencyScore;
  }
  
  // Historical accuracy
  if (criteria.historicalAccuracy !== undefined) {
    scores[CONFIDENCE_DIMENSIONS.HISTORICAL_ACCURACY] = criteria.historicalAccuracy;
  }
  
  return calculateOverallConfidence(scores);
}

/**
 * Check if confidence meets threshold
 */
function meetsThreshold(confidence, threshold) {
  return confidence.overall >= threshold;
}

/**
 * Get recommended action based on confidence
 */
function getRecommendedAction(confidenceResult) {
  switch (confidenceResult.decision) {
    case 'auto_execute':
      return {
        action: 'proceed',
        reason: 'High confidence - automatic execution approved',
        requiresHumanApproval: false,
      };
    case 'human_review':
      return {
        action: 'review',
        reason: 'Medium confidence - human review required',
        requiresHumanApproval: true,
      };
    case 'fallback':
      return {
        action: 'fallback',
        reason: 'Low confidence - fallback to deterministic system',
        requiresHumanApproval: false,
      };
    case 'reject':
      return {
        action: 'reject',
        reason: 'Very low confidence - reject result',
        requiresHumanApproval: true,
      };
    default:
      return {
        action: 'unknown',
        reason: 'Unable to determine action',
        requiresHumanApproval: true,
      };
  }
}

/**
 * Update historical accuracy for an engine
 */
function updateHistoricalAccuracy(engineId, predicted, actual) {
  // This would typically interact with a database
  // For now, we'll log the update
  logger.info(`Historical accuracy update for ${engineId}: predicted=${predicted}, actual=${actual}`);
  
  // In production, this would update a running average
  // stored in the database or in-memory cache
}

module.exports = {
  CONFIDENCE_DIMENSIONS,
  DEFAULT_THRESHOLDS,
  calculateOverallConfidence,
  getDecision,
  evaluateConfidence,
  meetsThreshold,
  getRecommendedAction,
  updateHistoricalAccuracy,
};