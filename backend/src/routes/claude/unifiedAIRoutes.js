/**
 * Unified Claude AI API Routes
 * Single entry point for all AI interactions across the entire project
 */

const express = require('express');
const router = express.Router();
const claudeAICoordinator = require('../../core/claudeAICoordinator');
const { authMiddleware } = require('../../middleware/auth');

/**
 * POST /api/v1/ai/unified
 * Main unified AI endpoint - routes to appropriate agents
 */
router.post('/unified', authMiddleware, async (req, res) => {
  try {
    const { requestType, query, context, agentPreference } = req.body;
    const userId = req.user.id;
    const sessionId = req.sessionID || req.headers['x-session-id'];

    const aiRequest = {
      requestType: requestType || 'conversational',
      query,
      context: context || {},
      userId,
      sessionId,
      agentPreference
    };

    const response = await claudeAICoordinator.coordinateAIRequest(aiRequest);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Unified AI endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process AI request'
    });
  }
});

/**
 * POST /api/v1/ai/conversational
 * Conversational AI endpoint for farmer interactions
 */
router.post('/conversational', authMiddleware, async (req, res) => {
  try {
    const { query, context } = req.body;
    let userId = req.user.id;
    let sessionId = req.sessionID || req.headers['x-session-id'];

    let aiRequest = {
      requestType: 'conversational',
      query,
      context: context || {},
      userId,
      sessionId,
      agentPreference: 'farmer-advisor'
    };

    let response = await claudeAICoordinator.coordinateAIRequest(aiRequest);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Conversational AI endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process conversational request'
    });
  }
});

/**
 * POST /api/v1/ai/analytical
 * Analytical AI endpoint for business intelligence
 */
router.post('/analytical', authMiddleware, async (req, res) => {
  try {
    const { query, context } = req.body;
    let userId = req.user.id;
    let sessionId = req.sessionID || req.headers['x-session-id'];

    let aiRequest = {
      requestType: 'analytical',
      query,
      context: context || {},
      userId,
      sessionId,
      agentPreference: 'business-analyst'
    };

    let response = await claudeAICoordinator.coordinateAIRequest(aiRequest);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Analytical AI endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process analytical request'
    });
  }
});

/**
 * POST /api/v1/ai/automation
 * Automation AI endpoint for operational optimization
 */
router.post('/automation', authMiddleware, async (req, res) => {
  try {
    const { query, context } = req.body;
    let userId = req.user.id;
    let sessionId = req.sessionID || req.headers['x-session-id'];

    let aiRequest = {
      requestType: 'automation',
      query,
      context: context || {},
      userId,
      sessionId,
      agentPreference: 'operations-manager'
    };

    let response = await claudeAICoordinator.coordinateAIRequest(aiRequest);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Automation AI endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process automation request'
    });
  }
});

/**
 * POST /api/v1/ai/governance
 * Governance AI endpoint for compliance and monitoring
 */
router.post('/governance', authMiddleware, async (req, res) => {
  try {
    const { query, context } = req.body;
    let userId = req.user.id;
    let sessionId = req.sessionID || req.headers['x-session-id'];

    let aiRequest = {
      requestType: 'monitoring',
      query,
      context: context || {},
      userId,
      sessionId,
      agentPreference: 'governance-agent'
    };

    let response = await claudeAICoordinator.coordinateAIRequest(aiRequest);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Governance AI endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process governance request'
    });
  }
});

/**
 * GET /api/v1/ai/agents
 * Get available AI agents and their capabilities
 */
router.get('/agents', authMiddleware, async (req, res) => {
  try {
    const agents = [
      {
        id: 'farmer-advisor',
        name: 'Farmer Advisor',
        description: 'Expert agricultural advisor for farmers',
        capabilities: [
          'Crop recommendations based on soil and weather',
          'Pest and disease management advice',
          'Market price analysis and timing',
          'Government scheme eligibility and application',
          'Best practices for sustainable farming'
        ],
        tools: [
          'crop_recommendation_tool',
          'weather_api_tool',
          'market_data_tool',
          'scheme_search_tool',
          'knowledge_base_tool'
        ]
      },
      {
        id: 'business-analyst',
        name: 'Business Analyst',
        description: 'Business intelligence and analytics expert',
        capabilities: [
          'Financial analysis and reporting',
          'Performance metrics and KPIs',
          'Trend analysis and forecasting',
          'Risk assessment and mitigation',
          'Business process optimization'
        ],
        tools: [
          'financial_analysis_tool',
          'metrics_tool',
          'trend_analysis_tool',
          'forecasting_tool',
          'risk_assessment_tool'
        ]
      },
      {
        id: 'operations-manager',
        name: 'Operations Manager',
        description: 'Operational optimization and automation expert',
        capabilities: [
          'Process optimization and efficiency',
          'Resource allocation and scheduling',
          'Supply chain management',
          'Automated workflow design',
          'Operational cost reduction'
        ],
        tools: [
          'process_optimization_tool',
          'resource_allocation_tool',
          'schedule_tool',
          'efficiency_tool',
          'workflow_automation_tool'
        ]
      },
      {
        id: 'governance-agent',
        name: 'Governance Agent',
        description: 'Governance and compliance expert',
        capabilities: [
          'Policy enforcement and monitoring',
          'Compliance checking and reporting',
          'Audit trail analysis',
          'Risk monitoring and mitigation',
          'Governance dashboard and reporting'
        ],
        tools: [
          'policy_tool',
          'compliance_tool',
          'audit_tool',
          'risk_monitoring_tool',
          'reporting_tool'
        ]
      }
    ];

    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available agents'
    });
  }
});

/**
 * GET /api/v1/ai/usage
 * Get AI usage statistics for monitoring
 */
router.get('/usage', authMiddleware, async (req, res) => {
  try {
    let userId = req.user.id;
    const { startDate, endDate } = req.query;

    // This would query the ai_usage_tracking table
    const usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byAgent: {},
      byRequestType: {}
    };

    res.json({
      success: true,
      data: usageStats
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage statistics'
    });
  }
});

module.exports = router;
