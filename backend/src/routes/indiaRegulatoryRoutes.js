const express = require('express');
const schedules = require('../modules/regulatory/IndiaDrugSchedules');
const oneHealth = require('../modules/onehealth/VeterinaryOneHealthWorkflow');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'india-regulatory-onehealth',
    schedules: Object.keys(schedules.SCHEDULES),
    onehealth_stages: oneHealth.PROCESS_STAGES.length,
  });
});

router.get('/drug-schedules', (_req, res) => {
  res.json({
    success: true,
    data: schedules.SCHEDULES,
    disclaimer: schedules.REGULATORY_DISCLAIMER,
  });
});

router.post('/drug-schedules/classify', (req, res) => {
  try {
    res.json({ success: true, data: schedules.interpretPrescriptionRequest(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/drug-schedules/workflow/:scheduleId', (req, res) => {
  res.json({
    success: true,
    data: schedules.retailSaleWorkflow(req.params.scheduleId),
    disclaimer: schedules.REGULATORY_DISCLAIMER,
  });
});

router.get('/onehealth/process-stages', (_req, res) => {
  res.json({ success: true, data: oneHealth.PROCESS_STAGES, disclaimer: oneHealth.OH_DISCLAIMER });
});

/** Full operate pipeline: analyze → interpret → decide → interact */
router.post('/onehealth/operate', (req, res) => {
  try {
    res.json({ success: true, data: oneHealth.operate(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: oneHealth.OH_DISCLAIMER });
  }
});

router.post('/onehealth/interpret', (req, res) => {
  try {
    res.json({ success: true, data: oneHealth.interpretCase(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
