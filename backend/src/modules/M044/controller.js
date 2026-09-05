// Controller for Crop Variety (M044) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// CRUD
async function createVariety(req, res) {
  try {
    const variety = await service.createVariety(req.body);
    res.status(201).json({ success: true, data: variety });
  } catch (error) {
    logger.error('createVariety error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getVariety(req, res) {
  try {
    let variety = await service.getVariety(req.params.varietyId);
    if (!variety) return res.status(404).json({ success: false, error: 'Crop variety not found' });
    res.json({ success: true, data: variety });
  } catch (error) {
    logger.error('getVariety error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listVarieties(req, res) {
  try {
    const { page, limit, cropName, status } = req.query;
    const result = await service.listVarieties({ page, limit, cropName, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listVarieties error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateVariety(req, res) {
  try {
    let variety = await service.updateVariety(req.params.varietyId, req.body);
    if (!variety) return res.status(404).json({ success: false, error: 'Crop variety not found' });
    res.json({ success: true, data: variety });
  } catch (error) {
    logger.error('updateVariety error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteVariety(req, res) {
  try {
    const success = await service.deleteVariety(req.params.varietyId);
    if (!success) return res.status(404).json({ success: false, error: 'Crop variety not found' });
    res.json({ success: true });
  } catch (error) {
    logger.error('deleteVariety error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered recommendations
async function recommendVarieties(req, res) {
  try {
    const { cropName } = req.params;
    const conditions = req.body;
    const recommendations = await service.recommendVarieties(cropName, conditions);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    logger.error('recommendVarieties error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Performance tracking
async function recordVarietyPerformance(req, res) {
  try {
    const performance = await service.recordVarietyPerformance(req.body);
    res.status(201).json({ success: true, data: performance });
  } catch (error) {
    logger.error('recordVarietyPerformance error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getVarietyPerformance(req, res) {
  try {
    let performance = await service.getVarietyPerformance(req.params.varietyId);
    res.json({ success: true, data: performance });
  } catch (error) {
    logger.error('getVarietyPerformance error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function analyzeVarietyPerformance(req, res) {
  try {
    const analysis = await service.analyzeVarietyPerformance(req.params.varietyId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('analyzeVarietyPerformance error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getVarietyAnalytics(req, res) {
  try {
    const { cropName, startDate, endDate } = req.query;
    const analytics = await service.getVarietyAnalytics({ cropName, startDate, endDate });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getVarietyAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createVariety,
  getVariety,
  listVarieties,
  updateVariety,
  deleteVariety,
  recommendVarieties,
  recordVarietyPerformance,
  getVarietyPerformance,
  analyzeVarietyPerformance,
  getVarietyAnalytics,
};