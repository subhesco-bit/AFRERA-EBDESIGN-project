'use strict';

const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const adapters = require('../services/aiDomainAdapterService');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  res.json({ success: true, data: adapters.listAdapters() });
});

router.post('/:domain/explain', authMiddleware, async (req, res) => {
  try {
    const result = await adapters.explain(req.params.domain, req.body.operation, req.body.data, req.body.context);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.code === 'UNKNOWN_AI_ADAPTER' ? 404 : 400).json({ success: false, error: error.message, code: error.code });
  }
});

module.exports = router;
