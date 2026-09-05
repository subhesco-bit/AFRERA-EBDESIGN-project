// Controller for Pig Management (M075) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

async function registerPigHerd(req, res) {
  try {
    const herd = await service.registerPigHerd(req.body);
    res.status(201).json({ success: true, data: herd });
  } catch (error) {
    logger.error('registerPigHerd error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPigHerd(req, res) {
  try {
    let herd = await service.getPigHerd(req.params.herdId);
    if (!herd) return res.status(404).json({ success: false, error: 'Herd not found' });
    res.json({ success: true, data: herd });
  } catch (error) {
    logger.error('getPigHerd error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listPigHerds(req, res) {
  try {
    const { page, limit, farmId, breed, status } = req.query;
    const result = await service.listPigHerds({ page, limit, farmId, breed, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listPigHerds error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updatePigHerd(req, res) {
  try {
    let herd = await service.updatePigHerd(req.params.herdId, req.body);
    if (!herd) return res.status(404).json({ success: false, error: 'Herd not found' });
    res.json({ success: true, data: herd });
  } catch (error) {
    logger.error('updatePigHerd error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function analyzePigProduction(req, res) {
  try {
    const analysis = await service.analyzePigProduction(req.params.herdId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('analyzePigProduction error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPigAnalytics(req, res) {
  try {
    const { startDate, endDate, farmId } = req.query;
    const analytics = await service.getPigAnalytics({ startDate, endDate, farmId });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getPigAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  registerPigHerd,
  getPigHerd,
  listPigHerds,
  updatePigHerd,
  analyzePigProduction,
  getPigAnalytics,
};
