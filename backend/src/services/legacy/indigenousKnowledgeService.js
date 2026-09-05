/**
 * Indigenous Knowledge Platform Service
 * CAP-209 to CAP-216: Traditional Recipes, Traditional Medicine, Indigenous Farming, 
 * Oral History, Tribal Knowledge, Documentation System, Protection System, IP Management
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../utils/logger');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { PLATFORM_STAFF_ROLES } = require('../../middleware/roleGroups');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../database/pool');

// ============================================================================
// TRADITIONAL RECIPES DATABASE (CAP-209)
// ============================================================================

/**
 * Create a traditional recipe entry
 */
router.post('/traditional-recipes', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      indigenous_community,
      region,
      ingredients,
      preparation_method,
      cultural_significance,
      seasonal_relevance,
      nutritional_info,
      media_files,
      contributor_id,
      verified_by
    } = req.body;

    const result = await pool.query(
      `INSERT INTO traditional_recipes 
       (name, indigenous_community, region, ingredients, preparation_method, 
        cultural_significance, seasonal_relevance, nutritional_info, media_files, 
        contributor_id, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        name, indigenous_community, region, JSON.stringify(ingredients),
        preparation_method, cultural_significance, seasonal_relevance,
        JSON.stringify(nutritional_info), JSON.stringify(media_files),
        contributor_id, verified_by
      ]
    );

    logger.info(`Traditional recipe created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create traditional recipe error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create traditional recipe' });
  }
});

/**
 * Get traditional recipes with filters
 */
