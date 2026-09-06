/**
 * Advanced Voice AI Service for Farmers
 * Provides sophisticated voice-based interface for farmers with:
 * - Multi-language support (Indian regional languages)
 * - Natural language understanding for agricultural queries
 * - Voice commands for platform navigation
 * - Accessibility features for illiterate farmers
 * - Offline voice recognition capabilities
 * - Context-aware conversations
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
const smsAuthService = require('./smsAuthService');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../database/pool');

// Language Configuration for Northeast India
const LANGUAGE_CONFIG = {
  'en': {
    name: 'English',
    code: 'en',
    speech_code: 'en-US',
    voice_code: 'en-US',
    voice_gender: 'female',
    confidence_threshold: 0.85
  },
  'hi': {
    name: 'Hindi',
    code: 'hi',
    speech_code: 'hi-IN',
    voice_code: 'hi-IN',
    voice_gender: 'female',
    confidence_threshold: 0.80
  },
  'as': {
    name: 'Assamese',
    code: 'as',
    speech_code: 'as-IN',
    voice_code: 'as-IN',
    voice_gender: 'female',
    confidence_threshold: 0.75
  },
  'bn': {
    name: 'Bengali',
    code: 'bn',
    speech_code: 'bn-IN',
    voice_code: 'bn-IN',
    voice_gender: 'female',
    confidence_threshold: 0.75
  },
  'mni': {
    name: 'Manipuri',
    code: 'mni',
    speech_code: 'mni-IN',
    voice_code: 'mni-IN',
    voice_gender: 'female',
    confidence_threshold: 0.70
  },
  'or': {
    name: 'Odia',
    code: 'or',
    speech_code: 'or-IN',
    voice_code: 'or-IN',
    voice_gender: 'female',
    confidence_threshold: 0.75
  },
  'khasi': {
    name: 'Khasi',
    code: 'kha',
    speech_code: 'kha-IN',
    voice_code: 'kha-IN',
    voice_gender: 'female',
    confidence_threshold: 0.65
  },
  'mizo': {
    name: 'Mizo',
    code: 'miz',
    speech_code: 'miz-IN',
    voice_code: 'miz-IN',
    voice_gender: 'female',
    confidence_threshold: 0.65
  },
  'naga': {
    name: 'Naga',
    code: 'nag',
    speech_code: 'nag-IN',
    voice_code: 'nag-IN',
    voice_gender: 'female',
    confidence_threshold: 0.60
  }
};

// Agricultural Intent Classification
const AGRICULTURAL_INTENTS = {
  // Market-related
  'price_inquiry': {
    keywords: ['price', 'rate', 'cost', 'दाम', 'দাম', 'মূল্য', 'খরিদ'],
    entities: ['crop', 'product', 'location', 'date'],
    response_template: 'The current price of {crop} in {location} is ₹{price} per kg.'
  },
  'selling_intent': {
    keywords: ['sell', 'want to sell', 'बेचना', 'বিক্রি', 'বিক্রি করিব'],
    entities: ['crop', 'quantity', 'quality', 'expected_price'],
    response_template: 'I can help you sell your {crop}. How much {quantity} do you have?'
  },
  'buying_intent': {
    keywords: ['buy', 'purchase', 'खरीद', 'কিনা', 'কিনিব'],
    entities: ['product', 'quantity', 'budget'],
    response_template: 'I can help you buy {product}. What quantity do you need?'
  },
  
  // Farming-related
  'crop_advice': {
    keywords: ['grow', 'cultivate', 'plant', 'farming', 'खेती', 'খেতি', 'চাষ'],
    entities: ['crop', 'season', 'soil_type', 'location'],
    response_template: 'For {crop} cultivation in {season}, I recommend {recommendation}.'
  },
  'weather_inquiry': {
    keywords: ['weather', 'rain', 'temperature', 'मौसम', 'বাৰিষা', 'বৃষ্টি'],
    entities: ['location', 'date', 'duration'],
    response_template: 'The weather in {location} for {date} is expected to be {weather}.'
  },
  'soil_health': {
    keywords: ['soil', 'land', 'fertility', 'मिट्टी', 'মাটি', 'মাটিৰ স্বাস্থ্য'],
    entities: ['location', 'soil_type'],
    response_template: 'Your soil health index is {index}. Recommended actions: {actions}.'
  },
  
  // Financial-related
  'loan_inquiry': {
    keywords: ['loan', 'credit', 'finance', 'कर्ज़', 'ঋণ', 'ঋণ'],
    entities: ['amount', 'purpose', 'duration'],
    response_template: 'You are eligible for a loan of ₹{amount} at {interest_rate}% interest.'
  },
  'subsidy_inquiry': {
    keywords: ['subsidy', 'scheme', 'government', 'सब्सिडी', 'অনুদান', 'যোজনা'],
    entities: ['crop', 'scheme_type'],
    response_template: 'You are eligible for {scheme} subsidy of ₹{amount}.'
  },
  'insurance_inquiry': {
    keywords: ['insurance', 'crop insurance', 'बीमा', 'বীমা', 'বীমা কৰা'],
    entities: ['crop', 'coverage_type'],
    response_template: 'Crop insurance for {crop} costs ₹{premium} with coverage up to ₹{coverage}.'
  },
  
  // Platform-related
  'order_status': {
    keywords: ['order', 'delivery', 'status', 'ऑर्डर', 'অর্ডার', 'ডেলিভারি'],
    entities: ['order_id'],
    response_template: 'Your order {order_id} is currently {status} and will arrive by {date}.'
  },
  'payment_inquiry': {
    keywords: ['payment', 'money', 'receive', 'भुगतान', 'পেমেন্ট', 'টকা'],
    entities: ['transaction_id', 'amount'],
    response_template: 'Your payment of ₹{amount} is {status}.'
  },
  'account_inquiry': {
    keywords: ['account', 'profile', 'balance', 'खाता', 'হিচাপ', 'বেলেন্স'],
    entities: ['account_type'],
    response_template: 'Your account balance is ₹{balance}.'
  },
  
  // Technical support
  'problem_report': {
    keywords: ['problem', 'issue', 'not working', 'समस्या', 'সমস্যা', 'সমস্যা আছে'],
    entities: ['problem_type', 'description'],
    response_template: 'I understand you are facing {problem}. Let me help you resolve this.'
  },
  'help_request': {
    keywords: ['help', 'assist', 'guide', 'मदद', 'সহায়তা', 'সহায়'],
    entities: ['topic'],
    response_template: 'I can help you with {topic}. Would you like me to explain?'
  }
};

// Entity Extraction Patterns
const ENTITY_PATTERNS = {
  'crop': [
    /\b(rice|wheat|maize|potato|tomato|onion|brinjal|chilli|ginger|turmeric|cotton|tea|coffee|rubber)\b/i,
    /\b(चावल|गेहूं|मक्का|आलू|टमाटर|प्याज|बैंगन|मिर्च|अदरक|हल्दी|कपास|चाय|कॉफी)\b/i,
    /\b(ধান|গম|ভুট্টা|আলু|টমেটা|পেঁয়াজ|বেগুন|মরিচ|আদা|হলুদ|তুলা|চা|কফি)\b/i
  ],
  'quantity': [
    /\b(\d+)\s*(kg|kilogram|ton|quintal|kg|kg|किलो|क्विंटल|কেজি|কুইন্টাল)\b/i,
    /\b(\d+)\s*(liter|litre|ml|लीटर|লিটার)\b/i
  ],
  'location': [
    /\b(village|district|state|গ্রাম|জেলা|রাজ্য|गांव|जिला|राज्य)\s+(\w+)\b/i
  ],
  'price': [
    /\b₹?(\d+(?:,\d+)*(?:\.\d{2})?)\b/
  ],
  'date': [
    /\b(today|tomorrow|yesterday|next week|next month|आज|कल|परसों|अगले सप्ताह|আজ|কাল|আগামী সপ্তাহ)\b/i,
    /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/
  ]
};

/**
 * Advanced Intent Detection with Context
 */
