/**
 * AI Advisory Service
 * 
 * Wires the existing `ai_advisories` table (migration 041) to application logic
 * Implements REOS Rural Life OS component for AI-driven agricultural advisories
 */

'use strict';

const pool = require('..\/database\/pool');
const { logger } = require('..\/utils\/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get AI advisory by ID
 * @param {string} advisoryId - Advisory ID
 * @returns {Promise<Object>} Advisory details
 */
async function getAIAdvisory(advisoryId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ai_advisories WHERE advisory_id = $1`,
      [advisoryId]
    );
    
    if (!rows.length) {
      throw new Error(`AI advisory not found: ${advisoryId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get AI advisory: ${error.message}`);
    throw error;
  }
}

/**
 * Get AI advisories by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Array>} Advisories
 */
async function getAIAdvisoriesByVillage(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ai_advisories WHERE village_id = $1 ORDER BY created_at DESC`,
      [villageId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get AI advisories by village: ${error.message}`);
    throw error;
  }
}

/**
 * Get AI advisories by farmer
 * @param {string} farmerId - Farmer ID
 * @returns {Promise<Array>} Advisories
 */
async function getAIAdvisoriesByFarmer(farmerId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ai_advisories WHERE farmer_id = $1 ORDER BY created_at DESC`,
      [farmerId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get AI advisories by farmer: ${error.message}`);
    throw error;
  }
}

/**
 * Get AI advisories by type
 * @param {string} advisoryType - Advisory type
 * @returns {Promise<Array>} Advisories
 */
async function getAIAdvisoriesByType(advisoryType) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ai_advisories WHERE advisory_type = $1 ORDER BY created_at DESC`,
      [advisoryType]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get AI advisories by type: ${error.message}`);
    throw error;
  }
}

/**
 * Create new AI advisory
 * @param {Object} advisory - Advisory data
 * @returns {Promise<Object>} Created advisory
 */
async function createAIAdvisory(advisory) {
  try {
    const {
      advisory_id,
      village_id,
      district,
      farmer_id,
      advisory_type,
      crop_id,
      priority_level,
      title,
      description,
      recommended_action,
      confidence_score,
      data_sources,
      valid_until,
      status
    } = advisory;

    const { rows } = await pool.query(
      `INSERT INTO ai_advisories 
        (advisory_id, village_id, district, farmer_id, advisory_type,
         crop_id, priority_level, title, description, recommended_action,
         confidence_score, data_sources, valid_until, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
       RETURNING *`,
      [advisory_id, village_id, district, farmer_id, advisory_type,
       crop_id, priority_level, title, description, recommended_action,
       confidence_score, data_sources, valid_until, status]
    );

    logger.info(`AI advisory created: ${advisory_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to create AI advisory: ${error.message}`);
    throw error;
  }
}

/**
 * Update AI advisory status
 * @param {string} advisoryId - Advisory ID
 * @param {string} status - New status
 * @param {string} feedback - Optional feedback
 * @returns {Promise<Object>} Updated advisory
 */
async function updateAdvisoryStatus(advisoryId, status, feedback) {
  try {
    const { rows } = await pool.query(
      `UPDATE ai_advisories
       SET status = $1,
           feedback = $2,
           updated_at = NOW()
       WHERE advisory_id = $3
       RETURNING *`,
      [status, feedback, advisoryId]
    );
    
    if (!rows.length) {
      throw new Error(`AI advisory not found: ${advisoryId}`);
    }

    logger.info(`AI advisory status updated: ${advisoryId}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to update advisory status: ${error.message}`);
    throw error;
  }
}

/**
 * Get AI advisory statistics
 * @param {Object} filters - Optional filters (district, village_id, advisory_type, status)
 * @returns {Promise<Object>} Advisory statistics
 */
async function getAIAdvisoryStatistics(filters = {}) {
  try {
    const { district, village_id, advisory_type, status } = filters;
    
    let query = `
      SELECT 
        COUNT(*) as total_advisories,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_advisories,
        COUNT(CASE WHEN status = 'acknowledged' THEN 1 END) as acknowledged_advisories,
        COUNT(CASE WHEN status = 'actioned' THEN 1 END) as actioned_advisories,
        COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_advisories,
        AVG(confidence_score) as avg_confidence_score,
        COUNT(CASE WHEN priority_level = 'high' THEN 1 END) as high_priority_count,
        COUNT(CASE WHEN priority_level = 'medium' THEN 1 END) as medium_priority_count,
        COUNT(CASE WHEN priority_level = 'low' THEN 1 END) as low_priority_count
      FROM ai_advisories
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND district = $${paramIndex}`;
      params.push(district);
      paramIndex++;
    }

    if (village_id) {
      query += ` AND village_id = $${paramIndex}`;
      params.push(village_id);
      paramIndex++;
    }

    if (advisory_type) {
      query += ` AND advisory_type = $${paramIndex}`;
      params.push(advisory_type);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const { rows } = await pool.query(query, params);
    const stats = rows[0];

    return {
      totalAdvisories: parseInt(stats.total_advisories),
      pendingAdvisories: parseInt(stats.pending_advisories),
      acknowledgedAdvisories: parseInt(stats.acknowledged_advisories),
      actionedAdvisories: parseInt(stats.actioned_advisories),
      dismissedAdvisories: parseInt(stats.dismissed_advisories),
      avgConfidenceScore: stats.avg_confidence_score ? r2(stats.avg_confidence_score) : 0,
      highPriorityCount: parseInt(stats.high_priority_count),
      mediumPriorityCount: parseInt(stats.medium_priority_count),
      lowPriorityCount: parseInt(stats.low_priority_count)
    };
  } catch (error) {
    logger.error(`Failed to get AI advisory statistics: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('..\/middleware\/auth');

  router.use(authMiddleware);

  router.get('/advisories/:advisoryId', async (req, res) => {
    try {
      const advisory = await getAIAdvisory(req.params.advisoryId);
      res.json({ success: true, data: advisory });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/advisories/village/:villageId', async (req, res) => {
    try {
      const advisories = await getAIAdvisoriesByVillage(req.params.villageId);
      res.json({ success: true, data: advisories });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/advisories/farmer/:farmerId', async (req, res) => {
    try {
      let advisories = await getAIAdvisoriesByFarmer(req.params.farmerId);
      res.json({ success: true, data: advisories });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/advisories/type/:advisoryType', async (req, res) => {
    try {
      let advisories = await getAIAdvisoriesByType(req.params.advisoryType);
      res.json({ success: true, data: advisories });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/advisories', async (req, res) => {
    try {
      let advisory = await createAIAdvisory(req.body);
      res.status(201).json({ success: true, data: advisory });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.put('/advisories/:advisoryId/status', async (req, res) => {
    try {
      const { status, feedback } = req.body;
      let advisory = await updateAdvisoryStatus(req.params.advisoryId, status, feedback);
      res.json({ success: true, data: advisory });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.get('/advisories/statistics', async (req, res) => {
    try {
      let stats = await getAIAdvisoryStatistics(req.query);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/ai-advisories', router);
  logger.info('AI advisory routes mounted at /api/v1/ai-advisories');
}

module.exports = {
  getAIAdvisory,
  getAIAdvisoriesByVillage,
  getAIAdvisoriesByFarmer,
  getAIAdvisoriesByType,
  createAIAdvisory,
  updateAdvisoryStatus,
  getAIAdvisoryStatistics,
  setupRoutes
};


