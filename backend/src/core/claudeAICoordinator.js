/**
 * Unified Claude AI Coordinator Service
 * Central orchestration layer for all AI interactions across the entire project
 */

const Anthropic = require('@anthropic-ai/sdk');
const { getPostgreSQL } = require('../database/connection');
const libraryKnowledgeService = require('../services/libraryKnowledgeService');
const unifiedConfigService = require('../services/unifiedConfigService');
const aiCollaborationService = require('../services/aiCollaborationService');
const aiFeedbackService = require('../services/aiFeedbackService');

class ClaudeAICoordinator {
  constructor() {
    const claudeConfig = unifiedConfigService.getServiceConfig('claudeAI');
    
    this.anthropic = new Anthropic({
      apiKey: claudeConfig.apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    });
    this.contextWindow = claudeConfig.contextWindow;
    this.model = claudeConfig.model;
    this.temperature = claudeConfig.temperature;
    this.maxTokens = claudeConfig.maxTokens;
    
    // Initialize collaboration integration
    this.aiCollaboration = aiCollaborationService;
    
    // Initialize feedback integration
    this.aiFeedback = aiFeedbackService;
  }

  get pool() {
    return getPostgreSQL();
  }

  /**
   * Main AI coordination entry point
   * Routes requests to appropriate agents and manages context
   */
  async coordinateAIRequest(request) {
    try {
      const {
        requestType,
        query,
        context,
        userId,
        sessionId,
        agentPreference
      } = request;

      // Log with collaboration system
      await this.aiCollaboration.logWork('claude', {
        work_type: 'ai_coordination',
        description: `Coordinating ${requestType} request`,
        query: query,
        agent_preference: agentPreference,
        status: 'in_progress'
      });

      // Get user session context
      const sessionContext = await this.getSessionContext(sessionId, userId);
      
      // Enrich context with library knowledge
      const enrichedContext = await this.enrichContextWithLibrary(context, query);
      
      // Select appropriate agent
      const agent = await this.selectAgent(requestType, agentPreference, enrichedContext);
      
      // Process request through agent
      const response = await this.processAgentRequest(agent, query, enrichedContext, sessionContext);
      
      // Update session context
      await this.updateSessionContext(sessionId, userId, query, response);
      
      // Track AI usage
      await this.trackAIUsage(userId, requestType, agent, response);

      // Log completion with collaboration system
      await this.aiCollaboration.logWork('claude', {
        work_type: 'ai_coordination',
        description: `Completed ${requestType} request`,
        query: query,
        agent: agent,
        status: 'completed'
      });
      
      return {
        success: true,
        response: response.content,
        agent: agent,
        contextUsed: enrichedContext.summary,
        tokenUsage: response.usage
      };
    } catch (error) {
      console.error('AI coordination error:', error);
      
      // Log error with collaboration system
      await this.aiCollaboration.logWork('claude', {
        work_type: 'ai_coordination',
        description: `Error in AI coordination`,
        query: request.query,
        error: error.message,
        status: 'error'
      });
      
      throw new Error('Failed to coordinate AI request');
    }
  }

  /**
   * Select appropriate AI agent based on request type and context
   */
  async selectAgent(requestType, agentPreference, context) {
    const agents = {
      'conversational': 'farmer-advisor',
      'analytical': 'business-analyst',
      'automation': 'operations-manager',
      'monitoring': 'governance-agent',
      'general': 'farmer-advisor'
    };

    // Use preferred agent if specified
    if (agentPreference && this.isValidAgent(agentPreference)) {
      return agentPreference;
    }

    // Auto-select based on request type
    return agents[requestType] || agents['general'];
  }

