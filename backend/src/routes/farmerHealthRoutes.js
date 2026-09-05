// Routes for M029 - Farmer Health & Welfare
const express = require('express');
const router = express.Router();
const farmerHealthService = require('../modules/M029/service');
const pool = require('../database/pool');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { resolveFarmerId } = require('../middleware/resolveFarmerId');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEALTH_TYPES = ['GENERAL', 'OCCUPATIONAL', 'CHRONIC', 'EMERGENCY'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'];

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function isValidPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isValidDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validateHealthRecord(req, res, next) {
  const { farmerId, healthType, severity, date, metadata } = req.body || {};
  const errors = [];
  if (req.user.role === 'admin' && req.method === 'POST' && !isValidUuid(farmerId)) errors.push('farmerId must be a valid UUID');
  if (farmerId !== undefined && !isValidUuid(farmerId)) errors.push('farmerId must be a valid UUID');
  if (!HEALTH_TYPES.includes(healthType)) errors.push(`healthType must be one of: ${HEALTH_TYPES.join(', ')}`);
  if (!SEVERITIES.includes(severity)) errors.push(`severity must be one of: ${SEVERITIES.join(', ')}`);
  if (!isValidDate(date)) errors.push('date must be a valid date in YYYY-MM-DD format');
  if (metadata !== undefined && (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata))) errors.push('metadata must be an object');
  if (errors.length) return res.status(400).json({ error: 'Invalid input', details: errors });
  next();
}

function validateRecordId(req, res, next) {
  const id = Number(req.params.id);
  if (!/^\d+$/.test(req.params.id) || !isValidPositiveInteger(id)) return res.status(400).json({ error: 'id must be a positive integer' });
  req.recordId = id;
  next();
}

function validateFarmerId(req, res, next) {
  if (!isValidUuid(req.params.farmerId)) return res.status(400).json({ error: 'farmerId must be a valid UUID' });
  next();
}

function validatePagination(req, res, next) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  if (!isValidPositiveInteger(page) || !isValidPositiveInteger(limit) || limit > 100) return res.status(400).json({ error: 'page and limit must be positive integers; limit must not exceed 100' });
  req.pagination = { page, limit };
  next();
}

function validateEnrollment(req, res, next) {
  const { farmerId, programId } = req.body || {};
  let errors = [];
  if (req.user.role === 'admin' && !isValidUuid(farmerId)) errors.push('farmerId must be a valid UUID');
  if (farmerId !== undefined && !isValidUuid(farmerId)) errors.push('farmerId must be a valid UUID');
  if (!isValidPositiveInteger(Number(programId)) || !/^\d+$/.test(String(programId))) errors.push('programId must be a positive integer');
  if (errors.length) return res.status(400).json({ error: 'Invalid input', details: errors });
  req.enrollment = { farmerId, programId: Number(programId) };
  next();
}

function resolveWriteFarmer(req, res, next) {
  if (req.user.role === 'admin') return next();
  return resolveFarmerId(req, res, next);
}

async function requireRecordOwnership(req, res, next) {
  if (req.user.role === 'admin') return next();
  try {
    const result = await pool.query('SELECT farmer_id FROM farmer_health_records WHERE id = $1', [req.recordId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Health record not found' });
    if (result.rows[0].farmer_id !== req.farmerId) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Health Records Routes
router.get('/health-records', validatePagination, async (req, res) => {
  try {
    const { farmerId } = req.query;
    if (farmerId !== undefined && !isValidUuid(farmerId)) return res.status(400).json({ error: 'farmerId must be a valid UUID' });
    let result = await farmerHealthService.listHealthRecords({ 
      page: req.pagination.page,
      limit: req.pagination.limit,
      farmerId: farmerId || null
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/health-records/:id', validateRecordId, async (req, res) => {
  try {
    const record = await farmerHealthService.getHealthRecord(req.recordId);
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/health-records', authMiddleware, requireRole('farmer', 'admin'), validateHealthRecord, resolveWriteFarmer, async (req, res) => {
  try {
    if (req.user.role === 'farmer') req.body.farmerId = req.farmerId;
    let record = await farmerHealthService.createHealthRecord(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/health-records/:id', authMiddleware, requireRole('farmer', 'admin'), validateRecordId, validateHealthRecord, resolveWriteFarmer, requireRecordOwnership, async (req, res) => {
  try {
    let record = await farmerHealthService.updateHealthRecord(req.recordId, req.body);
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/health-records/:id', authMiddleware, requireRole('farmer', 'admin'), validateRecordId, resolveWriteFarmer, requireRecordOwnership, async (req, res) => {
  try {
    const deleted = await farmerHealthService.deleteHealthRecord(req.recordId);
    if (!deleted) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Farmer Health Summary
router.get('/farmers/:farmerId/health-summary', validateFarmerId, async (req, res) => {
  try {
    const summary = await farmerHealthService.getFarmerHealthSummary(req.params.farmerId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Welfare Programs Routes
router.get('/welfare-programs', validatePagination, async (req, res) => {
  try {
    const { eligibility } = req.query;
    let result = await farmerHealthService.getWelfarePrograms({ 
      page: req.pagination.page,
      limit: req.pagination.limit,
      eligibility 
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/welfare-enrollments', authMiddleware, requireRole('farmer', 'admin'), validateEnrollment, resolveWriteFarmer, async (req, res) => {
  try {
    const { farmerId, programId } = req.enrollment;
    const authorizedFarmerId = req.user.role === 'farmer' ? req.farmerId : farmerId;
    const enrollment = await farmerHealthService.enrollWelfareProgram(
      authorizedFarmerId,
      programId
    );
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;