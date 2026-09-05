// Controller for Dairy Management (M071) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Dairy herd CRUD
async function registerDairyHerd(req, res) {
  try {
    const herd = await service.registerDairyHerd(req.body);
    res.status(201).json({ success: true, data: herd });
  } catch (error) {
    logger.error('registerDairyHerd error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getDairyHerd(req, res) {
  try {
    let herd = await service.getDairyHerd(req.params.herdId);
    if (!herd) return res.status(404).json({ success: false, error: 'Herd not found' });
    res.json({ success: true, data: herd });
  } catch (error) {
    logger.error('getDairyHerd error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listDairyHerds(req, res) {
  try {
    const { page, limit, farmId, breed, status } = req.query;
    const result = await service.listDairyHerds({ page, limit, farmId, breed, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listDairyHerds error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateDairyHerd(req, res) {
  try {
    let herd = await service.updateDairyHerd(req.params.herdId, req.body);
    if (!herd) return res.status(404).json({ success: false, error: 'Herd not found' });
    res.json({ success: true, data: herd });
  } catch (error) {
    logger.error('updateDairyHerd error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered analysis
async function analyzeMilkProduction(req, res) {
  try {
    const analysis = await service.analyzeMilkProduction(req.params.herdId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('analyzeMilkProduction error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Milk quality
async function recordMilkQuality(req, res) {
  try {
    const quality = await service.recordMilkQuality(req.body);
    res.status(201).json({ success: true, data: quality });
  } catch (error) {
    logger.error('recordMilkQuality error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getMilkQualityHistory(req, res) {
  try {
    const { herdId, startDate, endDate, limit } = req.query;
    const history = await service.getMilkQualityHistory(herdId, { startDate, endDate, limit });
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('getMilkQualityHistory error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getDairyAnalytics(req, res) {
  try {
    const { startDate, endDate, farmId } = req.query;
    const analytics = await service.getDairyAnalytics({ startDate, endDate, farmId });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getDairyAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  registerDairyHerd,
  getDairyHerd,
  listDairyHerds,
  updateDairyHerd,
  analyzeMilkProduction,
  recordMilkQuality,
  getMilkQualityHistory,
  getDairyAnalytics,
};
