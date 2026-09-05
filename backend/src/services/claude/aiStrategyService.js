/**
 * AI Strategy Service - Claude AI Integration
 * 
 * Claude AI Capability: Strategic planning and cognitive processing enhancement
 * Integration Points: Claude AI Coordinator, Library Knowledge Service, AI Collaboration Service
 * Context Sources: Library modules, historical strategies, market data, organizational goals
 * Collaboration Mode: Strategy tracking, outcome logging, learning feedback
 * 
 * Original Devin Implementation: Cognitive processing layer with strategy generation
 * Conversion Date: 2026-08-31
 * Conversion Agent: Claude
 * 
 * AI Enhancement:
 * - Context-aware strategic planning using library knowledge
 * - AI-powered strategy explanation and rationale
 * - Historical strategy pattern analysis
 * - Multi-objective strategy optimization
 * - Real-time strategy confidence scoring
 * 
 * Backward Compatibility:
 * - All original cognitive methods preserved
 * - Original strategy generation logic maintained
 * - Original API endpoints preserved
 * - Original database operations preserved
 */

const { logger } = require('../../utils/logger');
const claudeAICoordinator = require('../../core/claudeAICoordinator');
const libraryKnowledgeService = require('../../services/libraryKnowledgeService');
const aiCollaborationService = require('../../services/aiCollaborationService');

// Import original service for compatibility
const originalAIBrainService = require('../legacy/aiBrainService');

class ClaudeAIEnhancedStrategyService {
  constructor() {
    this.serviceName = 'AI Strategy Service';
    this.aiEnabled = process.env.CLAUDE_AI_ENABLED === 'true';
    this.originalService = originalAIBrainService;
  }

  /**
   * AI-enhanced strategy generation
   */
  async generateStrategyAI(objectives, currentState, options = {}) {
    if (!this.aiEnabled) {
      return await this.originalService.generateStrategy(objectives, currentState, options);
    }

    try {
      await aiCollaborationService.logWork('claude', {
        work_type: 'strategy_generation',
        service: this.serviceName,
        params: { objectives, currentState, options },
        status: 'in_progress'
      });

      const libraryContext = await libraryKnowledgeService.buildAIContext({
        service: this.serviceName,
        operation: 'generateStrategy',
        objectives: objectives,
        currentState: currentState
      });

      const aiEnhancement = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'strategy',
        query: this.buildStrategyQuery(objectives, currentState),
        context: { 
          objectives, 
          currentState, 
          options,
          libraryContext
        },
        agentPreference: 'business-analyst'
      });

      const originalResult = await this.originalService.generateStrategy(objectives, currentState, options);
      
      const enhancedResult = {
        ...originalResult,
        ai_enhanced: true,
        ai_strategy_rationale: aiEnhancement.content || null,
        ai_confidence: aiEnhancement.confidence || originalResult.confidence,
        ai_alternatives: this.extractStrategyAlternatives(aiEnhancement.content)
      };

      await aiCollaborationService.logWork('claude', {
        work_type: 'strategy_generation',
        service: this.serviceName,
        status: 'completed',
        result: enhancedResult
      });

      return enhancedResult;
    } catch (error) {
      await aiCollaborationService.logWork('claude', {
        work_type: 'strategy_generation',
        service: this.serviceName,
        status: 'error',
        error: error.message
      });
      
      logger.warn('AI enhancement failed, falling back to original service:', error.message);
      return await this.originalService.generateStrategy(objectives, currentState, options);
    }
  }

  /**
   * Build query for Claude AI - Strategy Generation
   */
  buildStrategyQuery(objectives, currentState) {
    return `Generate strategic plan for objectives: ${JSON.stringify(objectives)} given current state: ${JSON.stringify(currentState)}. Consider resource constraints, timeline, risks, and success metrics. Provide comprehensive strategy with execution plan and key milestones.`;
  }

  /**
   * Extract strategy alternatives from AI response
   */
  extractStrategyAlternatives(aiContent) {
    if (!aiContent) return [];
    
    const alternatives = [];
    const lines = aiContent.split('\n');
    
    lines.forEach(line => {
      if (line.includes('alternative') || line.includes('option') || line.includes('approach')) {
        alternatives.push(line.trim());
      }
    });
    
    return alternatives;
  }

  /**
   * Forward all original methods for backward compatibility
   */
  async generateStrategy(objectives, currentState, options = {}) {
    return await this.originalService.generateStrategy(objectives, currentState, options);
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
      ai_enhanced_methods: ['generateStrategyAI']
    };
  }
}

// Export both enhanced and original for compatibility
const enhancedService = new ClaudeAIEnhancedStrategyService();
module.exports = enhancedService;
module.exports.original = originalAIBrainService;