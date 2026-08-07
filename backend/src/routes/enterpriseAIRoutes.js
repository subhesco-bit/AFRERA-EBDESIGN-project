const express = require('express');
const enterpriseAIService = require('../services/enterpriseAIService');
const aiOrchestrationService = require('../services/aiOrchestrationService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/credit-score', async (req, res, next) => {
  try {
    const { farmerId, loanAmount, loanType } = req.body;
    const result = await enterpriseAIService.calculateCreditScore(farmerId, loanAmount, loanType);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/scheme-eligibility', async (req, res, next) => {
  try {
    const { stakeholderId, schemeId } = req.body;
    const result = await enterpriseAIService.checkSchemeEligibility(stakeholderId, schemeId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/assess-risk', async (req, res, next) => {
  try {
    const { stakeholderId, transactionType, amount } = req.body;
    const result = await enterpriseAIService.assessRisk(stakeholderId, transactionType, amount);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/recommendations', async (req, res, next) => {
  try {
    const { stakeholderId, context } = req.body;
    const result = await enterpriseAIService.generateRecommendations(stakeholderId, context || {});
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/entity-profile', async (req, res, next) => {
  try {
    const { entityId, entityType } = req.body;
    const result = await enterpriseAIService.buildEntityProfile(entityId, entityType);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/anomaly-detection', async (req, res, next) => {
  try {
    const result = await enterpriseAIService.detectAnomalies(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/predict-yield', async (req, res, next) => {
  try {
    const { farmerId, crop, season } = req.body;
    const result = await enterpriseAIService.predictYield(farmerId, crop, season);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/predict-demand', async (req, res, next) => {
  try {
    const { productId, region, timeframe } = req.body;
    const result = await enterpriseAIService.predictDemand(productId, region, timeframe);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/predict-price', async (req, res, next) => {
  try {
    const { productId, region, timeframe } = req.body;
    const result = await enterpriseAIService.predictPriceTrend(productId, region, timeframe);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/model-slots', async (req, res, next) => {
  try {
    const result = await aiOrchestrationService.listModelSlots();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/unserved-intents', async (req, res, next) => {
  try {
    const result = await aiOrchestrationService.listUnservedIntents();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/model-slots', async (req, res, next) => {
  try {
    const result = await aiOrchestrationService.upsertModelSlot(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/query', async (req, res, next) => {
  try {
    const { query, stakeholderId, context } = req.body;
    const result = await enterpriseAIService.processQuery(query, stakeholderId, context || {});
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
