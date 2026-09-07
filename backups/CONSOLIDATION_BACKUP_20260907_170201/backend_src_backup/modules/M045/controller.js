// Controller for Seed Planning (M045) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// CRUD
async function createSeedPlan(req, res) {
  try {
    const plan = await service.createSeedPlan(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    logger.error('createSeedPlan error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getSeedPlan(req, res) {
  try {
    const plan = await service.getSeedPlan(req.params.planId);
    if (!plan) return res.status(404).json({ success: false, error: 'Seed plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    logger.error('getSeedPlan error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listSeedPlans(req, res) {
  try {
    const { page, limit, farmerId, cropId, status } = req.query;
    const result = await service.listSeedPlans({ page, limit, farmerId, cropId, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listSeedPlans error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateSeedPlan(req, res) {
  try {
    const plan = await service.updateSeedPlan(req.params.planId, req.body);
    if (!plan) return res.status(404).json({ success: false, error: 'Seed plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    logger.error('updateSeedPlan error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteSeedPlan(req, res) {
  try {
    const success = await service.deleteSeedPlan(req.params.planId);
    if (!success) return res.status(404).json({ success: false, error: 'Seed plan not found' });
    res.json({ success: true });
  } catch (error) {
    logger.error('deleteSeedPlan error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered calculation
async function calculateSeedRequirements(req, res) {
  try {
    const { cropId, varietyId, area } = req.params;
    const conditions = req.body;
    const calculation = await service.calculateSeedRequirements(cropId, varietyId, area, conditions);
    res.json({ success: true, data: calculation });
  } catch (error) {
    logger.error('calculateSeedRequirements error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Supplier management
async function addSeedSupplier(req, res) {
  try {
    const supplier = await service.addSeedSupplier(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    logger.error('addSeedSupplier error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listSeedSuppliers(req, res) {
  try {
    const { cropType, minQualityRating } = req.query;
    const suppliers = await service.listSeedSuppliers({ cropType, minQualityRating });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    logger.error('listSeedSuppliers error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getSeedAnalytics(req, res) {
  try {
    const { startDate, endDate, cropId } = req.query;
    const analytics = await service.getSeedAnalytics({ startDate, endDate, cropId });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getSeedAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createSeedPlan,
  getSeedPlan,
  listSeedPlans,
  updateSeedPlan,
  deleteSeedPlan,
  calculateSeedRequirements,
  addSeedSupplier,
  listSeedSuppliers,
  getSeedAnalytics,
};