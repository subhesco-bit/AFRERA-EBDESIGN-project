// Controller for Nursery Management (M046) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Nursery CRUD
async function createNursery(req, res) {
  try {
    const nursery = await service.createNursery(req.body);
    res.status(201).json({ success: true, data: nursery });
  } catch (error) {
    logger.error('createNursery error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getNursery(req, res) {
  try {
    const nursery = await service.getNursery(req.params.nurseryId);
    if (!nursery) return res.status(404).json({ success: false, error: 'Nursery not found' });
    res.json({ success: true, data: nursery });
  } catch (error) {
    logger.error('getNursery error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listNurseries(req, res) {
  try {
    const { page, limit, farmerId, type, status } = req.query;
    const result = await service.listNurseries({ page, limit, farmerId, type, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listNurseries error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateNursery(req, res) {
  try {
    const nursery = await service.updateNursery(req.params.nurseryId, req.body);
    if (!nursery) return res.status(404).json({ success: false, error: 'Nursery not found' });
    res.json({ success: true, data: nursery });
  } catch (error) {
    logger.error('updateNursery error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteNursery(req, res) {
  try {
    const success = await service.deleteNursery(req.params.nurseryId);
    if (!success) return res.status(404).json({ success: false, error: 'Nursery not found' });
    res.json({ success: true });
  } catch (error) {
    logger.error('deleteNursery error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Seedling batch management
async function createSeedlingBatch(req, res) {
  try {
    const batch = await service.createSeedlingBatch(req.body);
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    logger.error('createSeedlingBatch error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateSeedlingHealth(req, res) {
  try {
    const health = await service.updateSeedlingHealth(req.params.batchId, req.body);
    res.status(201).json({ success: true, data: health });
  } catch (error) {
    logger.error('updateSeedlingHealth error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered optimization
async function optimizeNurseryEnvironment(req, res) {
  try {
    const optimization = await service.optimizeNurseryEnvironment(req.params.nurseryId);
    res.json({ success: true, data: optimization });
  } catch (error) {
    logger.error('optimizeNurseryEnvironment error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getNurseryAnalytics(req, res) {
  try {
    const { startDate, endDate, nurseryId } = req.query;
    const analytics = await service.getNurseryAnalytics({ startDate, endDate, nurseryId });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getNurseryAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createNursery,
  getNursery,
  listNurseries,
  updateNursery,
  deleteNursery,
  createSeedlingBatch,
  updateSeedlingHealth,
  optimizeNurseryEnvironment,
  getNurseryAnalytics,
};
