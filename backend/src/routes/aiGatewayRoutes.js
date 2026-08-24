/**
 * AI Gateway API Routes
 *
 * This file was written against a multi-provider LLM router shape
 * (routeRequest/providers/getAvailableModels/setProviderEnabled), but the real
 * aiGatewayService.js implements a different thing entirely - a predict/optimize/
 * analyze/recommend ML service (see its module.exports). No file anywhere in
 * backend/src/services implements routeRequest, providers, getAvailableModels or
 * setProviderEnabled, and no frontend page calls /api/v1/ai-gateway/* - this is
 * unbuilt capability, not a wiring bug. Every route below returns 501 rather than
 * crashing with ReferenceError. Building the actual multi-provider gateway is new
 * feature scope, not an audit fix.
 */

const express = require('express');
const router = express.Router();

const notImplemented = (feature) => (req, res) => {
  res.status(501).json({ success: false, error: `${feature} is not implemented`, code: 'NOT_IMPLEMENTED' });
};

router.post('/chat', notImplemented('Multi-provider AI gateway chat'));
router.get('/statistics', notImplemented('AI gateway statistics'));
router.get('/providers', notImplemented('AI provider registry'));
router.get('/models/:provider', notImplemented('AI provider model listing'));
router.put('/providers/:provider/enable', notImplemented('AI provider enable/disable'));
router.put('/providers/:provider/disable', notImplemented('AI provider enable/disable'));

router.post('/stream', notImplemented('Multi-provider AI gateway streaming'));

module.exports = router;
