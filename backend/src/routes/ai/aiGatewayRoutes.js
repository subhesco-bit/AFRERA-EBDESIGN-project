const express = require('express');
const router = express.Router();
const gateway = require('../../services/aiGatewayService');
const aiBackbone = require('../../services/legacy/aiBackboneService');

router.get('/status', async (_req, res) => res.json({ success: true, data: await gateway.healthCheck() }));
router.get('/providers', (_req, res) => {
  const status = aiBackbone.getAIProviderStatus();
  const providers = Object.entries(status.providers || {}).map(([provider, value]) => ({
    provider,
    available: Boolean(value.enabled && value.configured),
    model: value.model,
  }));
  res.json({ success: true, data: providers });
});
const runRequest = async (req, res, next) => {
  try {
    const result = await gateway.run(req.body || {});
    if (result.status === 'not_configured') return res.status(503).json(result);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};
router.post('/route', runRequest);
router.post('/chat', runRequest);
router.post('/stream', async (req, res, next) => {
  try {
    const result = await gateway.run(req.body || {});
    if (result.status === 'not_configured') return res.status(503).json(result);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(`event: completion\ndata: ${JSON.stringify(result)}\n\n`);
  } catch (error) {
    next(error);
  }
});
router.put('/providers/:provider/:action', (req, res) => {
  const provider = aiBackbone.AI_PROVIDERS[req.params.provider];
  if (!provider || !['enable', 'disable'].includes(req.params.action)) {
    return res.status(404).json({ success: false, error: 'Provider or action not found' });
  }
  provider.enabled = req.params.action === 'enable';
  return res.json({ success: true, data: { provider: req.params.provider, available: provider.enabled } });
});
router.post('/optimize', async (req, res, next) => {
  try {
    const { target, parameters, constraints } = req.body || {};
    res.json(await gateway.optimize(target, parameters, constraints));
  } catch (error) {
    next(error);
  }
});
router.post('/analyze', async (req, res, next) => {
  try {
    const { target, data, analysisType } = req.body || {};
    res.json(await gateway.analyze(target, data, analysisType));
  } catch (error) {
    next(error);
  }
});

module.exports = router;