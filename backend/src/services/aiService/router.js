/**
 * Express router for the AI decision-making service. Split out of the
 * former monolithic services/aiService.js (M11).
 */

const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const { predictDemand } = require('./demandForecasting');
const { optimizePrice } = require('./priceOptimization');
const { assessCreditRisk } = require('./creditRisk');
const { detectFraud } = require('./fraudDetection');
const { generateRecommendations } = require('./recommendationEngine');

const router = express.Router();

router.post('/predict/demand', authMiddleware, async (req, res) => {
  try {
    const { product_id, time_horizon } = req.body;
    const result = await predictDemand(product_id, time_horizon);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/optimize/price', authMiddleware, async (req, res) => {
  try {
    const { product_id, current_price } = req.body;
    const result = await optimizePrice(product_id, current_price);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/assess/credit-risk', authMiddleware, async (req, res) => {
  try {
    const { farmer_id } = req.body;
    const result = await assessCreditRisk(farmer_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/detect/fraud', authMiddleware, async (req, res) => {
  try {
    const result = await detectFraud(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/recommend', authMiddleware, async (req, res) => {
  try {
    const { user_id, context } = req.body;
    const result = await generateRecommendations(user_id, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
