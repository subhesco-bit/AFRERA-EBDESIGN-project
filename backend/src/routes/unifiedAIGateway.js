/**
 * Unified AI Gateway - Single Entry Point for All AI Services
 * Integrates existing AI files with reconstructed AI Backbone architecture
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();

// Import Claude AI Coordinator (NEW unified endpoint)
const unifiedAIRoutes = require('./claude/unifiedAIRoutes');

// Import existing AI services for backward compatibility
const aiService = require('../services/legacy/aiService');
const aiCopilotService = require('../services/legacy/aiCopilotService');
const aiBrainService = require('../services/legacy/aiBrainService');
const aiSelfHealingService = require('../services/legacy/aiSelfHealingService');
const aiOperationIntelligenceService = require('../services/legacy/aiOperationIntelligenceService');
const aiAgenticCompanionService = require('../services/legacy/aiAgenticCompanionService');
const advancedAIService = require('../services/legacy/advancedAIService');
const conversationalAIService = require('../services/legacy/conversationalAIService');
const omnichannelAIService = require('../services/legacy/omnichannelAIService');
const aiOrchestrationService = require('../services/legacy/aiOrchestrationService');
const ecommerceAIService = require('../services/legacy/ecommerceAIService');
const voiceAIService = require('../services/legacy/voiceAIService');
const farmerTrainingService = require('../services/legacy/farmerTrainingService');
const preventiveMaintenanceService = require('../services/legacy/preventiveMaintenanceService');

// Import existing AI routes
const aiBackboneRoutes = require('./aiBackboneRoutes');
const aiAgentRoutes = require('./aiAgentRoutes');
const aiBrainRoutes = require('./aiBrainRoutes');
const aiCollaborationRoutes = require('./aiCollaborationRoutes');
const aiOperationIntelligenceRoutes = require('./aiOperationIntelligenceRoutes');
const aiSelfHealingRoutes = require('./aiSelfHealingRoutes');
const aiGatewayRoutes = require('./aiGatewayRoutes');
const completeAIIntegrationRoutes = require('./completeAIIntegrationRoutes');
const enterpriseAIRoutes = require('./enterpriseAIRoutes');
const ecommerceAIRoutes = require('./ecommerceAIRoutes');
const productMediaAIRoutes = require('./productMediaAIRoutes');
const nutritionIntelligenceRoutes = require('./nutritionIntelligenceRoutes');
const ecommerceRoutes = require('./ecommerceRoutes');
const paymentGatewayRoutes = require('./paymentGatewayRoutes');
const walletRoutes = require('./walletRoutes');
const transactionRoutes = require('./transactionRoutes');

// Middleware
const { authMiddleware: authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// HEALTH CHECK - Unified system health
// ============================================================================

router.get
    // Log request
    logger.debug('router.get request');('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      coordinator: 'operational',
      legacy: 'operational',
      copilot: 'operational',
      backbone: 'operational',
      brain: 'operational',
      healing: 'operational',
      intelligence: 'operational',
      agent: 'operational',
      gateway: 'operational'
    },
    architecture: {
      layers: {
        enterprise_backbone: 'M400 AI Backbone',
        coordinator: 'Claude AI Coordinator',
        copilot_framework: '16gm AI Copilot',
        provider_integration: 'Multi-Provider AI'
      }
    }
  });
});

// ============================================================================
// CLAUDE AI COORDINATOR - NEW unified endpoint
// ============================================================================

router.use('/coordinate', unifiedAIRoutes);
router.use('/', unifiedAIRoutes);

// ============================================================================
// AI COLLABORATION - Devin-Claude tracking
// ============================================================================

router.use('/collaboration', aiCollaborationRoutes);

// ============================================================================
// AI COPilot FRAMEWORK - 16gm system (7 specialized copilots)
// ============================================================================

router.use('/copilot', aiCopilotService.router);

// ============================================================================
// AI BACKBONE - Multi-provider integration
// ============================================================================

router.use('/backbone', aiBackboneRoutes);

// ============================================================================
// AI BRAIN - Cognitive processing layer
// ============================================================================

router.use('/brain', aiBrainRoutes);

// ============================================================================
// AI SELF-HEALING - Error recovery layer
// ============================================================================

router.use('/self-healing', aiSelfHealingRoutes);

// ============================================================================
// AI OPERATION INTELLIGENCE - Real-time optimization
// ============================================================================

router.use('/operation-intelligence', aiOperationIntelligenceRoutes);

// ============================================================================
// AI AGENT - Agentic AI capabilities
// ============================================================================

router.use('/agent', aiAgentRoutes);

// ============================================================================
// AI GATEWAY - Multi-provider routing (NEW implementation)
// ============================================================================

router.use('/gateway', aiGatewayRoutes);

// ============================================================================
// LEGACY AI SERVICE - Original decision-making engine (backward compatibility)
// ============================================================================

router.use('/legacy', aiService.router);

// ============================================================================
// SPECIALIZED AI SERVICES - Domain-specific AI capabilities
// ============================================================================

// Conversational AI
router.use('/conversational', conversationalAIService.router);

// Omnichannel AI
router.use('/omnichannel', omnichannelAIService.router);

// E-commerce AI
router.use('/ecommerce', ecommerceAIRoutes);

// Voice AI
router.use('/voice', voiceAIService.router);

// Farmer Training AI
router.use('/training', require('./farmerTrainingRoutes'));

// Preventive Maintenance AI
router.use('/maintenance', require('./preventiveMaintenanceRoutes'));

// Advanced AI
router.use('/advanced', require('./advancedFeatures'));

// Complete AI Integration
router.use('/complete', completeAIIntegrationRoutes);

// Enterprise AI
router.use('/enterprise', enterpriseAIRoutes);

// Product Media AI (Image generation, cartoon creator, video scripts)
router.use('/product-media-ai', productMediaAIRoutes);

// Nutrition Intelligence (Nutrient calculator, wellness practices)
router.use('/nutrition-intelligence', nutritionIntelligenceRoutes);

// E-commerce Routes (Marketplace, listings, analytics)
router.use('/ecommerce-marketplace', ecommerceRoutes);

// Payment Gateway
router.use('/payment-gateway', paymentGatewayRoutes);

// Wallet
router.use('/wallet', walletRoutes);

// Transaction
router.use('/transactions', transactionRoutes);

// ============================================================================
// SMART ROUTING - Automatic routing to appropriate service
// ============================================================================

router.post
    // Log request
    logger.debug('router.post request');('/route', async (req, res) => {
  try {
    const { requestType, query, context, options } = req.body;
    
    // Intelligent routing logic based on request type
    let targetService;
    let targetEndpoint;
    let routingReason;
    
    switch (requestType) {
      case 'copilot':
      case 'finance':
      case 'logistics':
      case 'warehouse':
      case 'insurance':
      case 'nutrition':
      case 'marketplace':
        targetService = 'copilot';
        targetEndpoint = '/api/v1/ai/copilot';
        routingReason = 'Domain-specific copilot request';
        break;
        
      case 'decision':
      case 'predict':
      case 'recommend':
        targetService = 'legacy';
        targetEndpoint = '/api/v1/ai/legacy';
        routingReason = 'Decision-making request using legacy AI engine';
        break;
        
      case 'strategy':
      case 'plan':
      case 'optimize':
        targetService = 'brain';
        targetEndpoint = '/api/v1/ai/brain';
        routingReason = 'Strategic planning request using AI Brain';
        break;
        
      case 'prediction':
      case 'forecast':
        targetService = 'operation-intelligence';
        targetEndpoint = '/api/v1/ai/operation-intelligence';
        routingReason = 'Predictive analytics request';
        break;
        
      case 'conversation':
      case 'chat':
      case 'dialogue':
        targetService = 'coordinate';
        targetEndpoint = '/api/v1/ai/coordinate';
        routingReason = 'Conversational AI request via Claude Coordinator';
        break;
        
      case 'advisory':
      case 'guidance':
        targetService = 'advisory';
        targetEndpoint = '/api/v1/ai/advisory';
        routingReason = 'AI advisory system request';
        break;
        
      case 'ecommerce':
      case 'product':
      case 'market':
        targetService = 'ecommerce';
        targetEndpoint = '/api/v1/ai/ecommerce';
        routingReason = 'E-commerce AI request';
        break;
        
      case 'voice':
      case 'audio':
        targetService = 'voice';
        targetEndpoint = '/api/v1/ai/voice';
        routingReason = 'Voice AI request';
        break;
        
      case 'healing':
      case 'recovery':
        targetService = 'self-healing';
        targetEndpoint = '/api/v1/ai/self-healing';
        routingReason = 'Error recovery request';
        break;
        
      default:
        // Default to Claude Coordinator for general requests
        targetService = 'coordinate';
        targetEndpoint = '/api/v1/ai/coordinate';
        routingReason = 'General AI request routed to Claude Coordinator';
    }
    
    res.json({
      success: true,
      routing: {
        requestType: requestType,
        routedTo: targetService,
        endpoint: targetEndpoint,
        reason: routingReason
      },
      recommendation: `Use the ${targetEndpoint} endpoint for this request type`,
      alternatives: getAlternativeEndpoints(requestType)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      routing: {
        fallback: '/api/v1/ai/coordinate',
        reason: 'Error in routing, falling back to Claude Coordinator'
      }
    });
  }
});

/**
 * Get alternative endpoints for a request type
 */
