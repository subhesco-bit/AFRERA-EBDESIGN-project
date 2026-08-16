// Service for M029 - Farmer Health & Welfare
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = 'farmer_health_records';

async function listHealthRecords({ page = 1, limit = 20, farmerId = null } = {}) {
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

async function getHealthRecord(id) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const res = await pg.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

async function createHealthRecord(payload) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const { farmerId, healthType, description, severity, date, metadata } = payload;
  
  const res = await pg.query(
    `INSERT INTO ${tableName} (farmer_id, health_type, description, severity, date, metadata, created_at) 
     VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
    [farmerId, healthType, description, severity, date, JSON.stringify(metadata || {})]
  );
  return res.rows[0];
}

async function updateHealthRecord(id, payload) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const { healthType, description, severity, date, metadata } = payload;
  
  const res = await pg.query(
    `UPDATE ${tableName} 
     SET health_type = $1, description = $2, severity = $3, date = $4, metadata = $5, updated_at = NOW() 
     WHERE id = $6 RETURNING *`,
    [healthType, description, severity, date, JSON.stringify(metadata || {}), id]
  );
  return res.rows[0] || null;
}

async function deleteHealthRecord(id) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const res = await pg.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
  return !!res.rows[0];
}

async function getFarmerHealthSummary(farmerId) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `SELECT 
      health_type,
      COUNT(*) as count,
      AVG(CASE WHEN severity = 'HIGH' THEN 1 WHEN severity = 'MEDIUM' THEN 0.5 ELSE 0 END) as risk_score
     FROM ${tableName} 
     WHERE farmer_id = $1 
     GROUP BY health_type`,
    [farmerId]
  );
  
  return {
    farmerId,
    summary: res.rows,
    totalRecords: res.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
  };
}

async function getWelfarePrograms({ page = 1, limit = 20, eligibility = null } = {}) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  const offset = (page - 1) * limit;
  
  let query = `SELECT COUNT(*) FROM welfare_programs`;
  let countParams = [];
  if (eligibility) {
    query += ' WHERE eligibility = $1';
    countParams = [eligibility];
  }
  const totalRes = await pg.query(query, countParams);
  const total = parseInt(totalRes.rows[0].count || '0');
  
  let dataQuery = `SELECT * FROM welfare_programs`;
  let dataParams = [];
  if (eligibility) {
    dataQuery += ' WHERE eligibility = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    dataParams = [eligibility, limit, offset];
  } else {
    dataQuery += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    dataParams = [limit, offset];
  }
  
  const res = await pg.query(dataQuery, dataParams);
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function enrollWelfareProgram(farmerId, programId) {
  const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `INSERT INTO welfare_enrollments (farmer_id, program_id, enrollment_date, status) 
     VALUES ($1, $2, NOW(), 'PENDING') RETURNING *`,
    [farmerId, programId]
  );
  return res.rows[0];
}

module.exports = {
  listHealthRecords,
  getHealthRecord,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  getFarmerHealthSummary,
  getWelfarePrograms,
  enrollWelfareProgram
};