function detectIntentWithContext(transcript, language, conversationHistory = []) {
  const lowerTranscript = transcript.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  // Check each intent
  for (const [intentName, intentConfig] of Object.entries(AGRICULTURAL_INTENTS)) {
    let score = 0;
    const matchedKeywords = [];

    // Keyword matching
    for (const keyword of intentConfig.keywords) {
      if (lowerTranscript.includes(keyword.toLowerCase())) {
        score += 0.3;
        matchedKeywords.push(keyword);
      }
    }

    // Context from conversation history
    if (conversationHistory.length > 0) {
      const lastIntent = conversationHistory[conversationHistory.length - 1].intent;
      if (lastIntent === intentName) {
        score += 0.2; // Context boost for follow-up questions
      }
    }

    // Language-specific patterns
    if (language !== 'en') {
      const languageConfig = LANGUAGE_CONFIG[language];
      if (languageConfig && languageConfig.confidence_threshold < 0.8) {
        score += 0.1; // Boost for regional languages to account for translation issues
      }
    }

    if (score > highestScore && score > 0.3) {
      highestScore = score;
      bestMatch = {
        intent: intentName,
        confidence: Math.min(score, 1.0),
        matched_keywords: matchedKeywords,
        entities: extractEntities(transcript, intentConfig.entities)
      };
    }
  }

  return bestMatch || {
    intent: 'general',
    confidence: 0.5,
    matched_keywords: [],
    entities: {}
  };
}

