// Controller for Farmer Registration (M021) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Farmer CRUD
async function registerFarmer(req, res) {
  try {
    const farmer = await service.registerFarmer(req.body);
    res.status(201).json({ success: true, data: farmer });
  } catch (error) {
    logger.error('registerFarmer error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getFarmer(req, res) {
  try {
    const farmer = await service.getFarmer(req.params.farmerId);
    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });
    res.json({ success: true, data: farmer });
  } catch (error) {
    logger.error('getFarmer error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listFarmers(req, res) {
  try {
    const { page, limit, status, primaryCrop } = req.query;
    const result = await service.listFarmers({ page, limit, status, primaryCrop });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listFarmers error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateFarmer(req, res) {
  try {
    const farmer = await service.updateFarmer(req.params.farmerId, req.body);
    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });
    res.json({ success: true, data: farmer });
  } catch (error) {
    logger.error('updateFarmer error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered analysis
async function analyzeFarmerProfile(req, res) {
  try {
    const analysis = await service.analyzeFarmerProfile(req.params.farmerId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('analyzeFarmerProfile error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Verification
async function verifyFarmer(req, res) {
  try {
    const result = await service.verifyFarmer(req.params.farmerId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('verifyFarmer error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function approveFarmerVerification(req, res) {
  try {
    const { approved, approvedBy, notes } = req.body;
    const result = await service.approveFarmerVerification(req.params.farmerId, approved, approvedBy, notes);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('approveFarmerVerification error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Onboarding
async function initiateOnboarding(req, res) {
  try {
    const result = await service.initiateOnboarding(req.params.farmerId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('initiateOnboarding error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateOnboardingProgress(req, res) {
  try {
    const { stepIndex, stepData } = req.body;
    const result = await service.updateOnboardingProgress(req.params.farmerId, stepIndex, stepData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('updateOnboardingProgress error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getFarmerAnalytics(req, res) {
  try {
    const { startDate, endDate, region } = req.query;
    const analytics = await service.getFarmerAnalytics({ startDate, endDate, region });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getFarmerAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  registerFarmer,
  getFarmer,
  listFarmers,
  updateFarmer,
  analyzeFarmerProfile,
  verifyFarmer,
  approveFarmerVerification,
  initiateOnboarding,
  updateOnboardingProgress,
  getFarmerAnalytics,
};