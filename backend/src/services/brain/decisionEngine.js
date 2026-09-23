/**
 * Brain/Decision Engine - AI-Driven Advisory Layer
 *
 * Analyzes context and generates recommendations.
 * From pine-shadow: brain/atlas, brain/decide, brain/tissues
 */

'use strict';

class DecisionEngine {
  constructor() {
    this.decisions = new Map();      // decisionId → definition
    this.rules = new Map();           // ruleId → rule
    this.learningLog = [];            // [{ input, output, outcome }]
  }

  /**
   * Register a decision type
   */
  registerDecision(decisionId, definition) {
    this.decisions.set(decisionId, {
      id: decisionId,
      name: definition.name,
      description: definition.description,
      inputs: definition.inputs || [],
      outputs: definition.outputs || [],
      rules: [],
      createdAt: new Date(),
    });
    return this.decisions.get(decisionId);
  }

  /**
   * Add an inference rule
   */
  addRule(ruleId, rule) {
    this.rules.set(ruleId, {
      id: ruleId,
      decision: rule.decision,
      condition: rule.condition, // function that returns true/false
      recommendation: rule.recommendation, // { action, confidence }
      weight: rule.weight || 1.0,
      createdAt: new Date(),
    });
    return this.rules.get(ruleId);
  }

  /**
   * Make a decision based on context
   */
  decide(decisionId, context) {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    const matchedRules = [];
    for (const rule of this.rules.values()) {
      if (rule.decision !== decisionId) continue;

      try {
        if (rule.condition(context)) {
          matchedRules.push(rule);
        }
      } catch (e) {
        console.error(`Rule ${rule.id} failed:`, e);
      }
    }

    // Sort by weight and confidence
    matchedRules.sort((a, b) => b.weight - a.weight);

    const recommendations = matchedRules.map(rule => ({
      action: rule.recommendation.action,
      confidence: rule.recommendation.confidence || 0.8,
      ruleId: rule.id,
      weight: rule.weight,
    }));

    const result = {
      advisory: true,
      decision: decision.name,
      context,
      recommendations: recommendations.slice(0, 3), // Top 3
      confidence: recommendations.length > 0 ?
        recommendations[0].confidence : 0,
      basis: `Decision engine with ${matchedRules.length} matching rules`,
      timestamp: new Date(),
    };

    // Log for learning
    this.learningLog.push({
      decisionId,
      context,
      recommendations: result.recommendations,
      timestamp: result.timestamp,
    });

    return result;
  }

  /**
   * Recommend crop based on context (example: agriculture decision)
   */
  recommendCrop(context) {
    // context = { region, season, soilType, waterAvailable, marketDemand, farmerExperience }

    const rules = [];

    // Rule 1: High water availability + high market demand
    if ((context.waterAvailable || 0) > 500 && (context.marketDemand || 0) > 0.7) {
      rules.push({action: 'Rice', confidence: 0.9});
    }

    // Rule 2: Low water + high temperature
    if ((context.waterAvailable || 0) < 300 && (context.avgTemp || 0) > 30) {
      rules.push({action: 'Millet', confidence: 0.85});
    }

    // Rule 3: High market demand for vegetables
    if ((context.marketDemand || 0) > 0.8 && !context.climate?.includes('dry')) {
      rules.push({action: 'Vegetables', confidence: 0.8});
    }

    // Rule 4: Experienced farmer + good soil
    if ((context.farmerExperience || 0) > 10 && (context.soilQuality || 0) > 0.7) {
      rules.push({action: 'Horticulture', confidence: 0.75});
    }

    return {
      advisory: true,
      decision: 'Crop Recommendation',
      context,
      recommendations: rules.sort((a, b) => b.confidence - a.confidence),
      basis: 'Rule-based inference engine with regional & contextual factors',
      timestamp: new Date(),
    };
  }

  /**
   * Recommend financial product
   */
  recommendFinance(context) {
    // context = { income, creditScore, loanAmount, purpose, repaymentCapacity }

    const options = [];

    // Microfinance for small amounts
    if ((context.loanAmount || 0) < 50000) {
      options.push({
        product: 'Microfinance',
        interestRate: 0.14,
        term: 12,
        confidence: 0.9,
      });
    }

    // Farm credit for agriculture
    if (context.purpose === 'agriculture' && (context.creditScore || 0) > 600) {
      options.push({
        product: 'Farm Credit',
        interestRate: 0.09,
        term: 36,
        confidence: 0.95,
      });
    }

    // Trade credit for commerce
    if (context.purpose === 'trade' && (context.creditScore || 0) > 650) {
      options.push({
        product: 'Trade Credit',
        interestRate: 0.12,
        term: 24,
        confidence: 0.85,
      });
    }

    return {
      advisory: true,
      decision: 'Financial Product Recommendation',
      context,
      options: options.sort((a, b) => b.confidence - a.confidence),
      basis: 'Credit scoring + product matching rules',
      timestamp: new Date(),
    };
  }

  /**
   * Get learning insights (which decisions worked well)
   */
  getInsights(decisionId) {
    const logs = this.learningLog.filter(log => log.decisionId === decisionId);

    if (logs.length === 0) {
      return { decision: decisionId, logs: 0 };
    }

    // Count successful recommendations (simple: if top recommendation was picked)
    const successRate = logs.filter(log => log.recommendations.length > 0).length / logs.length;

    return {
      advisory: true,
      decision: decisionId,
      totalDecisions: logs.length,
      successRate,
      averageConfidence: logs.reduce((sum, log) => sum + (log.recommendations[0]?.confidence || 0), 0) / logs.length,
      recommendations: 'Consider adjusting rules if success rate < 70%',
    };
  }
}

module.exports = { DecisionEngine };
