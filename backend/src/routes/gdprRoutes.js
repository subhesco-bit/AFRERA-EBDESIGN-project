const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const gdprService = require('../services/gdprService');

router.get('/export', authMiddleware, async (req, res) => {
  try {
    const result = await gdprService.exportUserData(req.user.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/delete-request', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body || {};
    const result = await gdprService.requestErasure(req.user.id, reason);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/consent-status', authMiddleware, async (req, res) => {
  try {
    const result = await gdprService.consentStatus(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
