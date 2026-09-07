// Service for M141 - Orchard Management
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = 'orchards';

async function listOrchards({ page = 1, limit = 20, farmerId = null } = {}) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const offset = (page - 1) * limit;
  
  let query = `SELECT COUNT(*) FROM ${tableName}`;
  let countParams = [];
  if (farmerId) {
    query += ' WHERE farmer_id = $1';
    countParams = [farmerId];
  }
  const totalRes = await pg.query(query, countParams);
  const total = parseInt(totalRes.rows[0].count || '0');
  
  let dataQuery = `SELECT * FROM ${tableName}`;
  let dataParams = [];
  if (farmerId) {
    dataQuery += ' WHERE farmer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    dataParams = [farmerId, limit, offset];
  } else {
    dataQuery += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    dataParams = [limit, offset];
  }
  
  const res = await pg.query(dataQuery, dataParams);
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function getOrchard(id) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const res = await pg.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

async function createOrchard(payload) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const { farmerId, name, location, area, orchardType, treeCount, plantingDate, varieties, soilType, irrigationSystem, metadata } = payload;
  
  const res = await pg.query(
    `INSERT INTO ${tableName} (farmer_id, name, location, area, orchard_type, tree_count, planting_date, varieties, soil_type, irrigation_system, metadata, created_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
    [farmerId, name, location, area, orchardType, treeCount, plantingDate, JSON.stringify(varieties || []), soilType, irrigationSystem, JSON.stringify(metadata || {})]
  );
  return res.rows[0];
}

async function updateOrchard(id, payload) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const { name, location, area, orchardType, treeCount, plantingDate, varieties, soilType, irrigationSystem, metadata } = payload;
  
  const res = await pg.query(
    `UPDATE ${tableName} 
     SET name = $1, location = $2, area = $3, orchard_type = $4, tree_count = $5, planting_date = $6, varieties = $7, soil_type = $8, irrigation_system = $9, metadata = $10, updated_at = NOW() 
     WHERE id = $11 RETURNING *`,
    [name, location, area, orchardType, treeCount, plantingDate, JSON.stringify(varieties || []), soilType, irrigationSystem, JSON.stringify(metadata || {}), id]
  );
  return res.rows[0] || null;
}

async function deleteOrchard(id) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const res = await pg.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
  return !!res.rows[0];
}

async function getOrchardProduction(orchardId, year) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `SELECT * FROM orchard_production WHERE orchard_id = $1 AND production_year = $2`,
    [orchardId, year]
  );
  
  return res.rows[0] || null;
}

async function recordOrchardProduction(payload) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const { orchardId, productionYear, variety, quantity, qualityGrade, harvestDate, revenue, metadata } = payload;
  
  const res = await pg.query(
    `INSERT INTO orchard_production (orchard_id, production_year, variety, quantity, quality_grade, harvest_date, revenue, metadata, created_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
     ON CONFLICT (orchard_id, production_year, variety) 
     DO UPDATE SET quantity = $4, quality_grade = $5, harvest_date = $6, revenue = $7, metadata = $8, updated_at = NOW()
     RETURNING *`,
    [orchardId, productionYear, variety, quantity, qualityGrade, harvestDate, revenue, JSON.stringify(metadata || {})]
  );
  return res.rows[0];
}

async function getOrchardAnalytics(orchardId) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `SELECT 
      production_year,
      variety,
      SUM(quantity) as total_quantity,
      AVG(CASE WHEN quality_grade = 'A' THEN 1 WHEN quality_grade = 'B' THEN 0.8 ELSE 0.6 END) as avg_quality,
      SUM(revenue) as total_revenue
     FROM orchard_production 
     WHERE orchard_id = $1 
     GROUP BY production_year, variety
     ORDER BY production_year DESC, variety`,
    [orchardId]
  );
  
  return {
    orchardId,
    analytics: res.rows,
    totalProduction: res.rows.reduce((sum, row) => sum + parseFloat(row.total_quantity), 0),
    totalRevenue: res.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0)
  };
}

module.exports = {
  listOrchards,
  getOrchard,
  createOrchard,
  updateOrchard,
  deleteOrchard,
  getOrchardProduction,
  recordOrchardProduction,
  getOrchardAnalytics
};