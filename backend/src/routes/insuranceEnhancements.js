/**
 * Insurance Enhancement Routes
 * API endpoints for Premium Calculation, Policy Issuance, and Fraud Detection
 */

const express = require('express');
const router = express.Router();
const insurancePremiumService = require('../services/legacy/insurancePremiumService');
const insurancePolicyIssuanceService = require('../services/legacy/insurancePolicyIssuanceService');
const insuranceFraudDetectionService = require('../services/legacy/insuranceFraudDetectionService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { authRateLimit } = require('../middleware/rateLimiter');

// Premium Calculation Routes
router.post('/quotes', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const quote = await insurancePremiumService.generateQuote(req.body);
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/quotes/:quoteId', authMiddleware, async (req, res) => {
  try {
    const { quoteId } = req.params;
    let quote = await insurancePremiumService.getQuote(quoteId);
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/calculate/crop', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const premium = await insurancePremiumService.calculateCropPremium(req.body);
    res.json({ success: true, data: premium });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/calculate/transit', authRateLimit, authMiddleware, async (req, res) => {
  try {
    let premium = await insurancePremiumService.calculateTransitPremium(req.body);
    res.json({ success: true, data: premium });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/calculate/warehouse', authRateLimit, authMiddleware, async (req, res) => {
  try {
    let premium = await insurancePremiumService.calculateWarehousePremium(req.body);
    res.json({ success: true, data: premium });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/calculate/livestock', authRateLimit, authMiddleware, async (req, res) => {
  try {
    let premium = await insurancePremiumService.calculateLivestockPremium(req.body);
    res.json({ success: true, data: premium });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Policy Issuance Routes
router.post('/policies', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const policy = await insurancePolicyIssuanceService.issuePolicy(req.body);
    res.json({ success: true, data: policy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/policies/:policyId', authMiddleware, async (req, res) => {
  try {
    const { policyId } = req.params;
    let policy = await insurancePolicyIssuanceService.getPolicy(policyId, req.user.id, req.user.role === 'admin');
    res.json({ success: true, data: policy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/policies/number/:policyNumber', authMiddleware, async (req, res) => {
  try {
    const { policyNumber } = req.params;
    let policy = await insurancePolicyIssuanceService.getPolicyByNumber(policyNumber);
    res.json({ success: true, data: policy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/policies', authMiddleware, async (req, res) => {
  try {
    const policies = await insurancePolicyIssuanceService.getUserPolicies(req.user.id, req.query);
    res.json({ success: true, data: policies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/policies/:policyId/renew', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { policyId } = req.params;
    let policy = await insurancePolicyIssuanceService.renewPolicy(
      policyId, req.body, req.user.id, req.user.role === 'admin'
    );
    res.json({ success: true, data: policy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/policies/:policyId', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { policyId } = req.params;
    const { reason } = req.body;
    const result = await insurancePolicyIssuanceService.cancelPolicy(policyId, req.user.id, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/policies/:policyId/payments/:installmentNumber', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { policyId, installmentNumber } = req.params;
    let policy = await insurancePolicyIssuanceService.processPayment(policyId, installmentNumber, req.body);
    res.json({ success: true, data: policy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/policies/:policyId/documents', authMiddleware, async (req, res) => {
  try {
    const { policyId } = req.params;
    const documents = await insurancePolicyIssuanceService.getPolicyDocuments(policyId);
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/policies/:policyId/documents', authMiddleware, async (req, res) => {
  try {
    const { policyId } = req.params;
    const document = await insurancePolicyIssuanceService.uploadPolicyDocument(policyId, req.body);
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// (2026-08-29) Ported from a redundant duplicate route file
// (insurancePolicyIssuanceRoutes.js, deleted) - the one endpoint this file
// didn't already have.
router.patch('/quotes/:quoteId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let result = await insurancePolicyIssuanceService.updateQuoteStatus(req.params.quoteId, req.body.status);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Fraud Detection Routes
router.post('/claims/:claimId/fraud-analysis', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { claimId } = req.params;
    const analysis = await insuranceFraudDetectionService.analyzeClaimForFraud(claimId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/claims/:claimId/fraud-analysis', authMiddleware, async (req, res) => {
  try {
    const { claimId } = req.params;
    let analysis = await insuranceFraudDetectionService.getFraudAnalysis(claimId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/fraud/statistics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await insuranceFraudDetectionService.getFraudStatistics(req.query);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
