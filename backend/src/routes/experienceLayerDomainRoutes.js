/**
 * Real backend routes for ExperienceLayerPage.jsx, backed by
 * services/legacy/experienceLayerService.js. accessibility ->
 * conformanceSummary (best real match for an a11y conformance summary),
 * components -> listComponents, motion -> getMotion, themes -> listThemes,
 * contrast -> checkContrast (all name/shape differences).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/experienceLayerService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/experience-layer/accessibility', wrap(() => svc.conformanceSummary()));
router.get('/experience-layer/components', wrap((req) => svc.listComponents(req.query)));
router.post('/experience-layer/motion', wrap((req) => svc.getMotion({ reducedMotion: req.body.reducedMotion })));
router.get('/experience-layer/themes', wrap(() => svc.listThemes()));
router.post('/experience-layer/contrast', wrap((req) => svc.checkContrast(req.body.fg, req.body.bg, { largeText: req.body.large })));

module.exports = router;
