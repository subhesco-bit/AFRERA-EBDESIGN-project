// Controller for Sheep Management (M074) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

async function registerSheepFlock(req, res) {
  try {
    const flock = await service.registerSheepFlock(req.body);
    res.status(201).json({ success: true, data: flock });
  } catch (error) {
    logger.error('registerSheepFlock error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getSheepFlock(req, res) {
  try {
    let flock = await service.getSheepFlock(req.params.flockId);
    if (!flock) return res.status(404).json({ success: false, error: 'Flock not found' });
    res.json({ success: true, data: flock });
  } catch (error) {
    logger.error('getSheepFlock error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listSheepFlocks(req, res) {
  try {
    const { page, limit, farmId, breed, status } = req.query;
    const result = await service.listSheepFlocks({ page, limit, farmId, breed, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listSheepFlocks error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateSheepFlock(req, res) {
  try {
    let flock = await service.updateSheepFlock(req.params.flockId, req.body);
    if (!flock) return res.status(404).json({ success: false, error: 'Flock not found' });
    res.json({ success: true, data: flock });
  } catch (error) {
    logger.error('updateSheepFlock error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function analyzeSheepProduction(req, res) {
  try {
    const analysis = await service.analyzeSheepProduction(req.params.flockId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('analyzeSheepProduction error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getSheepAnalytics(req, res) {
  try {
    const { startDate, endDate, farmId } = req.query;
    const analytics = await service.getSheepAnalytics({ startDate, endDate, farmId });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getSheepAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  registerSheepFlock,
  getSheepFlock,
  listSheepFlocks,
  updateSheepFlock,
  analyzeSheepProduction,
  getSheepAnalytics,
};