function getAlternativeEndpoints(requestType) {
  const alternatives = {
    'copilot': ['/api/v1/ai/coordinate', '/api/v1/ai/legacy'],
    'decision': ['/api/v1/ai/coordinate', '/api/v1/ai/brain'],
    'strategy': ['/api/v1/ai/coordinate', '/api/v1/ai/operation-intelligence'],
    'prediction': ['/api/v1/ai/coordinate', '/api/v1/ai/legacy'],
    'conversation': ['/api/v1/ai/copilot', '/api/v1/ai/conversational'],
    'advisory': ['/api/v1/ai/coordinate', '/api/v1/ai/copilot'],
    'ecommerce': ['/api/v1/ai/copilot', '/api/v1/ai/coordinate'],
    'voice': ['/api/v1/ai/conversational', '/api/v1/ai/coordinate']
  };
  
  return alternatives[requestType] || ['/api/v1/ai/coordinate'];
}

// ============================================================================
// SERVICE DISCOVERY - List all available AI services
// ============================================================================

router.get
    // Log request
    logger.debug('router.get request');('/services', (req, res) => {
  res.json({
    services: {
      coordinator: {
        name: 'Claude AI Coordinator',
        endpoint: '/api/v1/ai/coordinate',
        description: 'Central AI orchestration with agent selection',
        status: 'operational'
      },
      copilot: {
        name: 'AI Copilot Framework',
        endpoint: '/api/v1/ai/copilot',
        description: '16gm system with 7 specialized copilots',
        copilots: ['finance', 'logistics', 'warehouse', 'insurance', 'nutrition', 'marketplace', 'generic'],
        status: 'operational'
      },
      backbone: {
        name: 'AI Backbone Service',
        endpoint: '/api/v1/ai/backbone',
        description: 'Multi-provider AI integration',
        providers: ['claude', 'openai', 'gemini', 'azure', 'huggingface', 'ollama'],
        status: 'operational'
      },
      brain: {
        name: 'AI Brain Service',
        endpoint: '/api/v1/ai/brain',
        description: 'Cognitive processing and strategy generation',
        status: 'operational'
      },
      legacy: {
        name: 'Legacy AI Service',
        endpoint: '/api/v1/ai/legacy',
        description: 'Original AI decision-making engine',
        capabilities: ['demand_forecasting', 'price_optimization', 'credit_scoring', 'fraud_detection'],
        status: 'operational'
      },
      intelligence: {
        name: 'AI Operation Intelligence',
        endpoint: '/api/v1/ai/operation-intelligence',
        description: 'Real-time optimization and monitoring',
        status: 'operational'
      },
      healing: {
        name: 'AI Self-Healing',
        endpoint: '/api/v1/ai/self-healing',
        description: 'Autonomous error recovery',
        status: 'operational'
      },
      agent: {
        name: 'AI Agent Service',
        endpoint: '/api/v1/ai/agent',
        description: 'Agentic AI capabilities',
        status: 'operational'
      },
      gateway: {
        name: 'AI Gateway',
        endpoint: '/api/v1/ai/gateway',
        description: 'Multi-provider LLM routing',
        status: 'operational'
      }
    },
    specialized_services: {
      advisory: '/api/v1/ai/advisory',
      conversational: '/api/v1/ai/conversational',
      omnichannel: '/api/v1/ai/omnichannel',
      ecommerce: '/api/v1/ai/ecommerce',
      voice: '/api/v1/ai/voice',
      training: '/api/v1/ai/training',
      maintenance: '/api/v1/ai/maintenance',
      advanced: '/api/v1/ai/advanced',
      complete: '/api/v1/ai/complete',
      enterprise: '/api/v1/ai/enterprise'
    }
  });
});

