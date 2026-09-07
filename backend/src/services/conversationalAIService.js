/**
 * Enterprise Conversational AI Service
 * AI-powered conversational assistance across all business domains
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../database/pool');

// ============================================================================
// CONVERSATION SESSIONS
// ============================================================================

/**
 * Create conversation session
 */
async function createConversationSession(userId, domainId, language = 'en') {
  try {
    const result = await pool.query(
      `INSERT INTO conversation_sessions 
       (user_id, session_id, domain_id, language, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [
        userId,
        `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        domainId,
        language
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create conversation session error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create conversation session
 */
router.post('/sessions', authMiddleware, async (req, res) => {
  try {
    const { domain_id, language } = req.body;
    const result = await createConversationSession(req.user.id, domain_id, language);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create session API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create conversation session' });
  }
});

/**
 * Get conversation session
 */
async function getConversationSession(sessionId) {
  try {
    const result = await pool.query(
      `SELECT cs.*, cd.name as domain_name 
       FROM conversation_sessions cs
       LEFT JOIN conversation_domains cd ON cs.domain_id = cd.id
       WHERE cs.session_id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Session not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get conversation session error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get conversation session
 */
router.get('/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const result = await getConversationSession(req.params.sessionId);
    res.json(result);
  } catch (error) {
    logger.error('Get session API error', { error: error.message, stack: error.stack });
    res.status(404).json({ error: 'Session not found' });
  }
});

// ============================================================================
// CONVERSATION MESSAGES
// ============================================================================

/**
 * Add message to conversation
 */
async function addMessage(sessionId, role, content, contentType = 'text', metadata = {}) {
  try {
    const startTime = Date.now();

    // Detect intent for user messages
    let intentDetected = null;
    let confidenceScore = null;

    if (role === 'user') {
      const intentResult = await detectIntent(content);
      intentDetected = intentResult.intent;
      confidenceScore = intentResult.confidence;
    }

    const processingTime = Date.now() - startTime;

    const result = await pool.query(
      `INSERT INTO conversation_messages 
       (session_id, role, content, content_type, metadata, intent_detected, confidence_score, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        sessionId,
        role,
        content,
        contentType,
        JSON.stringify(metadata),
        intentDetected,
        confidenceScore,
        processingTime
      ]
    );

    // Update session activity
    await pool.query('SELECT update_session_activity($1)', [sessionId]);

    return result.rows[0];
  } catch (error) {
    logger.error('Add message error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to add message
 */
router.post('/sessions/:sessionId/messages', authMiddleware, async (req, res) => {
  try {
    const { role, content, content_type, metadata } = req.body;
    const result = await addMessage(req.params.sessionId, role, content, content_type, metadata);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Add message API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to add message' });
  }
});

/**
 * Get conversation messages
 */
async function getConversationMessages(sessionId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT * FROM conversation_messages 
       WHERE session_id = $1 
       ORDER BY timestamp ASC 
       LIMIT $2`,
      [sessionId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Get conversation messages error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get conversation messages
 */
router.get('/sessions/:sessionId/messages', authMiddleware, async (req, res) => {
  try {
    const { limit } = req.query;
    const result = await getConversationMessages(req.params.sessionId, parseInt(limit) || 50);
    res.json(result);
  } catch (error) {
    logger.error('Get messages API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get conversation messages' });
  }
});

// ============================================================================
// INTENT RECOGNITION
// ============================================================================

/**
 * Detect intent from user message
 */
async function detectIntent(message) {
  try {
    // Simple keyword-based intent detection (can be enhanced with ML model)
    const lowerMessage = message.toLowerCase();
    
    const intentMap = {
      'greeting': ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      'product_search': ['search', 'find', 'looking for', 'show me', 'product'],
      'order_status': ['order', 'status', 'track', 'where is my'],
      'farmer_info': ['farmer', 'profile', 'farmer details'],
      'loan_inquiry': ['loan', 'credit', 'finance', 'money'],
      'shipment_tracking': ['shipment', 'delivery', 'track package'],
      'insurance': ['insurance', 'policy', 'claim'],
      'organic': ['organic', 'certification', 'traceability'],
      'nutrition': ['nutrition', 'health', 'dietary'],
      'help': ['help', 'assist', 'support', 'what can you do']
    };

    let detectedIntent = 'general';
    let maxMatches = 0;

    for (const [intent, keywords] of Object.entries(intentMap)) {
      const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedIntent = intent;
      }
    }

    return {
      intent: detectedIntent,
      confidence: maxMatches > 0 ? 0.85 : 0.50
    };
  } catch (error) {
    logger.error('Detect intent error', { error: error.message, stack: error.stack });
    return { intent: 'general', confidence: 0.30 };
  }
}

/**
 * API endpoint to detect intent
 */
router.post('/detect-intent', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const result = await detectIntent(message);
    res.json(result);
  } catch (error) {
    logger.error('Detect intent API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to detect intent' });
  }
});

// ============================================================================
// AI RESPONSE GENERATION
// ============================================================================

/**
 * Generate AI response
 */
async function generateResponse(sessionId, userMessage, context = {}) {
  try {
    // Get session info
    const session = await getConversationSession(sessionId);
    
    // Detect intent
    const intentResult = await detectIntent(userMessage);
    
    // Get response template based on intent
    const response = await getResponseForIntent(intentResult.intent, session.domain_id, context);
    
    // In production, this would call an AI model (OpenAI, Anthropic, etc.)
    // For now, return template-based response
    return {
      content: response,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      requires_action: determineIfActionRequired(intentResult.intent)
    };
  } catch (error) {
    logger.error('Generate response error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get response for intent
 */
async function getResponseForIntent(intent, domainId, context) {
  try {
    // Simple response templates (can be enhanced with knowledge base)
    const responses = {
      greeting: "Hello! I'm your AFRERA assistant. How can I help you today?",
      product_search: "I can help you search for products. What type of product are you looking for?",
      order_status: "I can help you check your order status. Please provide your order number.",
      farmer_info: "I can help you with farmer information. What would you like to know?",
      loan_inquiry: "I can help you with loan information. Are you looking to apply for a loan or check your status?",
      shipment_tracking: "I can help you track your shipment. Please provide your tracking number.",
      insurance: "I can help you with insurance information. What would you like to know?",
      organic: "I can help you with organic certification and traceability information.",
      nutrition: "I can help you with nutrition information and dietary recommendations.",
      help: "I can assist you with products, orders, farmers, loans, shipments, insurance, organic certification, and nutrition information. What would you like help with?",
      general: "I'm here to help. Could you please provide more details about what you need?"
    };

    return responses[intent] || responses.general;
  } catch (error) {
    logger.error('Get response for intent error', { error: error.message, stack: error.stack });
    return "I apologize, but I'm having trouble processing your request. Please try again.";
  }
}

/**
 * Determine if action is required
 */
function determineIfActionRequired(intent) {
  const actionRequiredIntents = ['order_status', 'shipment_tracking', 'loan_inquiry'];
  return actionRequiredIntents.includes(intent);
}

/**
 * API endpoint to generate response
 */
router.post('/sessions/:sessionId/respond', authMiddleware, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Add user message
    await addMessage(req.params.sessionId, 'user', message);
    
    // Generate response
    const response = await generateResponse(req.params.sessionId, message, context);
    
    // Add assistant message
    await addMessage(req.params.sessionId, 'assistant', response.content);
    
    res.json(response);
  } catch (error) {
    logger.error('Generate response API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// ============================================================================
// CONVERSATION DOMAINS
// ============================================================================

/**
 * Get all conversation domains
 */
async function getConversationDomains() {
  try {
    const result = await pool.query(
      'SELECT * FROM conversation_domains WHERE is_active = true ORDER BY priority DESC, name'
    );
    return result.rows;
  } catch (error) {
    logger.error('Get conversation domains error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get conversation domains
 */
router.get('/domains', async (req, res) => {
  try {
    const result = await getConversationDomains();
    res.json(result);
  } catch (error) {
    logger.error('Get domains API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get conversation domains' });
  }
});

// ============================================================================
// CONVERSATION CONTEXT
// ============================================================================

/**
 * Set conversation context
 */
async function setContext(sessionId, contextKey, contextValue, expiresAt = null) {
  try {
    const result = await pool.query(
      `INSERT INTO conversation_context (session_id, context_key, context_value, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, context_key)
       DO UPDATE SET context_value = EXCLUDED.context_value, 
                      expires_at = EXCLUDED.expires_at,
                      updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [sessionId, contextKey, JSON.stringify(contextValue), expiresAt]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Set context error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get conversation context
 */
async function getContext(sessionId, contextKey = null) {
  try {
    let query = 'SELECT * FROM conversation_context WHERE session_id = $1';
    const params = [sessionId];

    if (contextKey) {
      query += ' AND context_key = $2';
      params.push(contextKey);
    }

    // Filter expired contexts
    query += ' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)';

    const result = await pool.query(query, params);

    if (contextKey) {
      return result.rows.length > 0 ? result.rows[0] : null;
    }

    // Convert to key-value map
    const contextMap = {};
    result.rows.forEach(row => {
      contextMap[row.context_key] = row.context_value;
    });

    return contextMap;
  } catch (error) {
    logger.error('Get context error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to set context
 */
router.post('/sessions/:sessionId/context', authMiddleware, async (req, res) => {
  try {
    const { context_key, context_value, expires_at } = req.body;
    const result = await setContext(req.params.sessionId, context_key, context_value, expires_at);
    res.json(result);
  } catch (error) {
    logger.error('Set context API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to set context' });
  }
});

/**
 * API endpoint to get context
 */
router.get('/sessions/:sessionId/context', authMiddleware, async (req, res) => {
  try {
    const { context_key } = req.query;
    const result = await getContext(req.params.sessionId, context_key);
    res.json(result);
  } catch (error) {
    logger.error('Get context API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get context' });
  }
});

// ============================================================================
// CONVERSATION ANALYTICS
// ============================================================================

/**
 * End conversation session and record analytics
 */
async function endConversation(sessionId, resolutionStatus, userSatisfaction = null, feedback = null) {
  try {
    // Get session messages
    const messages = await getConversationMessages(sessionId);
    
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;
    const avgResponseTime = messages
      .filter(m => m.role === 'assistant' && m.processing_time_ms)
      .reduce((sum, m) => sum + m.processing_time_ms, 0) / assistantMessages || 0;

    // Get session info
    const session = await getConversationSession(sessionId);

    // Record analytics
    await pool.query(
      `INSERT INTO conversation_analytics 
       (session_id, user_id, domain_id, total_messages, user_messages, assistant_messages, 
        avg_response_time_ms, resolution_status, user_satisfaction, feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        sessionId,
        session.user_id,
        session.domain_id,
        messages.length,
        userMessages,
        assistantMessages,
        avgResponseTime,
        resolutionStatus,
        userSatisfaction,
        feedback
      ]
    );

    // Update session status
    await pool.query(
      'UPDATE conversation_sessions SET status = $1, last_activity_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['ended', sessionId]
    );

    return { success: true };
  } catch (error) {
    logger.error('End conversation error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to end conversation
 */
router.post('/sessions/:sessionId/end', authMiddleware, async (req, res) => {
  try {
    const { resolution_status, user_satisfaction, feedback } = req.body;
    const result = await endConversation(req.params.sessionId, resolution_status, user_satisfaction, feedback);
    res.json(result);
  } catch (error) {
    logger.error('End conversation API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to end conversation' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

function isHealthy() {
  return pool.connect().then(() => true).catch(() => false);
}

module.exports = {
  router,
  createConversationSession,
  getConversationSession,
  addMessage,
  getConversationMessages,
  detectIntent,
  generateResponse,
  getConversationDomains,
  setContext,
  getContext,
  endConversation,
  isHealthy
};
