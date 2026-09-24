const express = require('express');
const pharmacy = require('../modules/pharmacy/PharmacyIntelligenceEngine');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, module: 'pharmacy-intelligence', classes: pharmacy.DRUG_CLASSES.length });
});

router.get('/classes', (_req, res) => {
  res.json({ success: true, data: pharmacy.DRUG_CLASSES, disclaimer: pharmacy.PHARMACY_DISCLAIMER });
});

router.post('/conference', (req, res) => {
  try {
    res.json({ success: true, data: pharmacy.runPharmacyConference(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: pharmacy.PHARMACY_DISCLAIMER });
  }
});

router.post('/interactions', (req, res) => {
  try {
    const medications = req.body?.medications || [];
    res.json({
      success: true,
      data: {
        classes: pharmacy.matchClasses(medications),
        interactions: pharmacy.matchInteractions(medications),
      },
      disclaimer: pharmacy.PHARMACY_DISCLAIMER,
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