  /**
   * Process request through specific agent
   */
  async processAgentRequest(agent, query, context, sessionContext) {
    const agentConfig = this.getAgentConfiguration(agent);
    
    const systemPrompt = this.buildSystemPrompt(agent, agentConfig, context);
    const userMessage = this.buildUserMessage(query, sessionContext);

    let response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: systemPrompt,
      messages: [userMessage]
    });

    return {
      content: response.content[0].text,
      usage: response.usage,
      agent: agent
    };
  }

  /**
   * Build system prompt for specific agent
   */
  buildSystemPrompt(agent, agentConfig, context) {
    let prompt = `You are ${agentConfig.name}, ${agentConfig.description}.\n\n`;
    prompt += `CAPABILITIES:\n${agentConfig.capabilities.join('\n')}\n\n`;
    prompt += `TOOLS AVAILABLE:\n${agentConfig.tools.join(', ')}\n\n`;
    
    if (context.libraryKnowledge && context.libraryKnowledge.length > 0) {
      prompt += `RELEVANT KNOWLEDGE FROM LIBRARY:\n`;
      context.libraryKnowledge.forEach((item, index) => {
        prompt += `${index + 1}. ${item.name} (${item.type}): ${item.description}\n`;
      });
      prompt += '\n';
    }
    
    if (context.userContext) {
      prompt += `USER CONTEXT:\n${context.userContext}\n\n`;
    }

    prompt += `INSTRUCTIONS:\n`;
    prompt += `- Use available tools to enhance your responses\n`;
    prompt += `- Leverage the provided knowledge base\n`;
    prompt += `- Consider the user's context and history\n`;
    prompt += `- Provide actionable, specific recommendations\n`;
    prompt += `- Always explain your reasoning\n`;
    prompt += `- If uncertain, ask clarifying questions\n`;

    return prompt;
  }

  /**
   * Build user message with context
   */
  buildUserMessage(query, sessionContext) {
    let message = query;
    
    if (sessionContext && sessionContext.length > 0) {
      message += `\n\nCONVERSATION HISTORY:\n`;
      sessionContext.slice(-3).forEach((item, index) => {
        message += `${index + 1}. User: ${item.query}\n`;
        message += `   Assistant: ${item.response.substring(0, 200)}...\n`;
      });
    }

    return message;
  }

  /**
   * Get agent configuration
   */
  getAgentConfiguration(agent) {
    const configurations = {
      'farmer-advisor': {
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
      'business-analyst': {
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
      'operations-manager': {
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
      'governance-agent': {
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
    };

    return configurations[agent] || configurations['farmer-advisor'];
  }

  /**
   * Enrich context with library knowledge
   */
  async enrichContextWithLibrary(context, query) {
    // Query library system for relevant knowledge
    const relevantKnowledge = await libraryKnowledgeService.queryLibraryKnowledge(query);
    
    // Format knowledge for AI consumption
    const formattedKnowledge = relevantKnowledge.map(item => ({
      type: item.type,
      id: item.id,
      name: item.name,
      description: item.description,
      relevance: item.relevance
    }));
    
    return {
      ...context,
      libraryKnowledge: formattedKnowledge,
      libraryKnowledgeRaw: relevantKnowledge,
      summary: `Enriched with ${relevantKnowledge.length} knowledge items from library`
    };
  }

  /**
   * Get session context
   */
  async getSessionContext(sessionId, userId) {
    try {
      const pool = await getPostgreSQL();
      const query = `
        SELECT query, response, created_at
        FROM ai_session_context
        WHERE session_id = $1 AND user_id = $2
        ORDER BY created_at DESC
        LIMIT 10
      `;
      
      const result = await pool.query(query, [sessionId, userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting session context:', error);
      return [];
    }
  }

  /**
   * Update session context
   */
  async updateSessionContext(sessionId, userId, query, response) {
    try {
      const insertQuery = `
        INSERT INTO ai_session_context (session_id, user_id, query, response)
        VALUES ($1, $2, $3, $4)
      `;
      
      await this.pool.query(insertQuery, [sessionId, userId, query, response.content]);
    } catch (error) {
      console.error('Error updating session context:', error);
    }
  }

  /**
   * Track AI usage for monitoring and cost optimization
   */
  async trackAIUsage(userId, requestType, agent, response) {
    try {
      let insertQuery = `
        INSERT INTO ai_usage_tracking (user_id, request_type, agent, input_tokens, output_tokens, total_tokens, cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      const cost = this.calculateCost(response.usage);
      
      await this.pool.query(insertQuery, [
        userId,
        requestType,
        agent,
        response.usage.input_tokens,
        response.usage.output_tokens,
        response.usage.input_tokens + response.usage.output_tokens,
        cost
      ]);
    } catch (error) {
      console.error('Error tracking AI usage:', error);
    }
  }

  /**
   * Calculate cost based on token usage
   */
  calculateCost(usage) {
    // Claude 3.5 Sonnet pricing (approximate)
    const inputCostPerToken = 0.000003; // $3 per million tokens
    const outputCostPerToken = 0.000015; // $15 per million tokens
    
    const inputCost = usage.input_tokens * inputCostPerToken;
    const outputCost = usage.output_tokens * outputCostPerToken;
    
    return inputCost + outputCost;
  }

  /**
   * Validate agent name
   */
  isValidAgent(agent) {
    const validAgents = ['farmer-advisor', 'business-analyst', 'operations-manager', 'governance-agent'];
    return validAgents.includes(agent);
  }

  /**
   * Record user feedback on AI response
   */
  async recordAIResponseFeedback(feedbackData) {
    try {
      let result = await this.aiFeedback.recordFeedback(feedbackData);
      
      // Log feedback with collaboration system
      await this.aiCollaboration.logWork('claude', {
        work_type: 'ai_feedback',
        description: `User feedback recorded: ${feedbackData.feedbackType}`,
        feedback_type: feedbackData.feedbackType,
        feedback_rating: feedbackData.feedbackRating,
        status: 'completed'
      });
      
      return result;
    } catch (error) {
      console.error('Error recording AI feedback:', error);
      throw new Error('Failed to record feedback');
    }
  }

  /**
   * Get AI performance metrics for learning loop
   */
  async getAIPerformanceMetrics() {
    try {
      const metrics = await this.aiFeedback.getOverallMetrics();
      const suggestions = await this.aiFeedback.generateImprovementSuggestions();
      
      return {
        metrics,
        suggestions,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting AI performance metrics:', error);
      return {
        metrics: [],
        suggestions: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

module.exports = new ClaudeAICoordinator();
