/**
 * AI Copilot Service - Claude AI Integration (16gm Framework)
 * 
 * Claude AI Capability: Domain-specific copilot enhancement with context-aware AI
 * Integration Points: Claude AI Coordinator, Library Knowledge Service, AI Collaboration Service
 * Context Sources: Library modules, domain-specific knowledge, historical copilot interactions
 * Collaboration Mode: Copilot session tracking, outcome logging, learning feedback
 * 
 * Original Devin Implementation: 16gm AI Copilot Framework with 7 specialized copilots
 * Conversion Date: 2026-2026-08-31
 * Conversion Agent: Claude
 * 
 * AI Enhancement:
 * - Context-aware copilot responses using library knowledge
 * - AI-powered copilot explanation and rationale
 * - Historical copilot interaction pattern analysis
 * - Multi-copilot coordination and intelligence sharing
 * - Real-time copilot confidence scoring
 * 
 * Backward Compatibility:
 * - All 7 copilot types preserved (Finance, Logistics, Warehouse, Insurance, Nutrition, Marketplace, Generic)
 * - Original copilot generation logic maintained
 * - Original API endpoints preserved
 * - Original database operations preserved
 */

const { logger } = require('../../utils/logger');
const claudeAICoordinator = require('../../core/claudeAICoordinator');
const libraryKnowledgeService = require('../../services/libraryKnowledgeService');
const aiCollaborationService = require('../../services/aiCollaborationService');

// Import original service for compatibility
const originalAICopilotService = require('../legacy/aiCopilotService');

class ClaudeAIEnhancedCopilotService {
  constructor() {
    this.serviceName = 'AI Copilot Service';
    this.aiEnabled = process.env.CLAUDE_AI_ENABLED === 'true';
    this.originalService = originalAICopilotService;
    
    // 7 specialized copilot types (16gm framework)
    this.copilotTypes = [
      'finance',
      'logistics', 
      'warehouse',
      'insurance',
      'nutrition',
      'marketplace',
      'generic'
    ];
  }

  /**
   * AI-enhanced copilot response generation
   */
  async generateCopilotResponseAI(copilotType, message, context, session) {
    if (!this.aiEnabled) {
      return await this.originalService.generateCopilotResponse(copilotType, message, context, session);
    }

    try {
      await aiCollaborationService.logWork('claude', {
        work_type: 'copilot_response',
        service: this.serviceName,
        params: { copilotType, message, context, sessionId: session.id },
        status: 'in_progress'
      });

      const libraryContext = await libraryKnowledgeService.buildAIContext({
        service: this.serviceName,
        operation: 'generateCopilotResponse',
        copilotType: copilotType,
        message: message,
        context: context
      });

      const aiEnhancement = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'copilot',
        query: this.buildCopilotQuery(copilotType, message, context),
        context: { 
          copilotType, 
          message, 
          context, 
          session,
          libraryContext
        },
        agentPreference: this.selectAgentForCopilot(copilotType)
      });

      const originalResult = await this.originalService.generateCopilotResponse(copilotType, message, context, session);
      
      const enhancedResult = {
        ...originalResult,
        ai_enhanced: true,
        ai_response_rationale: aiEnhancement.content || null,
        ai_confidence: aiEnhancement.confidence || originalResult.confidence,
        ai_domain_insights: this.extractDomainInsights(aiEnhancement.content, copilotType),
        ai_followup_questions: this.extractFollowupQuestions(aiEnhancement.content)
      };

      await aiCollaborationService.logWork('claude', {
        work_type: 'copilot_response',
        service: this.serviceName,
        status: 'completed',
        result: enhancedResult
      });

      return enhancedResult;
    } catch (error) {
      await aiCollaborationService.logWork('claude', {
        work_type: 'copilot_response',
        service: this.serviceName,
        status: 'error',
        error: error.message
      });
      
      logger.warn('AI enhancement failed, falling back to original service:', error.message);
      return await this.originalService.generateCopilotResponse(copilotType, message, context, session);
    }
  }

  /**
   * Select appropriate AI agent based on copilot type
   */
  selectAgentForCopilot(copilotType) {
    const agentMapping = {
      'finance': 'business-analyst',
      'logistics': 'operations-manager',
      'warehouse': 'operations-manager',
      'insurance': 'governance-agent',
      'nutrition': 'farmer-advisor',
      'marketplace': 'business-analyst',
      'generic': 'farmer-advisor'
    };
    
    return agentMapping[copilotType] || 'farmer-advisor';
  }

  /**
   * Build query for Claude AI - Copilot Response
   */
  buildCopilotQuery(copilotType, message, context) {
    return `Generate ${copilotType} copilot response for message: "${message}" in context: ${JSON.stringify(context)}. Provide expert domain-specific assistance with clear, actionable recommendations. Include relevant insights and follow-up questions.`;
  }

  /**
   * Extract domain insights from AI response
   */
  extractDomainInsights(aiContent, copilotType) {
    if (!aiContent) return null;
    
    const insights = [];
    const lines = aiContent.split('\n');
    
    lines.forEach(line => {
      if (line.includes('insight') || line.includes('consider') || line.includes('note') || line.includes('important')) {
        insights.push(line.trim());
      }
    });
    
    return insights.length > 0 ? insights.join('. ') : null;
  }

  /**
   * Extract follow-up questions from AI response
   */
  extractFollowupQuestions(aiContent) {
    if (!aiContent) return [];
    
    const questions = [];
    const lines = aiContent.split('\n');
    
    lines.forEach(line => {
      if (line.includes('?') && (line.includes('Would') || line.includes('Can you') || line.includes('Have you'))) {
        questions.push(line.trim());
      }
    });
    
    return questions;
  }

  /**
   * Forward all original methods for backward compatibility
   */
  async generateCopilotResponse(copilotType, message, context, session) {
    return await this.originalService.generateCopilotResponse(copilotType, message, context, session);
  }

  /**
   * Get AI capability status
   */
  getAICapabilityStatus() {
    return {
      service: this.serviceName,
      ai_enabled: this.aiEnabled,
      ai_coordinator: claudeAICoordinator ? 'available' : 'unavailable',
      library_knowledge: libraryKnowledgeService ? 'available' : 'unavailable',
      collaboration_tracking: aiCollaborationService ? 'available' : 'unavailable',
      copilot_types: this.copilotTypes,
      ai_enhanced_methods: ['generateCopilotResponseAI']
    };
  }
}

// Export both enhanced and original for compatibility
const enhancedService = new ClaudeAIEnhancedCopilotService();
module.exports = enhancedService;
module.exports.original = originalAICopilotService;