/**
 * Extract Entities from Transcript
 */
function extractEntities(transcript, targetEntities) {
  const entities = {};

  for (const entityType of targetEntities) {
    const patterns = ENTITY_PATTERNS[entityType];
    if (patterns) {
      for (const pattern of patterns) {
        const match = transcript.match(pattern);
        if (match) {
          entities[entityType] = match[1] || match[0];
          break;
        }
      }
    }
  }

  return entities;
}

/**
 * Generate Context-Aware Response
 */
async function generateVoiceResponse(intent, entities, language, userId) {
  try {
    const intentConfig = AGRICULTURAL_INTENTS[intent];
    let responseText = intentConfig.response_template;

    // Fetch real data based on entities
    const data = await fetchIntentData(intent, entities, userId);

    // Replace placeholders with actual data
    for (const [key, value] of Object.entries(data)) {
      responseText = responseText.replace(`{${key}}`, value);
    }

    // Language-specific response formatting
    if (language !== 'en') {
      responseText = await translateResponse(responseText, language);
    }

    return {
      text: responseText,
      intent: intent,
      confidence: intentConfig ? 0.85 : 0.5,
      data: data,
      language: language,
      voice_parameters: {
        gender: LANGUAGE_CONFIG[language]?.voice_gender || 'female',
        rate: 0.9,
        pitch: 1.0
      }
    };
  } catch (error) {
    logger.error('Voice response generation failed', { error: error.message, stack: error.stack });
    return {
      text: getDefaultErrorResponse(language),
      intent: 'error',
      confidence: 0.0,
      language: language
    };
  }
}

/**
 * Fetch Intent-Specific Data
 */
async function fetchIntentData(intent, entities, userId) {
  const data = {};

  try {
    switch (intent) {
      case 'price_inquiry':
        if (entities.crop) {
          const priceData = await getCurrentPrice(entities.crop, entities.location);
          data.crop = entities.crop;
          data.location = entities.location || 'local market';
          data.price = priceData.price;
        }
        break;

      case 'selling_intent':
        if (entities.crop) {
          const marketData = await getMarketDemand(entities.crop);
          data.crop = entities.crop;
          data.quantity = entities.quantity || 'your harvest';
          data.current_demand = marketData.demand;
          data.estimated_price = marketData.price;
        }
        break;

      case 'loan_inquiry':
        const userData = await getUserCreditProfile(userId);
        data.amount = userData.eligible_amount;
        data.interest_rate = userData.interest_rate;
        break;

      case 'subsidy_inquiry':
        const subsidyData = await getUserEligibleSubsidies(userId, entities.crop);
        data.scheme = subsidyData.scheme_name;
        data.amount = subsidyData.amount;
        break;

      case 'order_status':
        if (entities.order_id) {
          const orderData = await getOrderStatus(entities.order_id, userId);
          data.order_id = entities.order_id;
          data.status = orderData.status;
          data.date = orderData.estimated_delivery;
        }
        break;

      default:
        // Generic data fetching
        Object.assign(data, entities);
    }
  } catch (error) {
    logger.error('Failed to fetch intent data', { error: error.message, stack: error.stack });
  }

  return data;
}

/**
 * Get Current Price (Mock implementation)
 */
async function getCurrentPrice(crop, location) {
  // In production, fetch from real database
  const mockPrices = {
    'rice': { price: 25 },
    'wheat': { price: 22 },
    'maize': { price: 18 },
    'potato': { price: 15 },
    'tomato': { price: 30 },
    'onion': { price: 35 }
  };

  return mockPrices[crop.toLowerCase()] || { price: 20 };
}

