/**
 * AI Decision Service - Claude AI Integration
 * 
 * Claude AI Capability: Decision-making enhancement with context-aware AI
 * Integration Points: Claude AI Coordinator, Library Knowledge Service, AI Collaboration Service
 * Context Sources: Library modules, historical decisions, market data, user behavior
 * Collaboration Mode: Decision tracking, outcome logging, learning feedback
 * 
 * Original Devin Implementation: Decision-making engine with predictive analytics, risk assessment, recommendations
 * Conversion Date: 2026-08-31
 * Conversion Agent: Claude
 * 
 * AI Enhancement:
 * - Context-aware decision making using library knowledge
 * - AI-powered decision explanation and rationale
 * - Historical decision pattern analysis
 * - Multi-factor decision optimization
 * - Real-time decision confidence scoring
 * 
 * Backward Compatibility:
 * - All original methods preserved (predictDemand, optimizePrice, assessCreditRisk, detectFraud, generateRecommendations)
 * - Original AI model configurations maintained
 * - Original API endpoints preserved
 * - Original database queries preserved
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL, getMongoDatabase } = require('../../database/connection');
const claudeAICoordinator = require('../../core/claudeAICoordinator');
const libraryKnowledgeService = require('../../services/libraryKnowledgeService');
const aiCollaborationService = require('../../services/aiCollaborationService');

// Import original service for compatibility
const originalAIService = require('../legacy/aiService');

class ClaudeAIEnhancedDecisionService {
  constructor() {
    this.serviceName = 'AI Decision Service';
    this.aiEnabled = process.env.CLAUDE_AI_ENABLED === 'true';
    this.originalService = originalAIService;
    
    // AI Models configuration (preserved from original)
    this.AI_MODELS = originalAIService.AI_MODELS || {
      demand_forecasting: {
        type: 'regression',
        features: ['season', 'region', 'historical_demand', 'price', 'competitor_pricing'],
        target: 'demand_quantity',
        accuracy: 0.87
      },
      price_optimization: {
        type: 'optimization',
        factors: ['supply', 'demand', 'competitor_prices', 'seasonality', 'quality_grade'],
        constraints: ['min_price', 'max_price', 'market_conditions'],
        accuracy: 0.82
      },
      credit_scoring: {
        type: 'classification',
        features: ['fdi_score', 'repayment_history', 'farm_size', 'crop_diversity', 'certifications'],
        target: 'credit_risk_level',
        accuracy: 0.89
      },
      fraud_detection: {
        type: 'anomaly_detection',
        features: ['transaction_patterns', 'user_behavior', 'location_data', 'timing_patterns'],
        threshold: 0.95,
        accuracy: 0.91
      },
      recommendation: {
        type: 'collaborative_filtering',
        features: ['user_history', 'similar_users', 'item_attributes', 'context'],
        accuracy: 0.78
      }
    };
  }

  /**
   * AI-enhanced demand prediction
   */
  async predictDemandAI(productId, timeHorizon = 30, options = {}) {
    if (!this.aiEnabled) {
      return await this.originalService.predictDemand(productId, timeHorizon);
    }

    try {
      // Log collaboration
      await aiCollaborationService.logWork('claude', {
        work_type: 'demand_prediction',
        service: this.serviceName,
        params: { productId, timeHorizon, options },
        status: 'in_progress'
      });

      // Get library context
      const libraryContext = await libraryKnowledgeService.buildAIContext({
        service: this.serviceName,
        operation: 'predictDemand',
        productId: productId,
        timeHorizon: timeHorizon
      });

      // Call Claude AI Coordinator for enhancement
      const aiEnhancement = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'prediction',
        query: this.buildDemandPredictionQuery(productId, timeHorizon),
        context: { 
          productId, 
          timeHorizon, 
          options,
          libraryContext,
          modelConfig: this.AI_MODELS.demand_forecasting
        },
        agentPreference: 'business-analyst'
      });

      // Execute original logic with AI enhancement
      const originalResult = await this.originalService.predictDemand(productId, timeHorizon);
      
      // Enhance result with AI insights
      const enhancedResult = {
        ...originalResult,
        ai_enhanced: true,
        ai_confidence: aiEnhancement.confidence || originalResult.confidence,
        ai_insights: aiEnhancement.content || null,
        ai_factors: aiEnhancement.contextUsed || null,
        ai_recommendations: this.extractRecommendations(aiEnhancement.content)
      };

      // Track completion
      await aiCollaborationService.logWork('claude', {
        work_type: 'demand_prediction',
        service: this.serviceName,
        status: 'completed',
        result: enhancedResult
      });

      return enhancedResult;
    } catch (error) {
      await aiCollaborationService.logWork('claude', {
        work_type: 'demand_prediction',
        service: this.serviceName,
        status: 'error',
        error: error.message
      });
      
      // Fallback to original service
      logger.warn('AI enhancement failed, falling back to original service:', error.message);
      return await this.originalService.predictDemand(productId, timeHorizon);
    }
  }

  /**
   * AI-enhanced price optimization
   */
  async optimizePriceAI(productId, marketConditions, options = {}) {
    if (!this.aiEnabled) {
      return await this.originalService.optimizePrice(productId, marketConditions, options);
    }

    try {
      await aiCollaborationService.logWork('claude', {
        work_type: 'price_optimization',
        service: this.serviceName,
        params: { productId, marketConditions, options },
        status: 'in_progress'
      });

      const libraryContext = await libraryKnowledgeService.buildAIContext({
        service: this.serviceName,
        operation: 'optimizePrice',
        productId: productId,
        marketConditions: marketConditions
      });

      const aiEnhancement = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'optimization',
        query: this.buildPriceOptimizationQuery(productId, marketConditions),
        context: { 
          productId, 
          marketConditions, 
          options,
          libraryContext,
          modelConfig: this.AI_MODELS.price_optimization
        },
        agentPreference: 'business-analyst'
      });

      const originalResult = await this.originalService.optimizePrice(productId, marketConditions, options);
      
      const enhancedResult = {
        ...originalResult,
        ai_enhanced: true,
        ai_optimization_strategy: aiEnhancement.content || null,
        ai_confidence: aiEnhancement.confidence || originalResult.confidence,
        ai_market_insights: aiEnhancement.contextUsed || null
      };

      await aiCollaborationService.logWork('claude', {
        work_type: 'price_optimization',
        service: this.serviceName,
        status: 'completed',
        result: enhancedResult
      });

      return enhancedResult;
    } catch (error) {
      await aiCollaborationService.logWork('claude', {
        work_type: 'price_optimization',
        service: this.serviceName,
        status: 'error',
        error: error.message
      });
      
      logger.warn('AI enhancement failed, falling back to original service:', error.message);
      return await this.originalService.optimizePrice(productId, marketConditions, options);
    }
  }

  /**
   * AI-enhanced credit risk assessment
   */
  async assessCreditRiskAI(farmerId, loanApplication, options = {}) {
    if (!this.aiEnabled) {
      return await this.originalService.assessCreditRisk(farmerId, loanApplication);
    }

    try {
      await aiCollaborationService.logWork('claude', {
        work_type: 'credit_risk_assessment',
        service: this.serviceName,
        params: { farmerId, loanApplication, options },
        status: 'in_progress'
      });

      const libraryContext = await libraryKnowledgeService.buildAIContext({
        service: this.serviceName,
        operation: 'assessCreditRisk',
        farmerId: farmerId,
        loanApplication: loanApplication
      });

      const aiEnhancement = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'assessment',
        query: this.buildCreditRiskQuery(farmerId, loanApplication),
        context: { 
          farmerId, 
          loanApplication, 
          options,
          libraryContext,
          modelConfig: this.AI_MODELS.credit_scoring
        },
        agentPreference: 'governance-agent'
      });

      const originalResult = await this.originalService.assessCreditRisk(farmerId, loanApplication);
      
      const enhancedResult = {
        ...originalResult,
        ai_enhanced: true,
        ai_risk_factors: aiEnhancement.content || null,
        ai_confidence: aiEnhancement.confidence || originalResult.confidence,
        ai_recommendation: this.extractCreditRecommendation(aiEnhancement.content)
      };

      await aiCollaborationService.logWork('claude', {
        work_type: 'credit_risk_assessment',
        service: this.serviceName,
        status: 'completed',
        result: enhancedResult
      });

      return enhancedResult;
    } catch (error) {
      await aiCollaborationService.logWork('claude', {
        work_type: 'credit_risk_assessment',
        service: this.serviceName,
        status: 'error',
        error: error.message
      });
      
      logger.warn('AI enhancement failed, falling back to original service:', error.message);
      return await this.originalService.assessCreditRisk(farmerId, loanApplication);
    }
  }

  /**
   * AI-enhanced fraud detection
   */
  async detectFraudAI(transactionData, options = {}) {
    if (!this.aiEnabled) {
      return await this.originalService.detectFraud(transactionData, options);
    }

    try {
      await aiCollaborationService.logWork('claude', {
        work_type: 'fraud_detection',
        service: this.serviceName,
        params: { transactionData, options },
        status: 'in_progress'
      });

      const libraryContext = await libraryKnowledgeService.buildAIContext({
        service: this.serviceName,
        operation: 'detectFraud',
        transactionData: transactionData
      });

      const aiEnhancement = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'detection',
        query: this.buildFraudDetectionQuery(transactionData),
        context: { 
          transactionData, 
          options,
          libraryContext,
          modelConfig: this.AI_MODELS.fraud_detection
        },
        agentPreference: 'governance-agent'
      });

      const originalResult = await this.originalService.detectFraud(transactionData, options);
      
      const enhancedResult = {
        ...originalResult,
        ai_enhanced: true,
        ai_fraud_indicators: aiEnhancement.content || null,
        ai_confidence: aiEnhancement.confidence || originalResult.confidence,
        ai_investigation_steps: this.extractInvestigationSteps(aiEnhancement.content)
      };

      await aiCollaborationService.logWork('claude', {
        work_type: 'fraud_detection',
        service: this.serviceName,
        status: 'completed',
        result: enhancedResult
      });

      return enhancedResult;
    } catch (error) {
      await aiCollaborationService.logWork('claude', {
        work_type: 'fraud_detection',
        service: this.serviceName,
        status: 'error',
        error: error.message
      });
      
      logger.warn('AI enhancement failed, falling back to original service:', error.message);
      return await this.originalService.detectFraud(transactionData, options);
    }
  }

  /**
   * AI-enhanced recommendation generation
   */
  async generateRecommendationsAI(userId, context, options = {}) {
    if (!this.aiEnabled) {
      return await this.originalService.generateRecommendations(userId, context, options);
    }

    try {
      await aiCollaborationService.logWork('claude', {
        work_type: 'recommendation_generation',
        service: this.serviceName,
        params: { userId, context, options },
        status: 'in_progress'
      });

      const libraryContext = await libraryKnowledgeService.buildAIContext({
        service: this.serviceName,
        operation: 'generateRecommendations',
        userId: userId,
        context: context
      });

      const aiEnhancement = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'recommendation',
        query: this.buildRecommendationQuery(userId, context),
        context: { 
          userId, 
          context, 
          options,
          libraryContext,
          modelConfig: this.AI_MODELS.recommendation
        },
        agentPreference: 'farmer-advisor'
      });

      const originalResult = await this.originalService.generateRecommendations(userId, context, options);
      
      const enhancedResult = {
        ...originalResult,
        ai_enhanced: true,
        ai_personalized_recommendations: aiEnhancement.content || null,
        ai_reasoning: this.extractRecommendationReasoning(aiEnhancement.content),
        ai_confidence: aiEnhancement.confidence || originalResult.confidence
      };

      await aiCollaborationService.logWork('claude', {
        work_type: 'recommendation_generation',
        service: this.serviceName,
        status: 'completed',
        result: enhancedResult
      });

      return enhancedResult;
    } catch (error) {
      await aiCollaborationService.logWork('claude', {
        work_type: 'recommendation_generation',
        service: this.serviceName,
        status: 'error',
        error: error.message
      });
      
      logger.warn('AI enhancement failed, falling back to original service:', error.message);
      return await this.originalService.generateRecommendations(userId, context, options);
    }
  }

  /**
   * Build query for Claude AI - Demand Prediction
   */
  buildDemandPredictionQuery(productId, timeHorizon) {
    return `Analyze demand prediction for product ${productId} over ${timeHorizon} days. Consider seasonal factors, market trends, historical data, and current market conditions. Provide demand forecast with confidence intervals and key influencing factors.`;
  }

  /**
   * Build query for Claude AI - Price Optimization
   */
  buildPriceOptimizationQuery(productId, marketConditions) {
    return `Optimize pricing strategy for product ${productId} given current market conditions: ${JSON.stringify(marketConditions)}. Consider supply-demand balance, competitor pricing, seasonal factors, and quality grade. Provide optimal price range with reasoning.`;
  }

  /**
   * Build query for Claude AI - Credit Risk Assessment
   */
  buildCreditRiskQuery(farmerId, loanApplication) {
    return `Assess credit risk for farmer ${farmerId} applying for loan with application: ${JSON.stringify(loanApplication)}. Consider FDI score, repayment history, farm size, crop diversity, and certifications. Provide risk assessment with confidence score and key risk factors.`;
  }

  /**
   * Build query for Claude AI - Fraud Detection
   */
  buildFraudDetectionQuery(transactionData) {
    return `Detect potential fraud in transaction: ${JSON.stringify(transactionData)}. Analyze transaction patterns, user behavior, location data, and timing patterns. Identify fraud indicators with confidence score and investigation steps.`;
  }

  /**
   * Build query for Claude AI - Recommendation Generation
   */
  buildRecommendationQuery(userId, context) {
    return `Generate personalized recommendations for user ${userId} in context: ${JSON.stringify(context)}. Consider user history, similar users, item attributes, and current context. Provide recommendations with reasoning and confidence scores.`;
  }

  /**
   * Extract recommendations from AI response
   */
  extractRecommendations(aiContent) {
    if (!aiContent) return [];
    
    // Parse AI content for structured recommendations
    const recommendations = [];
    const lines = aiContent.split('\n');
    
    lines.forEach(line => {
      if (line.includes('recommend') || line.includes('suggest') || line.includes('advise')) {
        recommendations.push(line.trim());
      }
    });
    
    return recommendations;
  }

  /**
   * Extract credit recommendation from AI response
   */
  extractCreditRecommendation(aiContent) {
    if (!aiContent) return null;
    
    // Look for approval/recommendation in AI content
    if (aiContent.toLowerCase().includes('approve') || aiContent.toLowerCase().includes('recommend approval')) {
      return 'approve';
    } else if (aiContent.toLowerCase().includes('deny') || aiContent.toLowerCase().includes('recommend denial')) {
      return 'deny';
    } else if (aiContent.toLowerCase().includes('review') || aiContent.toLowerCase().includes('manual review')) {
      return 'review';
    }
    
    return 'review';
  }

  /**
   * Extract investigation steps from AI response
   */
  extractInvestigationSteps(aiContent) {
    if (!aiContent) return [];
    
    const steps = [];
    const lines = aiContent.split('\n');
    
    lines.forEach(line => {
      if (line.includes('investigate') || line.includes('verify') || line.includes('check')) {
        steps.push(line.trim());
      }
    });
    
    return steps;
  }

  /**
   * Extract recommendation reasoning from AI response
   */
  extractRecommendationReasoning(aiContent) {
    if (!aiContent) return null;
    
    // Extract reasoning from AI content
    const reasoningLines = [];
    const lines = aiContent.split('\n');
    
    lines.forEach(line => {
      if (line.includes('because') || line.includes('due to') || line.includes('based on') || line.includes('reason')) {
        reasoningLines.push(line.trim());
      }
    });
    
    return reasoningLines.length > 0 ? reasoningLines.join('. ') : null;
  }

  /**
   * Forward all original methods for backward compatibility
   */
  async predictDemand(productId, timeHorizon = 30) {
    return await this.originalService.predictDemand(productId, timeHorizon);
  }

  async optimizePrice(productId, marketConditions, options = {}) {
    return await this.originalService.optimizePrice(productId, marketConditions, options);
  }

  async assessCreditRisk(farmerId, loanApplication) {
    return await this.originalService.assessCreditRisk(farmerId, loanApplication);
  }

  async detectFraud(transactionData, options = {}) {
    return await this.originalService.detectFraud(transactionData, options);
  }

  async generateRecommendations(userId, context, options = {}) {
    return await this.originalService.generateRecommendations(userId, context, options);
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
      ai_models: Object.keys(this.AI_MODELS),
      ai_enhanced_methods: [
        'predictDemandAI',
        'optimizePriceAI',
        'assessCreditRiskAI',
        'detectFraudAI',
        'generateRecommendationsAI'
      ]
    };
  }
}

// Export both enhanced and original for compatibility
const enhancedService = new ClaudeAIEnhancedDecisionService();
module.exports = enhancedService;
module.exports.original = originalAIService;
module.exports.AI_MODELS = enhancedService.AI_MODELS;