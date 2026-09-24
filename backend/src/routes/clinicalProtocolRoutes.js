const express = require('express');
const proto = require('../modules/protocols/ClinicalProtocolLibrary');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, module: 'clinical-protocols', count: proto.PROTOCOLS.length, categories: proto.categories });
});

router.get('/catalogue', (_req, res) => {
  res.json({ success: true, data: proto.listByCategory() });
});

router.get('/all', (_req, res) => {
  res.json({ success: true, data: proto.PROTOCOLS });
});

router.post('/match', (req, res) => {
  try {
    const data = proto.matchProtocols({
      text: req.body?.text || req.body?.query || '',
      domain: req.body?.domain,
      category: req.body?.category,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