/**
 * Get Market Demand (Mock implementation)
 */
async function getMarketDemand(crop) {
  // In production, fetch from AI demand forecasting
  return {
    demand: 'high',
    price: 25
  };
}

/**
 * Get User Credit Profile
 */
async function getUserCreditProfile(userId) {
  const query = `
    SELECT fdi_score, repayment_history
    FROM farmers
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);

  if (result.rows.length > 0) {
    const fdi = result.rows[0].fdi_score || 50;
    return {
      eligible_amount: fdi * 10000,
      interest_rate: fdi > 70 ? 8.5 : 12.0
    };
  }

  return {
    eligible_amount: 50000,
    interest_rate: 12.0
  };
}

/**
 * Get User Eligible Subsidies
 */
async function getUserEligibleSubsidies(userId, crop) {
  // In production, fetch from government scheme database
  return {
    scheme_name: 'PM-KISAN',
    amount: 6000
  };
}

/**
 * Get Order Status
 */
async function getOrderStatus(orderId, userId) {
  const query = `
    SELECT status, estimated_delivery
    FROM orders
    WHERE id = $1 AND user_id = $2
  `;

  const result = await pool.query(query, [orderId, userId]);

  if (result.rows.length > 0) {
    return {
      status: result.rows[0].status,
      estimated_delivery: result.rows[0].estimated_delivery
    };
  }

  return {
    status: 'not found',
    estimated_delivery: 'N/A'
  };
}

/**
 * Translate Response to Target Language
 */
async function translateResponse(text, targetLanguage) {
  // In production, use Google Translate API or similar
  const translations = {
    'hi': {
      'The current price of': 'वर्तमान मूल्य',
      'in': 'में',
      'is': 'है',
      'per kg': 'प्रति किलो'
    },
    'as': {
      'The current price of': 'বৰ্তমান দাম',
      'in': 'ত',
      'is': 'হ',
      'per kg': 'প্ৰতি কিলোগ্রাম'
    },
    'bn': {
      'The current price of': 'বর্তমান দাম',
      'in': 'মধ্যে',
      'is': 'হল',
      'per kg': 'প্রতি কেজি'
    }
  };

  let translatedText = text;
  const langTranslations = translations[targetLanguage];

  if (langTranslations) {
    for (const [english, translated] of Object.entries(langTranslations)) {
      translatedText = translatedText.replace(new RegExp(english, 'g'), translated);
    }
  }

  return translatedText;
}

/**
 * Get Default Error Response
 */
function getDefaultErrorResponse(language) {
  const errorResponses = {
    'en': 'I apologize, but I could not understand your request. Could you please repeat?',
    'hi': 'मैं क्षमा चाहता हूं, लेकिन मैं आपका अनुरोध नहीं समझ पाया। क्या आप दोहरा सकते हैं?',
    'as': 'মই ক্ষমা প্ৰাৰ্থনা কৰোঁ, কিন্তু মই আপোনাৰ অনুৰোধ বুজিব নোৱাৰিলো। আপুনি পুনৰ কব পাৰেনে?',
    'bn': 'আমি দুঃখিত, আমি আপনার অনুরোধ বুঝতে পারিনি। আপনি কি আবার বলতে পারেন?',
    'mni': 'অতোয়া মাফ চাগৎনবা, অতোয়া অমুদা য়াম্বা শক্তে ঙাইদোক। অমুদা পুনর ওইবা ঙাইদে?',
    'or': 'ମୁଁ ଦୁଃଖିତ, ମୁଁ ଆପଣଙ୍କର ଅନୁରୋଧ ବୁଝିପାରିଲି ନାହିଁ। ଆପଣ କଣ ପୁନର୍ବାର କହିପାରିବେ କି?'
  };

  return errorResponses[language] || errorResponses['en'];
}

/**
 * Process Voice Command with Full Context
 */
async function processAdvancedVoiceCommand(userId, audioData, language, conversationId) {
  try {
    // Transcribe audio (in production, use speech-to-text API)
    const transcript = await transcribeAudio(audioData, language);

    // Get conversation history
    const history = await getConversationHistory(conversationId);

    // Detect intent with context
    const intentResult = detectIntentWithContext(transcript, language, history);

    // Generate response
    const response = await generateVoiceResponse(
      intentResult.intent,
      intentResult.entities,
      language,
      userId
    );

    // Store conversation turn
    await storeConversationTurn(conversationId, userId, transcript, intentResult, response);

    return {
      transcript: transcript,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      response: response,
      conversation_id: conversationId
    };
  } catch (error) {
    logger.error('Advanced voice command processing failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Transcribe Audio (Mock implementation)
 */
async function transcribeAudio(audioData, language) {
  // In production, use Google Speech-to-Text, Azure Speech, or similar
  return "What is the current price of rice in the local market?";
}

/**
 * Get Conversation History
 */
async function getConversationHistory(conversationId) {
  const query = `
    SELECT intent, transcript, response_text
    FROM voice_conversation_turns
    WHERE conversation_id = $1
    ORDER BY created_at ASC
    LIMIT 10
  `;

  const result = await pool.query(query, [conversationId]);
  return result.rows;
}

/**
 * Store Conversation Turn
 */
async function storeConversationTurn(conversationId, userId, transcript, intentResult, response) {
  const query = `
    INSERT INTO voice_conversation_turns
    (conversation_id, user_id, transcript, intent, confidence, entities, response_text, response_data)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;

  await pool.query(query, [
    conversationId,
    userId,
    transcript,
    intentResult.intent,
    intentResult.confidence,
    JSON.stringify(intentResult.entities),
    response.text,
    JSON.stringify(response.data)
  ]);
}

