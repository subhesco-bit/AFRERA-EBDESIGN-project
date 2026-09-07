// Controller for Goat Management (M073) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

async function registerGoatHerd(req, res) {
  try {
    const herd = await service.registerGoatHerd(req.body);
    res.status(201).json({ success: true, data: herd });
  } catch (error) {
    logger.error('registerGoatHerd error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getGoatHerd(req, res) {
  try {
    const herd = await service.getGoatHerd(req.params.herdId);
    if (!herd) return res.status(404).json({ success: false, error: 'Herd not found' });
    res.json({ success: true, data: herd });
  } catch (error) {
    logger.error('getGoatHerd error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listGoatHerds(req, res) {
  try {
    const { page, limit, farmId, breed, status } = req.query;
    const result = await service.listGoatHerds({ page, limit, farmId, breed, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listGoatHerds error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateGoatHerd(req, res) {
  try {
    const herd = await service.updateGoatHerd(req.params.herdId, req.body);
    if (!herd) return res.status(404).json({ success: false, error: 'Herd not found' });
    res.json({ success: true, data: herd });
  } catch (error) {
    logger.error('updateGoatHerd error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function analyzeGoatProduction(req, res) {
  try {
    const analysis = await service.analyzeGoatProduction(req.params.herdId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('analyzeGoatProduction error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getGoatAnalytics(req, res) {
  try {
    const { startDate, endDate, farmId } = req.query;
    const analytics = await service.getGoatAnalytics({ startDate, endDate, farmId });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getGoatAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  registerGoatHerd,
  getGoatHerd,
  listGoatHerds,
  updateGoatHerd,
  analyzeGoatProduction,
  getGoatAnalytics,
};
