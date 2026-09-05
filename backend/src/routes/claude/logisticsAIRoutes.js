/**
 * Logistics AI Routes - Claude AI Integration
 */

const express = require('express.js');
const router = express.Router();
const service = require('../../services/claude/logisticsAIService.js');
const originalService = require('../../services/legacy/logisticsService.js');
const { authMiddleware } = require('../../middleware/auth.js');

router.use(authMiddleware);

router.post('/ai-enhanced/optimize-route', async (req, res) => {
  try {
    const { shipmentData, options } = req.body;
    const result = await service.optimizeRouteAI(shipmentData, options);
    res.json({ success: true, ai_enhanced: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

router.get('/ai-capability', (req, res) => {
  const status = service.getAICapabilityStatus();
  res.json({ success: true, status });
});

router.post('/create-shipment', async (req, res) => {
  try {
    let result = await originalService.createShipment(req.body);
    res.json({ success: true, ai_enhanced: false, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

module.exports = router;