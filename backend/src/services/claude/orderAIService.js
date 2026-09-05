/**
 * Order AI Service - Claude AI Integration
 */

const { logger } = require('../../utils/logger');
const claudeAICoordinator = require('../../core/claudeAICoordinator');
const libraryKnowledgeService = require('../libraryKnowledgeService');
const aiCollaborationService = require('../aiCollaborationService');
const originalOrderService = require('../legacy/orderService');

class ClaudeAIEnhancedOrderService {
  constructor() {
    this.serviceName = 'Order AI Service';
    this.aiEnabled = process.env.CLAUDE_AI_ENABLED === 'true';
    this.originalService = originalOrderService;
  }

  async optimizeOrderAI(orderData, options = {}) {
    if (!this.aiEnabled) return await this.originalService.createOrder(orderData);
    
    try {
      await aiCollaborationService.logWork('claude', {
        work_type: 'order_optimization',
        service: this.serviceName,
        params: { orderData, options },
        status: 'in_progress'
      });

      const libraryContext = await libraryKnowledgeService.buildAIContext({
        service: this.serviceName,
        operation: 'optimizeOrder',
        orderData: orderData
      });

      const aiEnhancement = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'optimization',
        query: `Optimize order with data: ${JSON.stringify(orderData)}`,
        context: { orderData, options, libraryContext },
        agentPreference: 'operations-manager'
      });

      const originalResult = await this.originalService.createOrder(orderData);
      
      return {
        ...originalResult,
        ai_enhanced: true,
        ai_optimization: aiEnhancement.content || null,
        ai_confidence: aiEnhancement.confidence || 0.8
      };
    } catch (error) {
      await aiCollaborationService.logWork('claude', {
        work_type: 'order_optimization',
        service: this.serviceName,
        status: 'error',
        error: error.message
      });
      return await this.originalService.createOrder(orderData);
    }
  }

  async createOrder(orderData) {
    return await this.originalService.createOrder(orderData);
  }

  getAICapabilityStatus() {
    return {
      service: this.serviceName,
      ai_enabled: this.aiEnabled,
      ai_coordinator: claudeAICoordinator ? 'available' : 'unavailable',
      library_knowledge: libraryKnowledgeService ? 'available' : 'unavailable',
      collaboration_tracking: aiCollaborationService ? 'available' : 'unavailable',
      ai_enhanced_methods: ['optimizeOrderAI']
    };
  }
}

module.exports = new ClaudeAIEnhancedOrderService();
module.exports.original = originalOrderService;