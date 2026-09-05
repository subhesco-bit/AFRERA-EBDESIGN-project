/**
 * AI Cost Controller
 * Component ID: EBD-CMP-00000005
 * Purpose: AI cost tracking and budget management
 * 
 * This module provides comprehensive cost tracking for AI operations
 * including token counting, request counting, and budget management.
 */

'use strict';

const { logger } = require('../../utils/logger');

/**
 * Cost tracking state
 */
const costState = {
  hourlyBudget: 10.0,
  dailyBudget: 100.0,
  hourlySpend: 0.0,
  dailySpend: 0.0,
  tokenCount: 0,
  requestCount: 0,
  lastReset: Date.now(),
};

/**
 * Cost rates per 1K tokens (USD)
 */
const COST_RATES = {
  claude: 0.003,
  openai: 0.002,
  gemini: 0.001,
  deepseek: 0.001,
};

/**
 * Record cost for an AI operation
 */
function recordCost(provider, tokens, metadata = {}) {
  const rate = COST_RATES[provider] || 0.002;
  const cost = (tokens / 1000) * rate;
  
  costState.tokenCount += tokens;
  costState.requestCount += 1;
  costState.hourlySpend += cost;
  costState.dailySpend += cost;
  
  // Check if we need to reset counters
  checkResetWindow();
  
  // Check budget constraints
  const budgetCheck = checkBudgetConstraints();
  
  if (!budgetCheck.withinBudget) {
    logger.warn(`Budget exceeded: ${budgetCheck.reason}`);
  }
  
  logger.info(`AI Cost recorded: provider=${provider}, tokens=${tokens}, cost=$${cost.toFixed(4)}`);
  
  return {
    cost,
    tokens,
    provider,
    withinBudget: budgetCheck.withinBudget,
    budgetWarning: budgetCheck.warning,
    ...metadata,
  };
}

/**
 * Check if we need to reset counters
 */
function checkResetWindow() {
  const now = Date.now();
  const hoursSinceReset = (now - costState.lastReset) / (1000 * 60 * 60);
  
  if (hoursSinceReset >= 1) {
    costState.hourlySpend = 0;
    costState.lastReset = now;
  }
  
  if (hoursSinceReset >= 24) {
    costState.dailySpend = 0;
  }
}

/**
 * Check budget constraints
 */
function checkBudgetConstraints() {
  const hourlyUtilization = costState.hourlySpend / costState.hourlyBudget;
  const dailyUtilization = costState.dailySpend / costState.dailyBudget;
  
  let warning = null;
  let withinBudget = true;
  let reason = null;
  
  if (hourlyUtilization >= 1.0) {
    withinBudget = false;
    reason = 'Hourly budget exceeded';
  } else if (hourlyUtilization >= 0.9) {
    warning = 'Hourly budget at 90% capacity';
  }
  
  if (dailyUtilization >= 1.0) {
    withinBudget = false;
    reason = 'Daily budget exceeded';
  } else if (dailyUtilization >= 0.9) {
    warning = 'Daily budget at 90% capacity';
  }
  
  return { withinBudget, warning, reason };
}

/**
 * Get current cost state
 */
function getCostState() {
  checkResetWindow();
  
  return {
    ...costState,
    hourlyUtilization: costState.hourlySpend / costState.hourlyBudget,
    dailyUtilization: costState.dailySpend / costState.dailyBudget,
    averageCostPerRequest: costState.requestCount > 0 
      ? costState.hourlySpend / costState.requestCount 
      : 0,
    averageTokensPerRequest: costState.requestCount > 0 
      ? costState.tokenCount / costState.requestCount 
      : 0,
  };
}

/**
 * Set budget limits
 */
function setBudgets(hourly, daily) {
  if (hourly) costState.hourlyBudget = hourly;
  if (daily) costState.dailyBudget = daily;
  
  logger.info(`Budget limits updated: hourly=$${hourly}, daily=$${daily}`);
}

/**
 * Get cost rate for provider
 */
function getCostRate(provider) {
  return COST_RATES[provider] || 0.002;
}

/**
 * Estimate cost before operation
 */
function estimateCost(provider, estimatedTokens) {
  let rate = getCostRate(provider);
  return (estimatedTokens / 1000) * rate;
}

/**
 * Find cheapest provider for task
 */
function findCheapestProvider(providers) {
  return providers.reduce((cheapest, current) => {
    const currentRate = getCostRate(current);
    const cheapestRate = getCostRate(cheapest);
    return currentRate < cheapestRate ? current : cheapest;
  });
}

module.exports = {
  recordCost,
  getCostState,
  setBudgets,
  getCostRate,
  estimateCost,
  findCheapestProvider,
  COST_RATES,
};