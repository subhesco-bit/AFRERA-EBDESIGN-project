/**
 * MODULE_ID AI Decision Engine
 * Decision-making logic and strategies
 */

const decisionEngine = {
  /**
   * Decision Rules
   */
  rules: {
    /**
     * Performance-based decisions
     */
    performance: {
      highLatency: {
        condition: (metrics) => metrics.responseTime > 1000,
        decision: 'optimize',
        confidence: 0.9,
        actions: ['enable-caching', 'optimize-queries', 'scale-up']
      },
      lowThroughput: {
        condition: (metrics) => metrics.throughput < 100,
        decision: 'scale',
        confidence: 0.85,
        actions: ['scale-horizontally', 'optimize-code']
      },
      highErrorRate: {
        condition: (metrics) => metrics.errorRate > 0.05,
        decision: 'alert',
        confidence: 0.95,
        actions: ['send-alert', 'enable-circuit-breaker', 'rollback-if-needed']
      }
    },

    /**
     * Resource-based decisions
     */
    resources: {
      highMemoryUsage: {
        condition: (metrics) => metrics.memory.heapUsed / metrics.memory.heapTotal > 0.9,
        decision: 'cleanup',
        confidence: 0.9,
        actions: ['garbage-collect', 'clear-cache', 'restart-if-needed']
      },
      lowDiskSpace: {
        condition: (metrics) => metrics.disk.available < metrics.disk.total * 0.1,
        decision: 'cleanup',
        confidence: 0.95,
        actions: ['clear-logs', 'archive-old-data', 'alert-admin']
      }
    },

    /**
     * Business logic decisions
     */
    business: {
      highLoad: {
        condition: (context) => context.concurrentUsers > 1000,
        decision: 'scale',
        confidence: 0.85,
        actions: ['enable-queue', 'scale-up', 'load-balance']
      },
      lowActivity: {
        condition: (context) => context.concurrentUsers < 10,
        decision: 'conserve',
        confidence: 0.8,
        actions: ['reduce-resources', 'enable-hibernation']
      }
    }
  },

  /**
   * Decision Priorities
   */
  priorities: {
    critical: ['highErrorRate', 'lowDiskSpace'],
    high: ['highLatency', 'highMemoryUsage'],
    medium: ['lowThroughput', 'highLoad'],
    low: ['lowActivity']
  },

  /**
   * Decision History
   */
  history: [],
  maxHistorySize: 1000,

  /**
   * Make a decision based on context
   */
  async makeDecision(context, ruleSet = 'all') {
    try {
      const decisions = [];
      const applicableRules = this.getApplicableRules(ruleSet);

      for (const ruleName of applicableRules) {
        const rule = this.findRule(ruleName);
        if (rule && rule.condition(context)) {
          const decision = {
            rule: ruleName,
            decision: rule.decision,
            confidence: rule.confidence,
            actions: rule.actions,
            timestamp: new Date().toISOString(),
            context: this.sanitizeContext(context)
          };
          decisions.push(decision);
        }
      }

      // Sort by priority and confidence
      decisions.sort((a, b) => {
        const priorityDiff = this.getPriorityScore(b.rule) - this.getPriorityScore(a.rule);
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      });

      // Add to history
      if (decisions.length > 0) {
        this.addToHistory(decisions[0]);
      }

      return {
        success: true,
        decision: decisions.length > 0 ? decisions[0] : null,
        allDecisions: decisions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Find a specific rule
   */
  findRule(ruleName) {
    for (const category in this.rules) {
      if (this.rules[category][ruleName]) {
        return this.rules[category][ruleName];
      }
    }
    return null;
  },

  /**
   * Get applicable rules based on rule set
   */
  getApplicableRules(ruleSet) {
    if (ruleSet === 'all') {
      return Object.keys(this.rules.performance)
        .concat(Object.keys(this.rules.resources))
        .concat(Object.keys(this.rules.business));
    }
    return Object.keys(this.rules[ruleSet] || {});
  },

  /**
   * Get priority score for a rule
   */
  getPriorityScore(ruleName) {
    for (const [priority, rules] of Object.entries(this.priorities)) {
      if (rules.includes(ruleName)) {
        const scores = { critical: 4, high: 3, medium: 2, low: 1 };
        return scores[priority] || 0;
      }
    }
    return 0;
  },

  /**
   * Add decision to history
   */
  addToHistory(decision) {
    this.history.push(decision);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  },

  /**
   * Get decision history
   */
  getHistory(limit = 100) {
    return this.history.slice(-limit);
  },

  /**
   * Sanitize context for storage
   */
  sanitizeContext(context) {
    // Remove sensitive data from context before storage
    const sanitized = { ...context };
    delete sanitized.passwords;
    delete sanitized.apiKeys;
    delete sanitized.tokens;
    return sanitized;
  },

  /**
   * Get decision statistics
   */
  getStatistics() {
    const stats = {
      totalDecisions: this.history.length,
      byDecision: {},
      byRule: {},
      averageConfidence: 0
    };

    if (this.history.length === 0) return stats;

    let totalConfidence = 0;
    for (const decision of this.history) {
      stats.byDecision[decision.decision] = (stats.byDecision[decision.decision] || 0) + 1;
      stats.byRule[decision.rule] = (stats.byRule[decision.rule] || 0) + 1;
      totalConfidence += decision.confidence;
    }

    stats.averageConfidence = totalConfidence / this.history.length;
    return stats;
  }
};

module.exports = decisionEngine;