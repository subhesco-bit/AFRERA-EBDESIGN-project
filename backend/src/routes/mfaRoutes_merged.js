const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const mfaService = require('../services/mfaService');

router.get('/status', authMiddleware, async (req, res) => {
  try {
    const result = await mfaService.status(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/setup', authMiddleware, async (req, res) => {
  try {
    const result = await mfaService.generateSecret(req.user.id, req.user.email);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ success: false, error: 'token is required' });
    const result = await mfaService.enable(req.user.id, token);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/disable', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ success: false, error: 'token is required' });
    const result = await mfaService.disable(req.user.id, token);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
