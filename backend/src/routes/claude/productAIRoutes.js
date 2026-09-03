/**
 * Product AI Routes - Claude AI Integration
 */

const express = require('express');
const router = express.Router();
const service = require('../../services/claude/productAIService');
const originalService = require('../../services/legacy/productService');
const { authMiddleware } = require('../../middleware/auth');

router.use(authMiddleware);

router.post('/ai-enhanced/recommend', async (req, res) => {
  try {
    const { userContext, productData, options } = req.body;
    const result = await service.recommendProductAI(userContext, productData, options);
    res.json({ success: true, ai_enhanced: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

router.get('/ai-capability', (req, res) => {
  const status = service.getAICapabilityStatus();
  res.json({ success: true, status });
});

router.get('/products', async (req, res) => {
  try {
    const { filters, pagination } = req.query;
    const result = await originalService.getProducts(filters, pagination);
    res.json({ success: true, ai_enhanced: false, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

module.exports = router;