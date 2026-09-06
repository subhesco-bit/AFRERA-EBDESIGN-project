/**
 * DPR (Detailed Project Report) Generation Routes.
 *
 * dprGenerationService.js was found fully built but with zero HTTP exposure
 * — no routes file existed for it at all. Real methods: assemble() (data
 * only, no persistence), generate() (persist + return), getById(), list(),
 * streamPdf() (real PDF export via pdfkit).
 */

const express = require('express');
const router = express.Router();
const dprGenerationService = require('../services/legacy/dprGenerationService');
const { authMiddleware } = require('../middleware/auth');

router.post('/preview', authMiddleware, async (req, res) => {
  try {
    const { farmerId, fpoId, cropPlanId, purpose, financingAskInr } = req.body || {};
    if (!purpose) return res.status(400).json({ success: false, error: 'purpose is required' });
    const document = await dprGenerationService.assemble({ farmerId, fpoId, cropPlanId, purpose, financingAskInr });
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { farmerId, fpoId, cropPlanId, purpose, financingAskInr } = req.body || {};
    if (!purpose) return res.status(400).json({ success: false, error: 'purpose is required' });
    const dpr = await dprGenerationService.generate({
      farmerId, fpoId, cropPlanId, purpose, financingAskInr, generatedBy: req.user?.id,
    });
    res.status(201).json({ success: true, data: dpr });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { farmerId, fpoId } = req.query;
    const list = await dprGenerationService.list({ farmerId, fpoId }, { userId: req.user.id, isAdmin: req.user.role === 'admin' });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const dpr = await dprGenerationService.getById(req.params.id, { userId: req.user.id, isAdmin: req.user.role === 'admin' });
    res.json({ success: true, data: dpr });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.get('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DPR-${req.params.id}.pdf"`);
    await dprGenerationService.streamPdf(req.params.id, res, { userId: req.user.id, isAdmin: req.user.role === 'admin' });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

module.exports = router;
