const express = require('express');
const router = express.Router();
const service = require('../services/endToEndFlowService');

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
  req.userId = token;
  next();
}

router.post('/commercial', auth, async (req, res) => {
  try {
    const data = await service.runCommercialFlow(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/runs', auth, async (req, res) => {
  try { res.status(201).json({ success: true, data: await service.start(req.body.flowName, req.body.correlationId, req.body.context) }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

module.exports = router;
