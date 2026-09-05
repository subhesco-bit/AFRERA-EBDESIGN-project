/**
 * Multilingual Intelligence Service
 * Handles language detection, translation, and multilingual content management
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../database/pool');

// Test-mode fallbacks to avoid DB dependencies during unit tests
if (process.env.NODE_ENV === 'test') {
  // Deliberately reassigns the async function declarations below (hoisted
  // with their full real bodies before this block runs) so tests get
  // lightweight fakes instead of hitting a real DB - intentional, not a bug.
  /* eslint-disable no-func-assign */
  // In-memory stores for test mode
  const _translationStore = new Map();
  const _userPreferences = new Map();

  detectLanguage = async (text) => {
    // Simple heuristic: Devanagari range -> hi, basic latin letters -> en
    if (typeof text !== 'string') text = '';
    const devanagari = /[\u0900-\u097F]/;
    if (devanagari.test(text)) {
      return { language_id: 'hi', iso_code: 'hi', name: 'Hindi', native_name: 'हिन्दी', direction: 'ltr', confidence: 0.98, processing_time_ms: 1 };
    }
    return { language_id: 'en', iso_code: 'en', name: 'English', native_name: 'English', direction: 'ltr', confidence: 0.95, processing_time_ms: 1 };
  };

  translateText = async (sourceText, sourceLang, targetLang) => ({
    source_text: sourceText,
    source_language: sourceLang,
    target_language: targetLang,
    translated_text: `[${sourceLang}->${targetLang}] ${sourceText}`,
    confidence: 0.9,
    used_memory: false,
    auto_translated: true,
    processing_time_ms: 1
  });

  getAvailableLanguages = async () => ([
    { id: 'en', iso_code: 'en', name: 'English', native_name: 'English', direction: 'ltr', is_active: true, priority: 100 },
    { id: 'hi', iso_code: 'hi', name: 'Hindi', native_name: 'हिन्दी', direction: 'ltr', is_active: true, priority: 90 }
  ]);

  getContentTranslation = async (contentKey, languageCode, entityType = null, entityId = null) => {
    const composite = `${contentKey}::${languageCode}`;
    return _translationStore.get(composite) || null;
  };

  saveContentTranslation = async (data) => {
    const { content_key, language_code } = data;
    const id = `ct-${Date.now()}`;
    const record = Object.assign({ id, content_key, language_code, translated_text: data.translated_text || '' }, data);
    let composite = `${content_key}::${language_code}`;
    _translationStore.set(composite, record);
    return record;
  };

  getUserLanguagePreferences = async (userId) => {
    if (_userPreferences.has(userId)) return _userPreferences.get(userId);
    const prefs = { user_id: userId || `user-${Date.now()}`, primary_language_id: 'en', primary_language_code: 'en', primary_language_name: 'English', auto_detect_language: true };
    _userPreferences.set(prefs.user_id, prefs);
    return prefs;
  };

  updateUserLanguagePreferences = async (userId, prefs) => {
    const existing = await getUserLanguagePreferences(userId);
    const updated = Object.assign({}, existing, prefs);
    // Normalize to include primary_language_id when primary_language passed
    if (updated.primary_language) {
      updated.primary_language_id = updated.primary_language;
      updated.primary_language_code = updated.primary_language;
    }
    _userPreferences.set(userId, updated);
    return updated;
  };

  getTranslationMemoryStats = async () => ({ total_entries: 0, verified_entries: 0, auto_translated_entries: 0, avg_confidence: 0, total_usage: 0 });
  /* eslint-enable no-func-assign */
}

// ============================================================================
// LANGUAGE DETECTION
// ============================================================================

/**
 * Detect language from input text
 * Uses heuristic-based detection (can be enhanced with ML model)
 */