router.get('/traditional-recipes', authMiddleware, async (req, res) => {
  try {
    const { community, region, season, search } = req.query;
    
    let query = 'SELECT * FROM traditional_recipes WHERE is_verified = true';
    const params = [];
    let paramCount = 0;

    if (community) {
      paramCount++;
      query += ` AND indigenous_community = $${paramCount}`;
      params.push(community);
    }

    if (region) {
      paramCount++;
      query += ` AND region = $${paramCount}`;
      params.push(region);
    }

    if (season) {
      paramCount++;
      query += ` AND seasonal_relevance @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([season]));
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR cultural_significance ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get traditional recipes error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get traditional recipes' });
  }
});

/**
 * Get traditional recipe by ID
 */
router.get('/traditional-recipes/:id', authMiddleware, async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT * FROM traditional_recipes WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Traditional recipe not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get traditional recipe error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get traditional recipe' });
  }
});

// ============================================================================
// TRADITIONAL MEDICINE DATABASE (CAP-210)
// ============================================================================

/**
 * Create a traditional medicine entry
 */
router.post('/traditional-medicine', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      indigenous_community,
      region,
      medicinal_plants,
      preparation_method,
      traditional_uses,
      dosage,
      contraindications,
      scientific_validation,
      practitioner_notes,
      media_files,
      contributor_id,
      verified_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO traditional_medicine 
       (name, indigenous_community, region, medicinal_plants, preparation_method, 
        traditional_uses, dosage, contraindications, scientific_validation, 
        practitioner_notes, media_files, contributor_id, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        name, indigenous_community, region, JSON.stringify(medicinal_plants),
        preparation_method, JSON.stringify(traditional_uses), dosage,
        contraindications, JSON.stringify(scientific_validation),
        practitioner_notes, JSON.stringify(media_files), contributor_id, verified_by
      ]
    );

    logger.info(`Traditional medicine created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create traditional medicine error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create traditional medicine' });
  }
});

/**
 * Get traditional medicines with filters
 */
router.get('/traditional-medicine', authMiddleware, async (req, res) => {
  try {
    const { community, region, ailment, search } = req.query;
    
    let query = 'SELECT * FROM traditional_medicine WHERE is_verified = true';
    let params = [];
    let paramCount = 0;

    if (community) {
      paramCount++;
      query += ` AND indigenous_community = $${paramCount}`;
      params.push(community);
    }

    if (region) {
      paramCount++;
      query += ` AND region = $${paramCount}`;
      params.push(region);
    }

    if (ailment) {
      paramCount++;
      query += ` AND traditional_uses @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([ailment]));
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR medicinal_plants::text ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get traditional medicine error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get traditional medicine' });
  }
});

// ============================================================================
// INDIGENOUS FARMING DATABASE (CAP-211)
// ============================================================================

/**
 * Create indigenous farming practice entry
 */
router.post('/indigenous-farming', authMiddleware, async (req, res) => {
  try {
    const {
      practice_name,
      indigenous_community,
      region,
      crops,
      techniques,
      seasonal_calendar,
      soil_management,
      water_management,
      pest_management,
      climate_adaptation,
      cultural_context,
      modern_applications,
      media_files,
      contributor_id,
      verified_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO indigenous_farming_practices 
       (practice_name, indigenous_community, region, crops, techniques, 
        seasonal_calendar, soil_management, water_management, pest_management, 
        climate_adaptation, cultural_context, modern_applications, media_files, 
        contributor_id, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
       RETURNING *`,
      [
        practice_name, indigenous_community, region, JSON.stringify(crops),
        JSON.stringify(techniques), JSON.stringify(seasonal_calendar),
        soil_management, water_management, pest_management,
        climate_adaptation, cultural_context, JSON.stringify(modern_applications),
        JSON.stringify(media_files), contributor_id, verified_by
      ]
    );

    logger.info(`Indigenous farming practice created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create indigenous farming practice error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create indigenous farming practice' });
  }
});

/**
 * Get indigenous farming practices
 */
router.get('/indigenous-farming', authMiddleware, async (req, res) => {
  try {
    const { community, region, crop, technique } = req.query;
    
    let query = 'SELECT * FROM indigenous_farming_practices WHERE is_verified = true';
    let params = [];
    let paramCount = 0;

    if (community) {
      paramCount++;
      query += ` AND indigenous_community = $${paramCount}`;
      params.push(community);
    }

    if (region) {
      paramCount++;
      query += ` AND region = $${paramCount}`;
      params.push(region);
    }

    if (crop) {
      paramCount++;
      query += ` AND crops @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([crop]));
    }

    if (technique) {
      paramCount++;
      query += ` AND techniques @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([technique]));
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get indigenous farming practices error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get indigenous farming practices' });
  }
});

// ============================================================================
// ORAL HISTORY DATABASE (CAP-212)
// ============================================================================

/**
 * Create oral history entry
 */
router.post('/oral-history', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      indigenous_community,
      region,
      narrator,
      narrator_age,
      narrator_role,
      recording_date,
      language,
    transcript,
      summary,
      topics,
      historical_period,
      cultural_significance,
      audio_file,
      video_file,
      contributor_id,
      verified_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO oral_history 
       (title, indigenous_community, region, narrator, narrator_age, narrator_role, 
        recording_date, language, transcript, summary, topics, historical_period, 
        cultural_significance, audio_file, video_file, contributor_id, verified_by, 
        created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
       RETURNING *`,
      [
        title, indigenous_community, region, narrator, narrator_age, narrator_role,
        recording_date, language, transcript, summary, JSON.stringify(topics),
        historical_period, cultural_significance, audio_file, video_file,
        contributor_id, verified_by
      ]
    );

    logger.info(`Oral history created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create oral history error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create oral history' });
  }
});

/**
 * Get oral history entries
 */
router.get('/oral-history', authMiddleware, async (req, res) => {
  try {
    const { community, region, topic, period } = req.query;
    
    let query = 'SELECT * FROM oral_history WHERE is_verified = true';
    let params = [];
    let paramCount = 0;

    if (community) {
      paramCount++;
      query += ` AND indigenous_community = $${paramCount}`;
      params.push(community);
    }

    if (region) {
      paramCount++;
      query += ` AND region = $${paramCount}`;
      params.push(region);
    }

    if (topic) {
      paramCount++;
      query += ` AND topics @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([topic]));
    }

    if (period) {
      paramCount++;
      query += ` AND historical_period = $${paramCount}`;
      params.push(period);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get oral history error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get oral history' });
  }
});