/**
 * Create Voice Conversation Session
 */
async function createVoiceConversation(userId, language = 'en') {
  const conversationId = `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const query = `
    INSERT INTO voice_conversations
    (conversation_id, user_id, language, status)
    VALUES ($1, $2, $3, 'active')
    RETURNING *
  `;

  const result = await pool.query(query, [conversationId, userId, language]);
  return result.rows[0];
}

/**
 * API Endpoints
 */

/**
 * POST /api/v1/advanced-voice/conversation
 * Create new voice conversation
 */
router.post('/conversation', authMiddleware, async (req, res) => {
  try {
    const { language } = req.body;
    const conversation = await createVoiceConversation(req.user.id, language);
    res.status(201).json(conversation);
  } catch (error) {
    logger.error('Create voice conversation error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * POST /api/v1/advanced-voice/process
 * Process voice command with context
 */
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { audio_data, language, conversation_id } = req.body;

    if (!audio_data || !conversation_id) {
      return res.status(400).json({ error: 'Audio data and conversation ID are required' });
    }

    const result = await processAdvancedVoiceCommand(
      req.user.id,
      audio_data,
      language || 'en',
      conversation_id
    );

    res.json(result);
  } catch (error) {
    logger.error('Process voice command error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to process voice command' });
  }
});

/**
 * GET /api/v1/advanced-voice/languages
 * Get supported languages
 */
router.get('/languages', (req, res) => {
  res.json({
    languages: Object.values(LANGUAGE_CONFIG).map(lang => ({
      code: lang.code,
      name: lang.name,
      speech_code: lang.speech_code,
      voice_code: lang.voice_code,
      confidence_threshold: lang.confidence_threshold
    }))
  });
});

/**
 * GET /api/v1/advanced-voice/intents
 * Get supported intents
 */
router.get('/intents', (req, res) => {
  res.json({
    intents: Object.keys(AGRICULTURAL_INTENTS).map(intent => ({
      name: intent,
      description: AGRICULTURAL_INTENTS[intent].response_template,
      entities: AGRICULTURAL_INTENTS[intent].entities
    }))
  });
});

/**
 * POST /api/v1/advanced-voice/text-query
 * Process text query for testing or accessibility
 */
router.post('/text-query', authMiddleware, async (req, res) => {
  try {
    const { text, language, conversation_id } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const history = conversation_id ? await getConversationHistory(conversation_id) : [];
    const intentResult = detectIntentWithContext(text, language || 'en', history);
    const response = await generateVoiceResponse(
      intentResult.intent,
      intentResult.entities,
      language || 'en',
      req.user.id
    );

    res.json({
      text: text,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      response: response
    });
  } catch (error) {
    logger.error('Text query processing error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to process text query' });
  }
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'advanced-voice-ai',
    languages_supported: Object.keys(LANGUAGE_CONFIG).length,
    intents_supported: Object.keys(AGRICULTURAL_INTENTS).length
  });
});

module.exports = {
  router,
  processAdvancedVoiceCommand,
  createVoiceConversation,
  detectIntentWithContext,
  generateVoiceResponse
};