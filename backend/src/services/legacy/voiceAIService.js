/**
 * Voice AI Service
 * Manages voice interactions, speech recognition, and voice-activated commands
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('..\/utils\/logger');
const { authMiddleware } = require('..\/middleware\/auth');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('..\/database\/pool');

// ============================================================================
// VOICE SESSIONS
// ============================================================================

/**
 * Create voice session
 */
async function createVoiceSession(userId, language = 'en') {
  try {
    const sessionId = `VOICE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await pool.query(
      `INSERT INTO voice_sessions 
       (user_id, session_id, language, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [userId, sessionId, language]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create voice session error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create voice session
 */
router.post('/voice-sessions', authMiddleware, async (req, res) => {
  try {
    const { language } = req.body;
    let result = await createVoiceSession(req.user.id, language);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create voice session API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create voice session' });
  }
});

/**
 * End voice session
 */
async function endVoiceSession(sessionId) {
  try {
    let result = await pool.query(
      `UPDATE voice_sessions 
       SET ended_at = CURRENT_TIMESTAMP, 
           status = 'ended',
           duration_seconds = calculate_session_duration(id)
       WHERE id = $1
       RETURNING *`,
      [sessionId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('End voice session error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to end voice session
 */
router.post('/voice-sessions/:sessionId/end', authMiddleware, async (req, res) => {
  try {
    let result = await endVoiceSession(req.params.sessionId);
    res.json(result);
  } catch (error) {
    logger.error('End voice session API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to end voice session' });
  }
});

// ============================================================================
// VOICE COMMANDS
// ============================================================================

/**
 * Process voice command
 */
async function processVoiceCommand(sessionId, transcript, commandType, parameters) {
  try {
    // Simple intent detection (in production, use ML model)
    const intent = detectIntentFromTranscript(transcript);
    const confidence = 0.85;

    let result = await pool.query(
      `INSERT INTO voice_commands 
       (session_id, command_type, transcript, intent, confidence_score, parameters, execution_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'executed')
       RETURNING *`,
      [sessionId, commandType, transcript, intent, confidence, JSON.stringify(parameters)]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Process voice command error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Detect intent from transcript
 */
function detectIntentFromTranscript(transcript) {
  const lowerTranscript = transcript.toLowerCase();
  
  const intentMap = {
    'product_search': ['search', 'find', 'show me', 'looking for'],
    'order': ['order', 'buy', 'purchase', 'add to cart'],
    'navigation': ['go to', 'navigate', 'open', 'show'],
    'information': ['tell me', 'what is', 'how to', 'information'],
    'control': ['stop', 'pause', 'play', 'cancel']
  };

  for (const [intent, keywords] of Object.entries(intentMap)) {
    if (keywords.some(keyword => lowerTranscript.includes(keyword))) {
      return intent;
    }
  }

  return 'general';
}

/**
 * API endpoint to process voice command
 */
router.post('/voice-commands', authMiddleware, async (req, res) => {
  try {
    const { session_id, transcript, command_type, parameters } = req.body;
    let result = await processVoiceCommand(session_id, transcript, command_type, parameters);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Process voice command API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to process voice command' });
  }
});

/**
 * Get voice commands for session
 */
async function getVoiceCommands(sessionId) {
  try {
    let result = await pool.query(
      'SELECT * FROM voice_commands WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Get voice commands error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get voice commands
 */
router.get('/voice-sessions/:sessionId/commands', authMiddleware, async (req, res) => {
  try {
    let result = await getVoiceCommands(req.params.sessionId);
    res.json(result);
  } catch (error) {
    logger.error('Get voice commands API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get voice commands' });
  }
});

// ============================================================================
// SPEECH RECOGNITION
// ============================================================================

/**
 * Log speech recognition
 */
async function logSpeechRecognition(sessionId, audioDuration, transcript, confidence, language, provider, processingTime) {
  try {
    let result = await pool.query(
      `INSERT INTO speech_recognition_logs 
       (session_id, audio_duration_ms, transcript, confidence_score, language_detected, 
        recognition_provider, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [sessionId, audioDuration, transcript, confidence, language, provider, processingTime]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Log speech recognition error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to log speech recognition
 */
router.post('/speech-recognition', authMiddleware, async (req, res) => {
  try {
    const {
      session_id,
      audio_duration_ms,
      transcript,
      confidence_score,
      language_detected,
      recognition_provider,
      processing_time_ms
    } = req.body;
    let result = await logSpeechRecognition(
      session_id,
      audio_duration_ms,
      transcript,
      confidence_score,
      language_detected,
      recognition_provider,
      processing_time_ms
    );
    res.status(201).json(result);
  } catch (error) {
    logger.error('Log speech recognition API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to log speech recognition' });
  }
});

// ============================================================================
// VOICE RESPONSES
// ============================================================================

/**
 * Create voice response
 */
async function createVoiceResponse(sessionId, commandId, responseType, content, audioUrl, language) {
  try {
    let result = await pool.query(
      `INSERT INTO voice_responses 
       (session_id, command_id, response_type, content, audio_url, language)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [sessionId, commandId, responseType, content, audioUrl, language]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create voice response error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create voice response
 */
router.post('/voice-responses', authMiddleware, async (req, res) => {
  try {
    const { session_id, command_id, response_type, content, audio_url, language } = req.body;
    let result = await createVoiceResponse(session_id, command_id, response_type, content, audio_url, language);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create voice response API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create voice response' });
  }
});

// ============================================================================
// VOICE PREFERENCES
// ============================================================================

/**
 * Set voice preferences
 */
async function setVoicePreferences(userId, preferences) {
  try {
    let result = await pool.query(
      `INSERT INTO voice_preferences 
       (user_id, preferred_language, voice_gender, speech_rate, voice_volume, 
        auto_response_enabled, confirmation_required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id)
       DO UPDATE SET
         preferred_language = EXCLUDED.preferred_language,
         voice_gender = EXCLUDED.voice_gender,
         speech_rate = EXCLUDED.speech_rate,
         voice_volume = EXCLUDED.voice_volume,
         auto_response_enabled = EXCLUDED.auto_response_enabled,
         confirmation_required = EXCLUDED.confirmation_required,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        preferences.preferred_language || 'en',
        preferences.voice_gender || 'female',
        preferences.speech_rate || 1.0,
        preferences.voice_volume || 1.0,
        preferences.auto_response_enabled !== false,
        preferences.confirmation_required !== false
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Set voice preferences error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to set voice preferences
 */
router.post('/voice-preferences', authMiddleware, async (req, res) => {
  try {
    let result = await setVoicePreferences(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Set voice preferences API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to set voice preferences' });
  }
});

/**
 * Get voice preferences
 */
async function getVoicePreferences(userId) {
  try {
    let result = await pool.query(
      'SELECT * FROM voice_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default preferences
      return {
        preferred_language: 'en',
        voice_gender: 'female',
        speech_rate: 1.0,
        voice_volume: 1.0,
        auto_response_enabled: true,
        confirmation_required: true
      };
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get voice preferences error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get voice preferences
 */
router.get('/voice-preferences', authMiddleware, async (req, res) => {
  try {
    let result = await getVoicePreferences(req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Get voice preferences API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get voice preferences' });
  }
});

// ============================================================================
// VOICE ANALYTICS
// ============================================================================

/**
 * Record voice analytics
 */
async function recordVoiceAnalytics(userId, metrics) {
  try {
    let result = await pool.query(
      `INSERT INTO voice_analytics 
       (user_id, date, total_sessions, total_commands, successful_commands, failed_commands, 
        avg_confidence_score, avg_session_duration_seconds, most_used_commands)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, date)
       DO UPDATE SET
         total_sessions = voice_analytics.total_sessions + EXCLUDED.total_sessions,
         total_commands = voice_analytics.total_commands + EXCLUDED.total_commands,
         successful_commands = voice_analytics.successful_commands + EXCLUDED.successful_commands,
         failed_commands = voice_analytics.failed_commands + EXCLUDED.failed_commands
       RETURNING *`,
      [
        userId,
        metrics.sessions || 0,
        metrics.commands || 0,
        metrics.successful || 0,
        metrics.failed || 0,
        metrics.avg_confidence || 0,
        metrics.avg_duration || 0,
        JSON.stringify(metrics.most_used || {})
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Record voice analytics error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to record voice analytics
 */
router.post('/voice-analytics', authMiddleware, async (req, res) => {
  try {
    const { metrics } = req.body;
    let result = await recordVoiceAnalytics(req.user.id, metrics);
    res.json(result);
  } catch (error) {
    logger.error('Record voice analytics API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record voice analytics' });
  }
});

/**
 * Get voice analytics
 */
async function getVoiceAnalytics(userId, startDate = null, endDate = null) {
  try {
    let query = 'SELECT * FROM voice_analytics WHERE user_id = $1';
    const params = [userId];

    if (startDate) {
      query += ' AND date >= $2';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= $' + (params.length + 1);
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Get voice analytics error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get voice analytics
 */
router.get('/voice-analytics', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let result = await getVoiceAnalytics(req.user.id, start_date, end_date);
    res.json(result);
  } catch (error) {
    logger.error('Get voice analytics API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get voice analytics' });
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
  createVoiceSession,
  endVoiceSession,
  processVoiceCommand,
  getVoiceCommands,
  logSpeechRecognition,
  createVoiceResponse,
  setVoicePreferences,
  getVoicePreferences,
  recordVoiceAnalytics,
  getVoiceAnalytics,
  isHealthy
};


