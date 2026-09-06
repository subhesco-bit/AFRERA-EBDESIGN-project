// Controller for Poultry Management (M072) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

async function registerPoultryFlock(req, res) {
  try {
    const flock = await service.registerPoultryFlock(req.body);
    res.status(201).json({ success: true, data: flock });
  } catch (error) {
    logger.error('registerPoultryFlock error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPoultryFlock(req, res) {
  try {
    const flock = await service.getPoultryFlock(req.params.flockId);
    if (!flock) return res.status(404).json({ success: false, error: 'Flock not found' });
    res.json({ success: true, data: flock });
  } catch (error) {
    logger.error('getPoultryFlock error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listPoultryFlocks(req, res) {
  try {
    const { page, limit, farmId, birdType, status } = req.query;
    const result = await service.listPoultryFlocks({ page, limit, farmId, birdType, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listPoultryFlocks error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updatePoultryFlock(req, res) {
  try {
    const flock = await service.updatePoultryFlock(req.params.flockId, req.body);
    if (!flock) return res.status(404).json({ success: false, error: 'Flock not found' });
    res.json({ success: true, data: flock });
  } catch (error) {
    logger.error('updatePoultryFlock error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function analyzeEggProduction(req, res) {
  try {
    const analysis = await service.analyzeEggProduction(req.params.flockId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('analyzeEggProduction error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPoultryAnalytics(req, res) {
  try {
    const { startDate, endDate, farmId } = req.query;
    const analytics = await service.getPoultryAnalytics({ startDate, endDate, farmId });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getPoultryAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  registerPoultryFlock,
  getPoultryFlock,
  listPoultryFlocks,
  updatePoultryFlock,
  analyzeEggProduction,
  getPoultryAnalytics,
};
