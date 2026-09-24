/**
 * Unified AFRERA OS API surface — auto-discoverable by DynamicRouteLoader
 */

'use strict';

const express = require('express');
const router = express.Router();

function safe(p) {
  try {
    return require(p);
  } catch (e) {
    const r = express.Router();
    r.all('*', (req, res) => res.status(503).json({ success: false, error: e.message, path: p }));
    return r;
  }
}

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'afrera_os',
    surfaces: [
      'interplatform',
      'grade10',
      'features',
      'baseline',
      'dynamic-pricing',
      'modules',
      'research-grade',
      'ecommerce',
      'layers',
      'escrow',
      'wiring-test',
    ],
  });
});

router.use('/interplatform', safe('./interplatformRoutes'));
router.use('/grade10', safe('./industryGradeRoutes'));
router.use('/features', safe('./featureActivationRoutes'));
router.use('/baseline', safe('./baselinePlatformRoutes'));
router.use('/dynamic-pricing', safe('./dynamicPricingRoutes'));
router.use('/modules', safe('./universalModuleRoutes'));
router.use('/research-grade', safe('./researchGradeRoutes'));
router.use('/ecommerce', safe('./ecommerceCheckoutRoutes'));
router.use('/layers', safe('./layerBoundaryRoutes'));
router.use('/escrow', safe('./escrowIssueRoutes'));
router.use('/wiring-test', safe('./afreraWiringTestRoutes'));

try {
  const wallet = require('../services/commerce/walletService');
  const preseason = require('../services/commerce/preseasonPurchaseService');
  const cf = require('../services/farmer/contractFarmingService');
  router.post('/wallet/operate', async (req, res) => {
    try {
      res.json({ success: true, ...(await wallet.operate(req.body || {})) });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message, code: e.code });
    }
  });
  router.post('/preseason/operate', async (req, res) => {
    try {
      res.json({ success: true, ...(await preseason.operate(req.body || {})) });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message, code: e.code });
    }
  });
  router.post('/contract-farming/operate', async (req, res) => {
    try {
      res.json({ success: true, ...(await cf.operate(req.body || {})) });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message, code: e.code });
    }
  });
} catch (e) {
  router.get('/wallet-preseason-status', (req, res) => {
    res.status(503).json({ success: false, error: e.message });
  });
}

module.exports = router;
