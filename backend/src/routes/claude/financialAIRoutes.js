/**
 * Financial AI Routes - Claude AI Integration
 */

const express = require('express');
const router = express.Router();
const service = require('../../services/claude/financialAIService');
const originalService = require('../../services/legacy/financialService');
const { authMiddleware } = require('../../middleware/auth');

router.use(authMiddleware);

router.post('/ai-enhanced/process-loan', async (req, res) => {
  try {
    const { loanData, options } = req.body;
    const result = await service.processLoanApplicationAI(loanData, options);
    res.json({ success: true, ai_enhanced: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

router.post('/ai-enhanced/assess-credit', async (req, res) => {
  try {
    const { farmerId, financialData, options } = req.body;
    let result = await service.assessCreditRiskAI(farmerId, financialData, options);
    res.json({ success: true, ai_enhanced: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

router.get('/ai-capability', (req, res) => {
  const status = service.getAICapabilityStatus();
  res.json({ success: true, status });
});

router.post('/apply-loan', async (req, res) => {
  try {
    let result = await originalService.applyForLoan(req.body);
    res.json({ success: true, ai_enhanced: false, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

module.exports = router;