// ============================================================================
// ARCHITECTURE INFO - System architecture information
// ============================================================================

router.get
    // Log request
    logger.debug('router.get request');('/architecture', (req, res) => {
  res.json({
    name: 'Unified AI Gateway',
    version: '2.0.0',
    architecture: 'Three-Layer AI System',
    layers: [
      {
        name: 'Enterprise AI Backbone (M400)',
        components: ['Decision Engine', 'Strategy Engine', 'Learning Engine', 'Prediction Engine', 'Coordination Engine'],
        purpose: 'Enterprise-level AI orchestration and decision-making'
      },
      {
        name: 'Claude AI Coordinator',
        components: ['Agent Selection', 'Context Management', 'Library Integration', 'Collaboration Tracking'],
        purpose: 'Central AI request coordination and agent management'
      },
      {
        name: '16gm AI Copilot Framework',
        components: ['Finance Copilot', 'Logistics Copilot', 'Warehouse Copilot', 'Insurance Copilot', 'Nutrition Copilot', 'Marketplace Copilot', 'Generic Copilot'],
        purpose: 'Domain-specific AI assistance and expertise'
      },
      {
        name: 'Multi-Provider Integration',
        components: ['Claude', 'OpenAI', 'Gemini', 'Azure', 'Hugging Face', 'Ollama'],
        purpose: 'Flexible AI provider access with failover'
      }
    ],
    integration: {
      existing_services: 'All existing AI services integrated and accessible',
      backward_compatibility: 'Maintained through legacy endpoints',
      new_capabilities: 'Unified gateway, smart routing, provider failover'
    }
  });
});

module.exports = router;