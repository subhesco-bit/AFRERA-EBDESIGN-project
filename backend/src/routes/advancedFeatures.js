/**
 * Advanced Features Routes
 * API endpoints for AI recommendations, blockchain integration, and IoT automation
 */

const express = require('express');
const router = express.Router();
const advancedFeaturesService = require('../services/legacy/advancedFeaturesService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { authRateLimit } = require('../middleware/rateLimiter');

// AI Recommendations Routes
router.post('/ai/recommendations', authMiddleware, async (req, res) => {
  try {
    const recommendations = await advancedFeaturesService.getPersonalizedRecommendations(req.user.id, req.body);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Blockchain Smart Contract Routes
router.post('/blockchain/contracts', authMiddleware, async (req, res) => {
  try {
    const contract = await advancedFeaturesService.createSmartContract(req.body);
    res.json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/blockchain/contracts/:contractId/execute', authMiddleware, async (req, res) => {
  try {
    const { contractId } = req.params;
    const result = await advancedFeaturesService.executeSmartContract(contractId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// IoT Device Routes
router.post('/iot/devices', authMiddleware, async (req, res) => {
  try {
    const device = await advancedFeaturesService.registerIoTDevice(req.body);
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/iot/devices/:deviceId/data', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    let result = await advancedFeaturesService.processIoTData(deviceId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Demand Forecasting Routes
router.post('/analytics/demand-forecast', authMiddleware, async (req, res) => {
  try {
    const forecast = await advancedFeaturesService.forecastDemand(req.body);
    res.json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Voice Command Routes
router.post('/voice/commands', authMiddleware, async (req, res) => {
  try {
    const { command } = req.body;
    let result = await advancedFeaturesService.processVoiceCommand(command, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AR/VR Experience Routes
router.post('/ar-vr/experiences', authMiddleware, async (req, res) => {
  try {
    const experience = await advancedFeaturesService.createARExperience(req.body);
    res.json({ success: true, data: experience });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Knowledge Graph Routes
router.post('/knowledge-graph/query', authMiddleware, async (req, res) => {
  try {
    const graphData = await advancedFeaturesService.queryKnowledgeGraph(req.body.queryType, req.body.params);
    res.json({ success: true, data: graphData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
