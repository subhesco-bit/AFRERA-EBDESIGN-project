/**
 * COMPLETE AI MODULE BUILDER
 * Builds all specialized AI modules: Doctor, Chef, Nutritionist, Image Maker, Script Writer, Disease Analyzer, etc.
 * This is a unified builder that creates all module services
 */

const fs = require('fs');
const path = require('path');

const AI_MODULES = {
  'M403_AGRICULTURAL_AI': {
    name: 'Agricultural AI',
    description: 'Crop, livestock, dairy, poultry, fishery intelligence',
    capabilities: [
      'crop_recommendation',
      'livestock_management',
      'dairy_optimization',
      'poultry_health',
      'fishery_planning',
      'soil_analysis',
      'weather_prediction',
      'pest_management',
      'fertilizer_recommendation',
      'irrigation_optimization'
    ],
  },
  'M404_DECISION_SUPPORT': {
    name: 'Decision Support AI',
    description: 'Strategic decision making, risk analysis, alternatives evaluation',
    capabilities: [
      'decision_analysis',
      'risk_assessment',
      'alternative_evaluation',
      'scenario_planning',
      'impact_analysis'
    ],
  },
  'M405_PREDICTIVE_ANALYTICS': {
    name: 'Predictive Analytics AI',
    description: 'Forecasting, trend analysis, pattern recognition',
    capabilities: [
      'yield_prediction',
      'disease_prediction',
      'market_prediction',
      'trend_analysis',
      'anomaly_detection',
      'time_series_forecast'
    ],
  },
  'M407_CONVERSATIONAL_AI': {
    name: 'Conversational AI',
    description: 'Multi-language dialogue, chatbot, Q&A',
    capabilities: [
      'farmer_support',
      'language_translation',
      'question_answering',
      'dialogue_management',
      'sentiment_analysis'
    ],
  },
  'M408_KNOWLEDGE_MANAGEMENT': {
    name: 'Knowledge Management AI',
    description: 'RAG, document retrieval, knowledge base',
    capabilities: [
      'document_retrieval',
      'knowledge_synthesis',
      'context_awareness',
      'semantic_search'
    ],
  },
  'M409_ADVANCED_AI': {
    name: 'Advanced AI',
    description: 'Complex reasoning, multi-step analysis',
    capabilities: [
      'reasoning',
      'analysis',
      'synthesis',
      'expert_systems'
    ],
  },
  'M777_VETERINARY_AI': {
    name: 'Veterinary AI Doctor',
    description: 'Animal health diagnosis, treatment, prevention',
    capabilities: [
      'animal_diagnosis',
      'disease_detection',
      'treatment_recommendation',
      'prevention_strategies',
      'health_monitoring',
      'vaccination_schedule'
    ],
  },
  'M778_CULINARY_AI': {
    name: 'AI Master Chef',
    description: 'Recipe generation, nutrition analysis, meal planning',
    capabilities: [
      'recipe_generation',
      'meal_planning',
      'nutrition_analysis',
      'ingredient_optimization',
      'cooking_instructions',
      'dietary_accommodation'
    ],
  },
  'M779_NUTRITION_AI': {
    name: 'AI Nutritionist',
    description: 'Nutrition plans, dietary recommendations, health analysis',
    capabilities: [
      'nutrition_planning',
      'dietary_recommendation',
      'health_assessment',
      'supplement_recommendation',
      'macro_analysis',
      'calorie_calculation'
    ],
  },
  'M780_IMAGE_GENERATION_AI': {
    name: 'AI Image Maker',
    description: 'Image generation, editing, design',
    capabilities: [
      'image_generation',
      'image_editing',
      'design_creation',
      'product_visualization',
      'graphic_design'
    ],
  },
  'M781_SCRIPT_WRITER_AI': {
    name: 'AI Script Writer',
    description: 'Story, script, content generation',
    capabilities: [
      'script_generation',
      'story_writing',
      'content_generation',
      'dialogue_writing',
      'narrative_creation',
      'poetry_generation'
    ],
  },
  'M782_DISEASE_ANALYZER_AI': {
    name: 'AI Plant Disease Analyzer',
    description: 'Plant disease identification, solution recommendation, farmer support',
    capabilities: [
      'disease_identification',
      'disease_severity',
      'treatment_recommendation',
      'prevention_strategies',
      'image_analysis',
      'farmer_guidance'
    ],
  },
  'M783_CARTOON_MAKER_AI': {
    name: 'AI Cartoon Maker',
    description: 'Cartoon character creation, story animation, visual storytelling',
    capabilities: [
      'character_design',
      'story_animation',
      'visual_effects',
      'character_animation',
      'scene_generation'
    ],
  },
  'M784_PRESCRIPTION_WRITER_AI': {
    name: 'AI Prescription Writer',
    description: 'Medical prescription generation, medicine recommendation, dosage calculation',
    capabilities: [
      'prescription_generation',
      'medicine_recommendation',
      'dosage_calculation',
      'drug_interaction_check',
      'allergy_detection',
      'alternative_medicine'
    ],
  },
  'M785_FARMER_SUPPORT_AI': {
    name: 'AI Farmer Support System',
    description: 'Comprehensive farmer support with multi-lingual guidance',
    capabilities: [
      'farming_guidance',
      'crisis_management',
      'resource_planning',
      'market_information',
      'weather_alerts',
      'technique_training',
      'problem_solving'
    ],
  },
};

