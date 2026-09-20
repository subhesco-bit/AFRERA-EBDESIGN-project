/**
 * AI Token Optimizer
 * Component ID: EBD-CMP-00000006
 * Purpose: Apply the project's token-saving guidelines to real provider calls
 *
 * Guidelines source: .ai/workflows/TOKEN_OPTIMIZATION_METHODOLOGY.md and
 * .ai/workflows/OPENAI_PLUGIN_INTEGRATION.md. Those documents describe the
 * savings techniques; this module is where they actually run against a live
 * request instead of staying documentation-only:
 *   - context compression: truncate oversized prompts to a fixed budget
 *     instead of sending (and paying for) the full text
 *   - max-token capping: never let a caller request more completion tokens
 *     than the provider is configured for
 *   - pre-call budget guard: estimate cost before spending it, using the
 *     existing aiCostController budgets
 */

'use strict';

const { logger } = require('../../utils/logger');
const aiCostController = require('./aiCostController');

const CHARS_PER_TOKEN_ESTIMATE = 4;
const DEFAULT_PROMPT_TOKEN_BUDGET = parseInt(process.env.AI_PROMPT_TOKEN_BUDGET, 10) || 6000;

/**
 * Approximate token count without pulling in a provider-specific tokenizer.
 * Good enough for budget guardrails; actual billed usage still comes from
 * the provider's response and is what gets recorded via recordCost.
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(String(text).length / CHARS_PER_TOKEN_ESTIMATE);
}

/**
 * Context-compression guideline: when a prompt exceeds its token budget,
 * keep the head and tail (instructions and the actual ask usually live at
 * the edges) and drop the middle instead of either failing the request or
 * silently paying for a much larger prompt than intended.
 */
function truncatePromptToBudget(prompt, tokenBudget = DEFAULT_PROMPT_TOKEN_BUDGET) {
  const originalTokens = estimateTokens(prompt);
  if (originalTokens <= tokenBudget) {
    return { text: prompt, truncated: false, originalTokens, finalTokens: originalTokens };
  }

  const budgetChars = tokenBudget * CHARS_PER_TOKEN_ESTIMATE;
  const headChars = Math.floor(budgetChars * 0.7);
  const tailChars = Math.max(0, budgetChars - headChars);

  const head = prompt.slice(0, headChars);
  const tail = tailChars > 0 ? prompt.slice(prompt.length - tailChars) : '';
  const text = `${head}\n\n[...truncated to stay within the ${tokenBudget}-token prompt budget...]\n\n${tail}`;

  return { text, truncated: true, originalTokens, finalTokens: estimateTokens(text) };
}

/**
 * Cap a requested completion size at the provider's configured ceiling.
 */
function capMaxTokens(requestedTokens, providerCeiling) {
  const ceiling = Number(providerCeiling) || 4096;
  const requested = Number(requestedTokens) || ceiling;
  return Math.max(1, Math.min(requested, ceiling));
}

/**
 * Pre-call budget guard: estimate the cost of prompt + completion tokens
 * and compare against the AI cost controller's remaining hourly/daily
 * budget before the request goes out (aiCostController.recordCost only
 * checks budgets AFTER spend has already happened).
 */
function preflightBudgetCheck(provider, estimatedTotalTokens) {
  const state = aiCostController.getCostState();
  const estimatedCost = aiCostController.estimateCost(provider, estimatedTotalTokens);
  const hourlyRemaining = state.hourlyBudget - state.hourlySpend;
  const dailyRemaining = state.dailyBudget - state.dailySpend;

  const withinBudget = estimatedCost <= hourlyRemaining && estimatedCost <= dailyRemaining;

  return { estimatedCost, hourlyRemaining, dailyRemaining, withinBudget };
}

/**
 * Runs the full token-saving pipeline for an outbound provider call.
 * Set AI_TOKEN_BUDGET_ENFORCE=true to hard-block calls that would exceed
 * budget; by default it only warns, matching aiCostController's own
 * post-call behavior.
 */
function optimizeRequest(provider, prompt, options = {}, providerConfig = {}) {
  const promptBudget = options.promptTokenBudget || DEFAULT_PROMPT_TOKEN_BUDGET;
  const { text: optimizedPrompt, truncated, originalTokens, finalTokens } = truncatePromptToBudget(
    prompt,
    promptBudget,
  );

  if (truncated) {
    logger.warn(
      `Token-saving guard truncated ${provider} prompt from ~${originalTokens} to ~${finalTokens} tokens (budget: ${promptBudget})`,
    );
  }

  const providerCeiling = providerConfig.maxTokens || options.maxTokens || 4096;
  const maxTokens = capMaxTokens(options.maxTokens, providerCeiling);

  const estimatedTotalTokens = finalTokens + maxTokens;
  const budgetCheck = preflightBudgetCheck(provider, estimatedTotalTokens);

  if (!budgetCheck.withinBudget) {
    const message =
      `Token-saving budget guard: estimated $${budgetCheck.estimatedCost.toFixed(4)} for this ${provider} call ` +
      `exceeds remaining budget (hourly $${budgetCheck.hourlyRemaining.toFixed(4)}, daily $${budgetCheck.dailyRemaining.toFixed(4)})`;

    if (process.env.AI_TOKEN_BUDGET_ENFORCE === 'true') {
      throw new Error(message);
    }
    logger.warn(message);
  }

  return {
    prompt: optimizedPrompt,
    maxTokens,
    truncated,
    originalTokens,
    finalTokens,
    estimatedTotalTokens,
    budgetCheck,
  };
}

module.exports = {
  CHARS_PER_TOKEN_ESTIMATE,
  DEFAULT_PROMPT_TOKEN_BUDGET,
  estimateTokens,
  truncatePromptToBudget,
  capMaxTokens,
  preflightBudgetCheck,
  optimizeRequest,
};
