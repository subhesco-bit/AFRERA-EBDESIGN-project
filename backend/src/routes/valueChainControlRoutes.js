'use strict';

/** Value-Chain Control Plane API — /api/v1/value-chain-control */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const orch = require('../value-chain-control/orchestrationService');
const caseService = require('../value-chain-control/caseService');
const gateEngine = require('../value-chain-control/gateEngine');
const assertionService = require('../value-chain-control/assertionService');
const calculationRegistry = require('../value-chain-control/calculationRegistry');
const massBalanceEngine = require('../value-chain-control/massBalanceEngine');
const priceWaterfallEngine = require('../value-chain-control/priceWaterfallEngine');

const router = express.Router();

router.get('/capabilities', authMiddleware, (req, res) => {
  res.json({ success: true, data: orch.getCapabilities() });
});

router.get('/calculations', authMiddleware, (req, res) => {
  res.json({ success: true, data: calculationRegistry.listDefinitions() });
});

router.post('/calculations/run', authMiddleware, (req, res) => {
  try {
    const data = calculationRegistry.runCalculation(
      req.body.calculationId,
      req.body.inputs || {},
      req.body.version,
    );
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/price-waterfall', authMiddleware, (req, res) => {
  try {
    const data = priceWaterfallEngine.buildWaterfall(
      req.body.deliveredPricePerKg,
      req.body.deductions || [],
    );
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/mass-balance/project', authMiddleware, (req, res) => {
  try {
    const data = massBalanceEngine.projectChain(req.body.harvestQty, req.body.stages || []);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/cases', authMiddleware, async (req, res) => {
  try {
    const data = await caseService.createCase(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/cases', authMiddleware, async (req, res) => {
  try {
    const data = await caseService.listCases({ status: req.query.status, limit: req.query.limit });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/cases/:id', authMiddleware, async (req, res) => {
  try {
    const data = await orch.composeCaseView(req.params.id, {
      deliveredPricePerKg: req.query.deliveredPricePerKg != null
        ? Number(req.query.deliveredPricePerKg) : undefined,
      harvestQty: req.query.harvestQty != null ? Number(req.query.harvestQty) : undefined,
      adapterIds: {
        fpoId: req.query.fpoId,
        receiptId: req.query.receiptId,
        escrowId: req.query.escrowId,
        facilityType: req.query.facilityType,
      },
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(e.message === 'Case not found' ? 404 : 500).json({ success: false, error: e.message });
  }
});

router.post('/cases/:id/compose', authMiddleware, async (req, res) => {
  try {
    const data = await orch.composeCaseView(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/cases/:id/assertions', authMiddleware, async (req, res) => {
  try {
    const data = await assertionService.assertField(req.params.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/cases/:id/assertions', authMiddleware, async (req, res) => {
  try {
    const data = await assertionService.listAssertions(req.params.id, req.query.fieldKey);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/cases/:id/gates/:gateCode/evaluate', authMiddleware, async (req, res) => {
  try {
    const data = await gateEngine.evaluateGate(req.params.id, req.params.gateCode, req.body.requirements || []);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/cases/:id/mass-balance', authMiddleware, async (req, res) => {
  try {
    const data = await massBalanceEngine.addLine(req.params.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/cases/:id/links', authMiddleware, async (req, res) => {
  try {
    const data = await caseService.linkExternal(req.params.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/cases/:id/snapshots', authMiddleware, async (req, res) => {
  try {
    const data = await caseService.createSnapshot(req.params.id, req.body.gateCode, req.body.payload || {});
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