// Generate unified service for all modules
const generateModuleService = (moduleId, module) => {
  return `/**
 * ${moduleId} Service - ${module.name}
 * ${module.description}
 */

const aiBackbone = require('../M400_AI_BACKBONE/backend/service');
const { logger } = require('../../../backend/src/utils/logger');
const crypto = require('crypto');

class ${moduleId.split('_').map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')}Service {
  constructor() {
    this.moduleId = '${moduleId}';
    this.capabilities = ${JSON.stringify(module.capabilities, null, 2).split('\n').join('\n    ')};
    this.config = {};
    this.metrics = {
      requestsProcessed: 0,
      successCount: 0,
      errorCount: 0,
    };
  }

  async initialize(config) {
    this.config = config || {};
    logger.info(\`Initializing \${this.moduleId}...\`);
    
    return {
      success: true,
      moduleId: this.moduleId,
      capabilities: this.capabilities,
    };
  }

  async process(request) {
    const { capability, data, provider } = request;

    if (!this.capabilities.includes(capability)) {
      throw new Error(\`Unknown capability: \${capability}\`);
    }

    this.metrics.requestsProcessed++;

    try {
      const prompt = this.buildPrompt(capability, data);
      
      const response = await aiBackbone.makeDecision(
        { confidence: 0.85 },
        {
          moduleId: this.moduleId,
          capability,
          data,
          provider: provider || 'claude',
        }
      );

      this.metrics.successCount++;

      return {
        success: true,
        moduleId: this.moduleId,
        capability,
        result: response.reasoning,
        decisionId: response.decisionId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.metrics.errorCount++;
      logger.error(\`\${this.moduleId} error:\`, error);
      throw error;
    }
  }

  buildPrompt(capability, data) {
    const systemPrompt = this.getSystemPrompt(capability);
    return \`\${systemPrompt}\n\nUser Request:\n\${JSON.stringify(data, null, 2)}\`;
  }

  getSystemPrompt(capability) {
    const prompts = {
      ${module.capabilities.map(cap => {
        const prompt = getCapabilityPrompt(moduleId, cap);
        return `'${cap}': \`${prompt.replace(/`/g, '\\`')}\``;
      }).join(',\n      ')}
    };
    return prompts[capability] || 'You are an AI assistant. Help the user with their request.';
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
    };
  }

  async shutdown() {
    return { success: true };
  }
}

let serviceInstance = null;

module.exports = {
  getInstance: () => {
    if (!serviceInstance) {
      serviceInstance = new ${moduleId.split('_').map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')}Service();
    }
    return serviceInstance;
  },

  initialize: async (config) => {
    const service = module.exports.getInstance();
    return await service.initialize(config);
  },

  process: async (request) => {
    const service = module.exports.getInstance();
    return await service.process(request);
  },

  getMetrics: () => {
    const service = module.exports.getInstance();
    return service.getMetrics();
  },

  shutdown: async () => {
    const service = module.exports.getInstance();
    return await service.shutdown();
  },
};
`;
};

// Get capability-specific prompts
function getCapabilityPrompt(moduleId, capability) {
  const prompts = {
    'M403_AGRICULTURAL_AI_crop_recommendation': 'You are an expert agricultural consultant. Analyze the provided soil, climate, and resource conditions and recommend the best crops for cultivation. Include timing, expected yield, water requirements, and risk factors.',
    'M403_AGRICULTURAL_AI_livestock_management': 'You are an expert livestock manager. Provide comprehensive livestock management advice including breeding, feeding, health monitoring, and productivity optimization.',
    'M777_VETERINARY_AI_animal_diagnosis': 'You are an expert veterinary doctor. Analyze the symptoms and health data provided. Provide diagnosis possibilities, recommended tests, and treatment options. Always emphasize the importance of professional veterinary examination.',
    'M777_VETERINARY_AI_disease_detection': 'You are an expert veterinarian specializing in disease detection. Analyze the clinical signs and provide differential diagnoses. Recommend diagnostic procedures and initial management strategies.',
    'M778_CULINARY_AI_recipe_generation': 'You are a master chef. Generate creative, delicious, and practical recipes based on available ingredients. Include detailed cooking instructions, preparation time, nutritional benefits, and plating suggestions.',
    'M779_NUTRITION_AI_nutrition_planning': 'You are a certified nutritionist. Create personalized nutrition plans based on health goals, dietary restrictions, and lifestyle. Include daily meal suggestions, macro calculations, and supplementation advice.',
    'M780_IMAGE_GENERATION_AI_image_generation': 'You are an AI image generation specialist. Based on the text description provided, generate detailed visual prompts for image generation models.',
    'M781_SCRIPT_WRITER_AI_script_generation': 'You are an experienced screenwriter and storyteller. Create compelling scripts with proper formatting, dialogue, and scene descriptions.',
    'M782_DISEASE_ANALYZER_AI_disease_identification': 'You are an expert plant pathologist. Analyze the image and symptoms provided. Identify the plant disease, assess severity, and recommend organic and chemical treatment options suitable for farmers.',
    'M783_CARTOON_MAKER_AI_character_design': 'You are a cartoon character designer. Create detailed character descriptions including personality traits, visual appearance, and story role.',
    'M784_PRESCRIPTION_WRITER_AI_prescription_generation': 'You are a medical professional. Generate treatment recommendations including medicines, dosages, and duration. Always include disclaimers about professional medical consultation.',
    'M785_FARMER_SUPPORT_AI_farming_guidance': 'You are a comprehensive farm management expert. Provide detailed, practical guidance in simple language suitable for farmers of all literacy levels.',
  };

  const key = `${moduleId}_${capability}`;
  return prompts[key] || `You are an AI expert in ${capability}. Provide comprehensive, practical advice based on the user's request.`;
}

// Main export
module.exports = {
  AI_MODULES,
  generateModuleService,
};
