// Controller for Crop Registration (M043) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// CRUD
async function registerCrop(req, res) {
  try {
    const crop = await service.registerCrop(req.body);
    res.status(201).json({ success: true, data: crop });
  } catch (error) {
    logger.error('registerCrop error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getCropRegistration(req, res) {
  try {
    const registration = await service.getCropRegistration(req.params.registrationId);
    if (!registration) return res.status(404).json({ success: false, error: 'Crop registration not found' });
    res.json({ success: true, data: registration });
  } catch (error) {
    logger.error('getCropRegistration error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listCropRegistrations(req, res) {
  try {
    const { page, limit, farmerId, cropName, villageId, status } = req.query;
    const result = await service.listCropRegistrations({ page, limit, farmerId, cropName, villageId, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listCropRegistrations error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateCropRegistration(req, res) {
  try {
    let registration = await service.updateCropRegistration(req.params.registrationId, req.body);
    if (!registration) return res.status(404).json({ success: false, error: 'Crop registration not found' });
    res.json({ success: true, data: registration });
  } catch (error) {
    logger.error('updateCropRegistration error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteCropRegistration(req, res) {
  try {
    const success = await service.deleteCropRegistration(req.params.registrationId);
    if (!success) return res.status(404).json({ success: false, error: 'Crop registration not found' });
    res.json({ success: true });
  } catch (error) {
    logger.error('deleteCropRegistration error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered recommendations
async function recommendCrops(req, res) {
  try {
    const { farmerId } = req.params;
    const constraints = req.body;
    const recommendations = await service.recommendCrops(farmerId, constraints);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    logger.error('recommendCrops error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Yield estimation
async function estimateYield(req, res) {
  try {
    const factors = req.body;
    const estimation = await service.estimateYield(req.params.registrationId, factors);
    res.json({ success: true, data: estimation });
  } catch (error) {
    logger.error('estimateYield error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getCropAnalytics(req, res) {
  try {
    const { startDate, endDate, villageId, cropName } = req.query;
    const analytics = await service.getCropAnalytics({ startDate, endDate, villageId, cropName });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getCropAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  registerCrop,
  getCropRegistration,
  listCropRegistrations,
  updateCropRegistration,
  deleteCropRegistration,
  recommendCrops,
  estimateYield,
  getCropAnalytics,
};