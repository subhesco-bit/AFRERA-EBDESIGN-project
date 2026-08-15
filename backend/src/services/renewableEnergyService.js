/**
 * Renewable Energy Systems Service
 * 
 * Wires the existing `renewable_energy_systems` table (migration 041) to application logic
 * Implements REOS Rural Life OS component for renewable energy infrastructure
 */

'use strict';

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get renewable energy system by ID
 * @param {string} systemId - System ID
 * @returns {Promise<Object>} System details
 */
async function getRenewableEnergySystem(systemId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM renewable_energy_systems WHERE system_id = $1`,
      [systemId]
    );
    
    if (!rows.length) {
      throw new Error(`Renewable energy system not found: ${systemId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get renewable energy system: ${error.message}`);
    throw error;
  }
}

/**
 * Get renewable energy systems by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Array>} Renewable energy systems
 */
async function getRenewableEnergySystemsByVillage(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM renewable_energy_systems WHERE village_id = $1 ORDER BY installation_date DESC`,
      [villageId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get renewable energy systems by village: ${error.message}`);
    throw error;
  }
}

/**
 * Get renewable energy systems by type
 * @param {string} energyType - Energy type (solar, wind, biomass, biogas, micro_hydro)
 * @returns {Promise<Array>} Renewable energy systems
 */
async function getRenewableEnergySystemsByType(energyType) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM renewable_energy_systems WHERE energy_type = $1 ORDER by installation_date DESC`,
      [energyType]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get renewable energy systems by type: ${error.message}`);
    throw error;
  }
}

/**
 * Create new renewable energy system
 * @param {Object} system - System data
 * @returns {Promise<Object>} Created system
 */
async function createRenewableEnergySystem(system) {
  try {
    const {
      system_id,
      village_id,
      district,
      energy_type,
      capacity_kw,
      installation_date,
      owner_type,
      owner_id,
      technology_provider,
      funding_source,
      grid_connected,
      storage_capacity_kwh,
      annual_generation_kwh,
      maintenance_schedule,
      status
    } = system;

    const { rows } = await pool.query(
      `INSERT INTO renewable_energy_systems 
        (system_id, village_id, district, energy_type, capacity_kw,
         installation_date, owner_type, owner_id, technology_provider,
         funding_source, grid_connected, storage_capacity_kwh,
         annual_generation_kwh, maintenance_schedule, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
       RETURNING *`,
      [system_id, village_id, district, energy_type, capacity_kw,
       installation_date, owner_type, owner_id, technology_provider,
       funding_source, grid_connected, storage_capacity_kwh,
       annual_generation_kwh, maintenance_schedule, status]
    );

    logger.info(`Renewable energy system created: ${system_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to create renewable energy system: ${error.message}`);
    throw error;
  }
}

/**
 * Update renewable energy system
 * @param {string} systemId - System ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated system
 */
async function updateRenewableEnergySystem(systemId, updates) {
  try {
    const allowedFields = [
      'capacity_kw', 'owner_type', 'owner_id', 'technology_provider',
      'funding_source', 'grid_connected', 'storage_capacity_kwh',
      'annual_generation_kwh', 'maintenance_schedule', 'status'
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

    values.push(systemId);

    const query = `
      UPDATE renewable_energy_systems
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE system_id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    
    if (!rows.length) {
      throw new Error(`Renewable energy system not found: ${systemId}`);
    }

    logger.info(`Renewable energy system updated: ${systemId}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to update renewable energy system: ${error.message}`);
    throw error;
  }
}

/**
 * Get renewable energy statistics
 * @param {Object} filters - Optional filters (district, village_id, energy_type, status)
 * @returns {Promise<Object>} Energy statistics
 */
async function getRenewableEnergyStatistics(filters = {}) {
  try {
    const { district, village_id, energy_type, status } = filters;
    
    let query = `
      SELECT 
        COUNT(*) as total_systems,
        COUNT(CASE WHEN status = 'operational' THEN 1 END) as operational_systems,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_systems,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_systems,
        SUM(capacity_kw) as total_capacity_kw,
        AVG(capacity_kw) as avg_capacity_kw,
        SUM(annual_generation_kwh) as total_annual_generation_kwh,
        SUM(storage_capacity_kwh) as total_storage_capacity_kwh
      FROM renewable_energy_systems
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

    if (energy_type) {
      query += ` AND energy_type = $${paramIndex}`;
      params.push(energy_type);
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
      totalSystems: parseInt(stats.total_systems),
      operationalSystems: parseInt(stats.operational_systems),
      maintenanceSystems: parseInt(stats.maintenance_systems),
      inactiveSystems: parseInt(stats.inactive_systems),
      totalCapacityKW: stats.total_capacity_kw ? r2(stats.total_capacity_kw) : 0,
      avgCapacityKW: stats.avg_capacity_kw ? r2(stats.avg_capacity_kw) : 0,
      totalAnnualGenerationKWh: stats.total_annual_generation_kwh ? r2(stats.total_annual_generation_kwh) : 0,
      totalStorageCapacityKWh: stats.total_storage_capacity_kwh ? r2(stats.total_storage_capacity_kwh) : 0
    };
  } catch (error) {
    logger.error(`Failed to get renewable energy statistics: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../middleware/auth');

  router.use(authMiddleware);

  router.get('/systems/:systemId', async (req, res) => {
    try {
      const system = await getRenewableEnergySystem(req.params.systemId);
      res.json({ success: true, data: system });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/systems/village/:villageId', async (req, res) => {
    try {
      const systems = await getRenewableEnergySystemsByVillage(req.params.villageId);
      res.json({ success: true, data: systems });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/systems/type/:energyType', async (req, res) => {
    try {
      const systems = await getRenewableEnergySystemsByType(req.params.energyType);
      res.json({ success: true, data: systems });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/systems', async (req, res) => {
    try {
      const system = await createRenewableEnergySystem(req.body);
      res.status(201).json({ success: true, data: system });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.put('/systems/:systemId', async (req, res) => {
    try {
      const system = await updateRenewableEnergySystem(req.params.systemId, req.body);
      res.json({ success: true, data: system });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.get('/systems/statistics', async (req, res) => {
    try {
      const stats = await getRenewableEnergyStatistics(req.query);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/renewable-energy', router);
  logger.info('Renewable energy routes mounted at /api/v1/renewable-energy');
}

module.exports = {
  getRenewableEnergySystem,
  getRenewableEnergySystemsByVillage,
  getRenewableEnergySystemsByType,
  createRenewableEnergySystem,
  updateRenewableEnergySystem,
  getRenewableEnergyStatistics,
  setupRoutes
};
