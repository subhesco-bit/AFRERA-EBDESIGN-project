/**
 * Buying Club Service
 * 
 * Wires the existing `buying_clubs` table (migration 042) to application logic
 * Implements REOS Missing Layer 1.10-1.11: Group Buying / Community Buying
 */

'use strict';

const pool = require('../../database\/pool');
const { logger } = require('../../utils\/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get buying club by ID
 * @param {string} clubId - Buying club ID
 * @returns {Promise<Object>} Buying club details
 */
async function getBuyingClub(clubId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM buying_clubs WHERE club_id = $1`,
      [clubId]
    );
    
    if (!rows.length) {
      throw new Error(`Buying club not found: ${clubId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get buying club: ${error.message}`);
    throw error;
  }
}

/**
 * Get buying clubs by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Array>} Buying clubs
 */
async function getBuyingClubsByVillage(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM buying_clubs WHERE village_id = $1 ORDER BY club_name`,
      [villageId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get buying clubs by village: ${error.message}`);
    throw error;
  }
}

/**
 * Get buying clubs by district
 * @param {string} district - District name
 * @returns {Promise<Array>} Buying clubs
 */
async function getBuyingClubsByDistrict(district) {
  try {
    const { rows } = await pool.query(
      `SELECT bc.*, vp.village_name 
       FROM buying_clubs bc
       LEFT JOIN village_profiles vp ON bc.village_id = vp.village_id
       WHERE vp.district = $1
       ORDER BY bc.club_name`,
      [district]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get buying clubs by district: ${error.message}`);
    throw error;
  }
}

/**
 * Create new buying club
 * @param {Object} club - Buying club data
 * @returns {Promise<Object>} Created buying club
 */
async function createBuyingClub(club) {
  try {
    const {
      club_id,
      club_name,
      village_id,
      district,
      club_type,
      leader_id,
      member_count,
      founding_date,
      description,
      contact_phone,
      preferred_products,
      procurement_frequency
    } = club;

    const { rows } = await pool.query(
      `INSERT INTO buying_clubs 
        (club_id, club_name, village_id, district, club_type, leader_id,
         member_count, founding_date, description, contact_phone,
         preferred_products, procurement_frequency, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', NOW())
       RETURNING *`,
      [club_id, club_name, village_id, district, club_type, leader_id,
       member_count, founding_date, description, contact_phone,
       preferred_products, procurement_frequency]
    );

    logger.info(`Buying club created: ${club_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to create buying club: ${error.message}`);
    throw error;
  }
}

/**
 * Update buying club
 * @param {string} clubId - Buying club ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated buying club
 */
async function updateBuyingClub(clubId, updates) {
  try {
    const allowedFields = [
      'club_name', 'club_type', 'leader_id', 'member_count',
      'description', 'contact_phone', 'preferred_products',
      'procurement_frequency', 'status'
    ];
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(clubId);

    const query = `
      UPDATE buying_clubs
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE club_id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    
    if (!rows.length) {
      throw new Error(`Buying club not found: ${clubId}`);
    }

    logger.info(`Buying club updated: ${clubId}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to update buying club: ${error.message}`);
    throw error;
  }
}

/**
 * Add member to buying club
 * @param {string} clubId - Buying club ID
 * @param {string} memberId - Member (farmer) ID
 * @param {string} role - Member role
 * @returns {Promise<Object>} Updated buying club
 */
async function addMemberToClub(clubId, memberId, role = 'member') {
  try {
    const { rows } = await pool.query(
      `UPDATE buying_clubs
       SET member_count = member_count + 1,
           updated_at = NOW()
       WHERE club_id = $1
       RETURNING *`,
      [clubId]
    );
    
    if (!rows.length) {
      throw new Error(`Buying club not found: ${clubId}`);
    }

    logger.info(`Member added to buying club: ${clubId}, member: ${memberId}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to add member to buying club: ${error.message}`);
    throw error;
  }
}

/**
 * Create group buying order
 * @param {Object} order - Group buying order data
 * @returns {Promise<Object>} Created order
 */
async function createGroupBuyingOrder(order) {
  try {
    const {
      order_id,
      club_id,
      product_id,
      total_quantity,
      price_per_unit,
      delivery_address,
      delivery_date,
      notes
    } = order;

    const total_amount = total_quantity * price_per_unit;

    const { rows } = await pool.query(
      `INSERT INTO group_buying_orders 
        (order_id, club_id, product_id, total_quantity, price_per_unit,
         total_amount, delivery_address, delivery_date, status, created_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), $9)
       RETURNING *`,
      [order_id, club_id, product_id, total_quantity, price_per_unit,
       total_amount, delivery_address, delivery_date, notes]
    );

    logger.info(`Group buying order created: ${order_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to create group buying order: ${error.message}`);
    throw error;
  }
}

/**
 * Get group buying orders by club
 * @param {string} clubId - Buying club ID
 * @returns {Promise<Array>} Group buying orders
 */
async function getGroupBuyingOrdersByClub(clubId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM group_buying_orders 
       WHERE club_id = $1 
       ORDER BY created_at DESC`,
      [clubId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get group buying orders by club: ${error.message}`);
    throw error;
  }
}

/**
 * Get buying club statistics
 * @param {Object} filters - Optional filters (district, village_id, status)
 * @returns {Promise<Object>} Buying club statistics
 */
async function getBuyingClubStatistics(filters = {}) {
  try {
    const { district, village_id, status } = filters;
    
    let query = `
      SELECT 
        COUNT(*) as total_clubs,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clubs,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_clubs,
        SUM(member_count) as total_members,
        AVG(member_count) as avg_members_per_club
      FROM buying_clubs
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

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const { rows } = await pool.query(query, params);
    const stats = rows[0];

    return {
      totalClubs: parseInt(stats.total_clubs),
      activeClubs: parseInt(stats.active_clubs),
      inactiveClubs: parseInt(stats.inactive_clubs),
      totalMembers: stats.total_members ? parseInt(stats.total_members) : 0,
      avgMembersPerClub: stats.avg_members_per_club ? r2(stats.avg_members_per_club) : 0
    };
  } catch (error) {
    logger.error(`Failed to get buying club statistics: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../../middleware\/auth');

  router.use(authMiddleware);

  router.get('/clubs/:clubId', async (req, res) => {
    try {
      const club = await getBuyingClub(req.params.clubId);
      res.json({ success: true, data: club });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/clubs/village/:villageId', async (req, res) => {
    try {
      const clubs = await getBuyingClubsByVillage(req.params.villageId);
      res.json({ success: true, data: clubs });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/clubs/district/:district', async (req, res) => {
    try {
      let clubs = await getBuyingClubsByDistrict(req.params.district);
      res.json({ success: true, data: clubs });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/clubs', async (req, res) => {
    try {
      let club = await createBuyingClub(req.body);
      res.status(201).json({ success: true, data: club });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.put('/clubs/:clubId', async (req, res) => {
    try {
      let club = await updateBuyingClub(req.params.clubId, req.body);
      res.json({ success: true, data: club });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.post('/clubs/:clubId/members', async (req, res) => {
    try {
      const { memberId, role } = req.body;
      let club = await addMemberToClub(req.params.clubId, memberId, role);
      res.json({ success: true, data: club });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.post('/orders', async (req, res) => {
    try {
      const order = await createGroupBuyingOrder(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.get('/orders/club/:clubId', async (req, res) => {
    try {
      const orders = await getGroupBuyingOrdersByClub(req.params.clubId);
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/clubs/statistics', async (req, res) => {
    try {
      let stats = await getBuyingClubStatistics(req.query);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/buying-clubs', router);
  logger.info('Buying club routes mounted at /api/v1/buying-clubs');
}

module.exports = {
  getBuyingClub,
  getBuyingClubsByVillage,
  getBuyingClubsByDistrict,
  createBuyingClub,
  updateBuyingClub,
  addMemberToClub,
  createGroupBuyingOrder,
  getGroupBuyingOrdersByClub,
  getBuyingClubStatistics,
  setupRoutes
};



