/**
 * MODULE_ID AI Agents Configuration
 * Define AI agents specific to this module
 */

const moduleAgents = {
  /**
   * Primary Agent - Main AI agent for this module
   */
  primaryAgent: {
    name: 'module-primary-agent',
    type: 'specialized',
    description: 'Primary AI agent for MODULE_ID module',
    capabilities: [
      'decision-making',
      'analysis',
      'recommendation'
    ],
    contextSources: [
      'database:module_data',
      'runtime:module_state',
      'config:module_config'
    ],
    personality: {
      tone: 'professional',
      expertise: 'module-domain',
      communicationStyle: 'clear-and-concise'
    },
    decisionThreshold: 0.7,
    learningEnabled: true
  },

  /**
   * Secondary Agents - Additional specialized agents
   */
  secondaryAgents: [
    {
      name: 'module-analyst-agent',
      type: 'analytical',
      description: 'Analytical agent for MODULE_ID',
      capabilities: [
        'data-analysis',
        'pattern-recognition',
        'trend-analysis'
      ],
      contextSources: [
        'database:module_data',
        'runtime:metrics'
      ]
    },
    {
      name: 'module-optimizer-agent',
      type: 'optimization',
      description: 'Optimization agent for MODULE_ID',
      capabilities: [
        'performance-optimization',
        'resource-allocation',
        'efficiency-improvement'
      ],
      contextSources: [
        'runtime:performance_metrics',
        'config:optimization_params'
      ]
    }
  ],

  /**
   * Agent Collaboration Rules
   */
  collaborationRules: {
    primaryAgentLeadership: true,
    consensusDecisionMaking: false,
    conflictResolution: 'primary-decides',
    communicationProtocol: 'uip-v1'
  },

  /**
   * Agent Learning Configuration
   */
  learning: {
    enabled: true,
    feedbackLoop: true,
    modelRetraining: 'weekly',
    performanceTracking: true
  }
};

module.exports = moduleAgents;