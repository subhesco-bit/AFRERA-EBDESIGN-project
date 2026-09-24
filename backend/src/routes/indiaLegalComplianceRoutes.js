const express = require('express');
const legal = require('../modules/legal/IndiaAnimalHealthCompliance');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'india-animal-health-legal-compliance',
    anchors: ['PCICDA_2009', 'NADRS_style', 'IDSP_IHIP', 'WOAH_authority_only'],
  });
});

router.get('/pcicda/duties', (_req, res) => {
  res.json({ success: true, data: legal.PCICDA_DUTIES, disclaimer: legal.LEGAL_DISCLAIMER });
});

router.get('/nadrs/flow', (_req, res) => {
  res.json({ success: true, data: legal.NADRS_STYLE_FLOW, disclaimer: legal.LEGAL_DISCLAIMER });
});

router.get('/idsp-ihip/cross-notify', (_req, res) => {
  res.json({ success: true, data: legal.IDSP_IHIP_CROSS, disclaimer: legal.LEGAL_DISCLAIMER });
});

router.get('/woah/boundary', (_req, res) => {
  res.json({ success: true, data: legal.WOAH_BOUNDARY, disclaimer: legal.LEGAL_DISCLAIMER });
});

/** Draft incidence + FIR + duty checklist (no filing) */
router.post('/dossier', (req, res) => {
  try {
    res.json({ success: true, data: legal.buildReportingDossier(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: legal.LEGAL_DISCLAIMER });
  }
});

/** Full compliance operate pipeline */
router.post('/operate', (req, res) => {
  try {
    res.json({ success: true, data: legal.operateCompliance(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: legal.LEGAL_DISCLAIMER });
  }
});

module.exports = router;