// ============================================================================
// TRIBAL KNOWLEDGE DATABASE (CAP-213)
// ============================================================================

/**
 * Create tribal knowledge entry
 */
router.post('/tribal-knowledge', authMiddleware, async (req, res) => {
  try {
    const {
      knowledge_type,
      indigenous_community,
      region,
      title,
      description,
      knowledge_holders,
      transmission_method,
      restrictions,
      applications,
      cross_references,
      media_files,
      contributor_id,
      verified_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO tribal_knowledge 
       (knowledge_type, indigenous_community, region, title, description, 
        knowledge_holders, transmission_method, restrictions, applications, 
        cross_references, media_files, contributor_id, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        knowledge_type, indigenous_community, region, title, description,
        JSON.stringify(knowledge_holders), transmission_method, restrictions,
        JSON.stringify(applications), JSON.stringify(cross_references),
        JSON.stringify(media_files), contributor_id, verified_by
      ]
    );

    logger.info(`Tribal knowledge created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create tribal knowledge error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create tribal knowledge' });
  }
});

/**
 * Get tribal knowledge entries
 */
router.get('/tribal-knowledge', authMiddleware, async (req, res) => {
  try {
    const { community, region, type, search } = req.query;
    
    let query = 'SELECT * FROM tribal_knowledge WHERE is_verified = true';
    let params = [];
    let paramCount = 0;

    if (community) {
      paramCount++;
      query += ` AND indigenous_community = $${paramCount}`;
      params.push(community);
    }

    if (region) {
      paramCount++;
      query += ` AND region = $${paramCount}`;
      params.push(region);
    }

    if (type) {
      paramCount++;
      query += ` AND knowledge_type = $${paramCount}`;
      params.push(type);
    }

    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get tribal knowledge error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get tribal knowledge' });
  }
});

// ============================================================================
// DOCUMENTATION SYSTEM (CAP-214)
// ============================================================================

/**
 * Create documentation record
 */
router.post('/documentation', authMiddleware, async (req, res) => {
  try {
    const {
      knowledge_id,
      knowledge_type,
      documentation_type,
      document_format,
      content,
      metadata,
      location,
      access_level,
      contributors,
      reviewed_by,
      approved_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO indigenous_documentation 
       (knowledge_id, knowledge_type, documentation_type, document_format, 
        content, metadata, location, access_level, contributors, reviewed_by, 
        approved_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        knowledge_id, knowledge_type, documentation_type, document_format,
        content, JSON.stringify(metadata), location, access_level,
        JSON.stringify(contributors), reviewed_by, approved_by
      ]
    );

    logger.info(`Documentation created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create documentation error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create documentation' });
  }
});

/**
 * Get documentation records
 */
router.get('/documentation', authMiddleware, async (req, res) => {
  try {
    const { knowledge_type, access_level, format } = req.query;
    
    let query = 'SELECT * FROM indigenous_documentation WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (knowledge_type) {
      paramCount++;
      query += ` AND knowledge_type = $${paramCount}`;
      params.push(knowledge_type);
    }

    if (access_level) {
      paramCount++;
      query += ` AND access_level = $${paramCount}`;
      params.push(access_level);
    }

    if (format) {
      paramCount++;
      query += ` AND document_format = $${paramCount}`;
      params.push(format);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get documentation error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get documentation' });
  }
});

// ============================================================================
// PROTECTION SYSTEM (CAP-215)
// ============================================================================

/**
 * Create protection request
 */
router.post('/protection', authMiddleware, async (req, res) => {
  try {
    const {
      knowledge_id,
      knowledge_type,
      protection_type,
      reason,
      requested_by,
      community_consent,
      legal_basis,
      scope,
      duration,
      conditions
    } = req.body;

    let result = await pool.query(
      `INSERT INTO indigenous_protection 
       (knowledge_id, knowledge_type, protection_type, reason, requested_by, 
        community_consent, legal_basis, scope, duration, conditions, 
        status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW(), NOW())
       RETURNING *`,
      [
        knowledge_id, knowledge_type, protection_type, reason, requested_by,
        community_consent, legal_basis, scope, duration, JSON.stringify(conditions)
      ]
    );

    logger.info(`Protection request created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create protection request error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create protection request' });
  }
});

/**
 * Update protection status
 */
router.put('/protection/:id/status', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const { status, reviewed_by, notes } = req.body;

    let result = await pool.query(
      `UPDATE indigenous_protection 
       SET status = $1, reviewed_by = $2, review_notes = $3, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, reviewed_by, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Protection request not found' });
    }

    logger.info(`Protection status updated: ${req.params.id} to ${status}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update protection status error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update protection status' });
  }
});

/**
 * Get protection requests
 */
router.get('/protection', authMiddleware, async (req, res) => {
  try {
    const { status, knowledge_type, requested_by } = req.query;
    
    let query = 'SELECT * FROM indigenous_protection WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (knowledge_type) {
      paramCount++;
      query += ` AND knowledge_type = $${paramCount}`;
      params.push(knowledge_type);
    }

    if (requested_by) {
      paramCount++;
      query += ` AND requested_by = $${paramCount}`;
      params.push(requested_by);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get protection requests error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get protection requests' });
  }
});

// ============================================================================
// IP MANAGEMENT (CAP-216)
// ============================================================================

/**
 * Create IP registration
 */
router.post('/ip-management', authMiddleware, async (req, res) => {
  try {
    const {
      knowledge_id,
      knowledge_type,
      ip_type,
      registration_type,
      indigenous_community,
      ownership_structure,
      commercial_rights,
      licensing_terms,
      benefit_sharing,
      prior_informed_consent,
      legal_protection_status,
      expiry_date,
      jurisdiction
    } = req.body;

    let result = await pool.query(
      `INSERT INTO indigenous_ip_management 
       (knowledge_id, knowledge_type, ip_type, registration_type, indigenous_community, 
        ownership_structure, commercial_rights, licensing_terms, benefit_sharing, 
        prior_informed_consent, legal_protection_status, expiry_date, jurisdiction, 
        created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        knowledge_id, knowledge_type, ip_type, registration_type,
        indigenous_community, JSON.stringify(ownership_structure),
        JSON.stringify(commercial_rights), JSON.stringify(licensing_terms),
        JSON.stringify(benefit_sharing), prior_informed_consent,
        legal_protection_status, expiry_date, jurisdiction
      ]
    );

    logger.info(`IP registration created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create IP registration error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create IP registration' });
  }
});

/**
 * Get IP registrations
 */
router.get('/ip-management', authMiddleware, async (req, res) => {
  try {
    const { community, ip_type, status } = req.query;
    
    let query = 'SELECT * FROM indigenous_ip_management WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (community) {
      paramCount++;
      query += ` AND indigenous_community = $${paramCount}`;
      params.push(community);
    }

    if (ip_type) {
      paramCount++;
      query += ` AND ip_type = $${paramCount}`;
      params.push(ip_type);
    }

    if (status) {
      paramCount++;
      query += ` AND legal_protection_status = $${paramCount}`;
      params.push(status);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get IP registrations error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get IP registrations' });
  }
});

/**
 * Update IP registration
 */
router.put('/ip-management/:id', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const {
      legal_protection_status, licensing_terms, benefit_sharing, expiry_date
    } = req.body;

    let result = await pool.query(
      `UPDATE indigenous_ip_management 
       SET legal_protection_status = COALESCE($1, legal_protection_status),
           licensing_terms = COALESCE($2, licensing_terms),
           benefit_sharing = COALESCE($3, benefit_sharing),
           expiry_date = COALESCE($4, expiry_date),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        legal_protection_status,
        licensing_terms ? JSON.stringify(licensing_terms) : null,
        benefit_sharing ? JSON.stringify(benefit_sharing) : null,
        expiry_date,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IP registration not found' });
    }

    logger.info(`IP registration updated: ${req.params.id}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update IP registration error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update IP registration' });
  }
});

// Health check
function isHealthy() {
  return true;
}

module.exports = {
  router,
  isHealthy
};