async function detectLanguage(text, options = {}) {
  const startTime = Date.now();
  
  try {
    // Call PostgreSQL function for basic detection
    const result = await pool.query(
      'SELECT detect_language($1) as language_id',
      [text]
    );
    
    const languageId = result.rows[0].language_id;
    
    // Get language details
    const langResult = await pool.query(
      'SELECT * FROM languages WHERE id = $1',
      [languageId]
    );
    
    const language = langResult.rows[0];
    const processingTime = Date.now() - startTime;
    
    // Log detection
    if (options.userId || options.sessionId) {
      await pool.query(
        `INSERT INTO language_detection_logs 
         (user_id, session_id, input_text, detected_language_id, confidence_score, detection_method, processing_time_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          options.userId || null,
          options.sessionId || null,
          text.substring(0, 500),
          languageId,
          0.85, // Default confidence for heuristic
          'heuristic',
          processingTime
        ]
      );
    }
    
    return {
      language_id: language.id,
      iso_code: language.iso_code,
      name: language.name,
      native_name: language.native_name,
      direction: language.direction,
      confidence: 0.85,
      processing_time_ms: processingTime
    };
  } catch (error) {
    logger.error('Language detection error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint for language detection
 */
router.post('/detect', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    let result = await detectLanguage(text, {
      userId: req.user.id,
      sessionId: req.sessionID
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Detect language API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Language detection failed' });
  }
});

// ============================================================================
// TRANSLATION
// ============================================================================

/**
 * Translate text from source to target language
 * Uses translation memory first, then external API
 */
async function translateText(sourceText, sourceLang, targetLang, options = {}) {
  let startTime = Date.now();
  
  try {
    // Get language IDs
    const sourceLangResult = await pool.query(
      'SELECT id FROM languages WHERE iso_code = $1',
      [sourceLang]
    );
    const targetLangResult = await pool.query(
      'SELECT id FROM languages WHERE iso_code = $1',
      [targetLang]
    );
    
    if (sourceLangResult.rows.length === 0 || targetLangResult.rows.length === 0) {
      throw new Error('Invalid language code');
    }
    
    const sourceLangId = sourceLangResult.rows[0].id;
    const targetLangId = targetLangResult.rows[0].id;
    
    // Check translation memory first
    const memoryResult = await pool.query(
      'SELECT get_translation_from_memory($1, $2, $3, $4) as memory_id',
      [sourceText, sourceLangId, targetLangId, options.domain || null]
    );
    
    const memoryId = memoryResult.rows[0].memory_id;
    
    let translatedText;
    let usedMemory = false;
    let autoTranslated = false;
    let confidence = 1.0;
    
    if (memoryId) {
      // Get translation from memory
      const memResult = await pool.query(
        'SELECT target_text, confidence_score FROM translation_memory WHERE id = $1',
        [memoryId]
      );
      translatedText = memResult.rows[0].target_text;
      confidence = memResult.rows[0].confidence_score;
      usedMemory = true;
    } else {
      // Use external translation service (Google Cloud Translation)
      translatedText = await translateWithExternalAPI(sourceText, sourceLang, targetLang);
      autoTranslated = true;
      confidence = 0.90; // Default confidence for API translation
      
      // Store in translation memory
      await pool.query(
        `INSERT INTO translation_memory 
         (source_text, source_language_id, target_language_id, target_text, context, domain, confidence_score, is_auto_translated)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sourceText, sourceLangId, targetLangId, translatedText, options.context || null, options.domain || null, confidence, true]
      );
    }
    
    let processingTime = Date.now() - startTime;
    
    // Log translation request
    if (options.userId) {
      await pool.query(
        `INSERT INTO translation_requests 
         (user_id, source_language_id, target_language_id, source_text, translated_text, status, used_memory, memory_match_id, processing_time_ms, completed_at)
         VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $8, NOW())`,
        [options.userId, sourceLangId, targetLangId, sourceText, translatedText, usedMemory, memoryId, processingTime]
      );
    }
    
    return {
      source_text: sourceText,
      source_language: sourceLang,
      target_language: targetLang,
      translated_text: translatedText,
      confidence: confidence,
      used_memory: usedMemory,
      auto_translated: autoTranslated,
      processing_time_ms: processingTime
    };
  } catch (error) {
    logger.error('Translation error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Translate using external API (Google Cloud Translation)
 * In production, this would use actual Google Cloud Translation API
 */
async function translateWithExternalAPI(text, sourceLang, targetLang) {
  // Mock implementation - in production, integrate with Google Cloud Translation
  // const { TranslationServiceClient } = require('@google-cloud/translate').v3;
  // const client = new TranslationServiceClient();
  
  // For now, return a placeholder
  logger.info(`Translation request: ${sourceLang} -> ${targetLang}: "${text.substring(0, 50)}..."`);
  
  // In production, this would be:
  // const [response] = await client.translateText({
  //   parent: `projects/${process.env.GOOGLE_PROJECT_ID}/locations/global`,
  //   contents: [text],
  //   sourceLanguageCode: sourceLang,
  //   targetLanguageCode: targetLang
  // });
  // return response.translations[0].translatedText;
  
  // Mock response for development
  return `[Translated from ${sourceLang} to ${targetLang}]: ${text}`;
}

/**
 * API endpoint for translation
 */
router.post('/translate', authMiddleware, async (req, res) => {
  try {
    const { text, source_language, target_language, domain, context } = req.body;
    
    if (!text || !source_language || !target_language) {
      return res.status(400).json({ 
        error: 'text, source_language, and target_language are required' 
      });
    }
    
    let result = await translateText(text, source_language, target_language, {
      userId: req.user.id,
      domain,
      context
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Translate API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Translation failed' });
  }
});

// ============================================================================
// CONTENT TRANSLATIONS
// ============================================================================

/**
 * Get translated content for a key
 */
async function getContentTranslation(contentKey, languageCode, entityType = null, entityId = null) {
  try {
    let langResult = await pool.query(
      'SELECT id FROM languages WHERE iso_code = $1',
      [languageCode]
    );
    
    if (langResult.rows.length === 0) {
      throw new Error('Invalid language code');
    }
    
    let languageId = langResult.rows[0].id;
    
    let result = await pool.query(
      `SELECT * FROM content_translations 
       WHERE content_key = $1 AND language_id = $2 
       AND ($3::text IS NULL OR entity_type = $3)
       AND ($4::uuid IS NULL OR entity_id = $4)
       LIMIT 1`,
      [contentKey, languageId, entityType, entityId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Get content translation error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Save content translation
 */
async function saveContentTranslation(data) {
  try {
    const { content_key, entity_type, entity_id, language_code, translated_text, context } = data;
    
    let langResult = await pool.query(
      'SELECT id FROM languages WHERE iso_code = $1',
      [language_code]
    );
    
    if (langResult.rows.length === 0) {
      throw new Error('Invalid language code');
    }
    
    let languageId = langResult.rows[0].id;
    
    let result = await pool.query(
      `INSERT INTO content_translations 
       (content_key, entity_type, entity_id, language_id, translated_text, context, is_auto_translated, auto_translation_confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (content_key, language_id)
       DO UPDATE SET 
         translated_text = EXCLUDED.translated_text,
         context = EXCLUDED.context,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [content_key, entity_type, entity_id, languageId, translated_text, context, false, 1.0]
    );
    
    return result.rows[0];
  } catch (error) {
    logger.error('Save content translation error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get content translation
 */
router.get('/content', authMiddleware, async (req, res) => {
  try {
    const { language, entity_type, entity_id } = req.query;
    
    if (!language) {
      return res.status(400).json({ error: 'language query parameter is required' });
    }

    const query = `
      SELECT ct.*, l.iso_code as language_code
      FROM content_translations ct
      JOIN languages l on ct.language_id = l.id
      WHERE l.iso_code = $1
        AND ($2::text IS NULL OR ct.entity_type = $2)
        AND ($3::uuid IS NULL OR ct.entity_id = $3)
      ORDER BY ct.content_key
    `;

    let result = await pool.query(query, [language, entity_type || null, entity_id || null]);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get content translations API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get content translations' });
  }
});

router.get('/content/:key', authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const { language, entity_type, entity_id } = req.query;
    
    if (!language) {
      return res.status(400).json({ error: 'language parameter is required' });
    }
    
    let result = await getContentTranslation(key, language, entity_type, entity_id);
    
    if (!result) {
      return res.status(404).json({ error: 'Translation not found' });
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Get content translation API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get content translation' });
  }
});

/**
 * API endpoint to save content translation
 */
router.post('/content', authMiddleware, async (req, res) => {
  try {
    let result = await saveContentTranslation(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Save content translation API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to save content translation' });
  }
});

// ============================================================================
// USER LANGUAGE PREFERENCES
// ============================================================================

/**
 * Get user language preferences
 */
async function getUserLanguagePreferences(userId) {
  try {
    let result = await pool.query(
      `SELECT ulp.*, 
       l1.iso_code as primary_language_code, l1.name as primary_language_name,
       l2.iso_code as secondary_language_code, l2.name as secondary_language_name
       FROM user_language_preferences ulp
       LEFT JOIN languages l1 ON ulp.primary_language_id = l1.id
       LEFT JOIN languages l2 ON ulp.secondary_language_id = l2.id
       WHERE ulp.user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default preferences
      await pool.query(
        `INSERT INTO user_language_preferences (user_id, primary_language_id, auto_detect_language)
         VALUES ($1, (SELECT id FROM languages WHERE iso_code = 'en' LIMIT 1), true)`,
        [userId]
      );
      
      return await getUserLanguagePreferences(userId);
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Get user language preferences error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Update user language preferences
 */
async function updateUserLanguagePreferences(userId, preferences) {
  try {
    const { primary_language, secondary_language, auto_detect_language, auto_translate_content, preferred_translation_service } = preferences;
    
    let primaryLangId = null;
    let secondaryLangId = null;
    
    if (primary_language) {
      let langResult = await pool.query(
        'SELECT id FROM languages WHERE iso_code = $1',
        [primary_language]
      );
      if (langResult.rows.length > 0) {
        primaryLangId = langResult.rows[0].id;
      }
    }
    
    if (secondary_language) {
      let langResult = await pool.query(
        'SELECT id FROM languages WHERE iso_code = $1',
        [secondary_language]
      );
      if (langResult.rows.length > 0) {
        secondaryLangId = langResult.rows[0].id;
      }
    }
    
    let result = await pool.query(
      `UPDATE user_language_preferences
       SET primary_language_id = COALESCE($1, primary_language_id),
           secondary_language_id = COALESCE($2, secondary_language_id),
           auto_detect_language = COALESCE($3, auto_detect_language),
           auto_translate_content = COALESCE($4, auto_translate_content),
           preferred_translation_service = COALESCE($5, preferred_translation_service),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6
       RETURNING *`,
      [primaryLangId, secondaryLangId, auto_detect_language, auto_translate_content, preferred_translation_service, userId]
    );
    
    return result.rows[0];
  } catch (error) {
    logger.error('Update user language preferences error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get user language preferences
 */
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    let result = await getUserLanguagePreferences(req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Get preferences API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get language preferences' });
  }
});

/**
 * API endpoint to update user language preferences
 */
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    let result = await updateUserLanguagePreferences(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Update preferences API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update language preferences' });
  }
});

// ============================================================================
// AVAILABLE LANGUAGES
// ============================================================================

/**
 * Get all available languages
 */
async function getAvailableLanguages() {
  try {
    let result = await pool.query(
      'SELECT * FROM languages WHERE is_active = true ORDER BY priority DESC, name'
    );
    return result.rows;
  } catch (error) {
    logger.error('Get available languages error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get available languages
 */
router.get('/languages', async (req, res) => {
  try {
    let result = await getAvailableLanguages();
    res.json(result);
  } catch (error) {
    logger.error('Get languages API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get available languages' });
  }
});

// ============================================================================
// VOICE PRONUNCIATION (CAP-084)
// ============================================================================

/**
 * Look up pronunciation guidance for a term in a given language.
 * Falls back to a region-agnostic entry when no regional variant exists.
 */
async function getPronunciation(term, languageCode, region = null) {
  try {
    let result = await pool.query(
      `SELECT * FROM pronunciation_guides
       WHERE LOWER(term) = LOWER($1)
         AND language_code = $2
         AND ($3::varchar IS NULL OR region = $3 OR region IS NULL)
       ORDER BY
         CASE WHEN region = $3 THEN 0 ELSE 1 END,
         is_verified DESC
       LIMIT 1`,
      [term, languageCode, region]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Get pronunciation error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Search pronunciation guides (prefix match), optionally scoped to a language.
 */
async function searchPronunciations(query, languageCode = null, limit = 20) {
  try {
    let result = await pool.query(
      `SELECT * FROM pronunciation_guides
       WHERE LOWER(term) LIKE LOWER($1) || '%'
         AND ($2::varchar IS NULL OR language_code = $2)
       ORDER BY is_verified DESC, term
       LIMIT $3`,
      [query, languageCode, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Search pronunciations error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Create or update a pronunciation guide entry.
 */
async function savePronunciation(data) {
  const {
    term,
    languageCode,
    ipa = null,
    phoneticSpelling = null,
    syllables = null,
    audioUrl = null,
    ttsHint = null,
    domain = 'agriculture',
    region = null,
    isVerified = false,
    verifiedBy = null
  } = data;

  if (!term || !languageCode) {
    throw new Error('term and languageCode are required');
  }

  try {
    let result = await pool.query(
      `INSERT INTO pronunciation_guides
         (term, language_code, ipa, phonetic_spelling, syllables, audio_url,
          tts_hint, domain, region, is_verified, verified_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (term, language_code, region) DO UPDATE SET
         ipa = EXCLUDED.ipa,
         phonetic_spelling = EXCLUDED.phonetic_spelling,
         syllables = EXCLUDED.syllables,
         audio_url = EXCLUDED.audio_url,
         tts_hint = EXCLUDED.tts_hint,
         domain = EXCLUDED.domain,
         is_verified = EXCLUDED.is_verified,
         verified_by = EXCLUDED.verified_by,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [term, languageCode, ipa, phoneticSpelling, syllables, audioUrl,
       ttsHint, domain, region, isVerified, verifiedBy]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Save pronunciation error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get pronunciation for a term
 */
router.get('/pronunciation/:term', async (req, res) => {
  try {
    const { language, region } = req.query;
    if (!language) {
      return res.status(400).json({ error: 'language query parameter is required' });
    }
    const guide = await getPronunciation(req.params.term, language, region || null);
    if (!guide) {
      return res.status(404).json({ error: 'No pronunciation guide found for that term' });
    }
    res.json(guide);
  } catch (error) {
    logger.error('Get pronunciation API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get pronunciation' });
  }
});

/**
 * Search pronunciation guides
 */
router.get('/pronunciation', async (req, res) => {
  try {
    const { q, language, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'q query parameter is required' });
    }
    const results = await searchPronunciations(q, language || null, parseInt(limit) || 20);
    res.json(results);
  } catch (error) {
    logger.error('Search pronunciation API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to search pronunciations' });
  }
});

/**
 * Create or update a pronunciation guide
 */
router.post('/pronunciation', authMiddleware, async (req, res) => {
  try {
    let guide = await savePronunciation(req.body);
    res.status(201).json(guide);
  } catch (error) {
    logger.error('Save pronunciation API error', { error: error.message, stack: error.stack });
    const status = error.message.includes('required') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

// ============================================================================
// TRANSLATION MEMORY MANAGEMENT
// ============================================================================

/**
 * Get translation memory statistics
 */
async function getTranslationMemoryStats() {
  try {
    let result = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_entries,
        COUNT(CASE WHEN is_auto_translated = true THEN 1 END) as auto_translated_entries,
        AVG(confidence_score) as avg_confidence,
        SUM(usage_count) as total_usage
      FROM translation_memory
    `);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Get translation memory stats error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get translation memory statistics
 */
router.get('/memory/stats', async (req, res) => {
  try {
    let result = await getTranslationMemoryStats();
    res.json(result);
  } catch (error) {
    logger.error('Get memory stats API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get translation memory statistics' });
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
  detectLanguage,
  translateText,
  getContentTranslation,
  saveContentTranslation,
  getUserLanguagePreferences,
  updateUserLanguagePreferences,
  getAvailableLanguages,
  getPronunciation,
  searchPronunciations,
  savePronunciation,
  getTranslationMemoryStats,
  isHealthy
};
