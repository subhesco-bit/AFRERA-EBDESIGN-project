export const aiDecisionService = {
  buildDecision({
    id,
    title,
    description,
    status = 'pending',
    confidence = 78,
    impact = 'medium',
    category = 'general',
    icon = '🎯',
    metadata = {},
    severity,
    context = {}
  }) {
    return {
      id,
      title,
      description,
      status,
      confidence,
      impact,
      category,
      icon,
      severity,
      metadata,
      context
    }
  },

  getFallbackDecisions(moduleName, overrides = {}) {
    const baseCount = overrides.count || 3
    const baseTitle = overrides.baseTitle || 'AI recommendation'

    return Array.from({ length: baseCount }, (_, index) => ({
      id: `${moduleName}-decision-${index + 1}`,
      title: `${baseTitle} ${index + 1}`,
      description: `Review and validate the ${moduleName} recommendation before executing it.`,
      status: 'pending',
      confidence: 76 + (index * 7),
      impact: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      category: moduleName,
      icon: overrides.icon || '🤖',
      metadata: {
        source: 'fallback',
        module: moduleName,
        generatedAt: new Date().toISOString()
      },
      context: overrides.context || {}
    }))
  },

  async executeDecisionAction({ decision, action, callback }) {
    if (!decision || !decision.id) {
      throw new Error('Decision is required')
    }

    if (typeof callback !== 'function') {
      throw new Error('Decision callback is required')
    }

    const result = await callback(decision.id, action)

    return {
      ok: true,
      action,
      decisionId: decision.id,
      data: result
    }
  },

  getDecisionStatusClasses(status, type = 'general') {
    if (type === 'severity') {
      return {
        critical: 'bg-red-100 text-red-800',
        warning: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800'
      }[status] || 'bg-gray-100 text-gray-800'
    }

    return {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      deferred: 'bg-blue-100 text-blue-800'
    }[status] || 'bg-gray-100 text-gray-800'
  }
}
