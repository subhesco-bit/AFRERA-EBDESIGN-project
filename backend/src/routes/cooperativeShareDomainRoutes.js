/**
 * Real backend routes for CooperativeSharePage.jsx, backed by
 * services/legacy/cooperativeShareService.js. previewDistribution ->
 * computeDistribution (preview = compute without persisting); all other
 * methods are exact name matches.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/cooperativeShareService');

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

router.post('/cooperative-share/member', wrap((req) => svc.addMember(req.body)));
router.get('/cooperative-share/members/:fpoId', wrap((req) => svc.listMembers(req.params.fpoId)));
router.get('/cooperative-share/paid-up-capital/:fpoId', wrap((req) => svc.getPaidUpCapital(req.params.fpoId)));
router.post('/cooperative-share/distribution/preview', wrap((req) => svc.computeDistribution(req.body)));
router.post('/cooperative-share/distribution', wrap((req) => svc.createDistribution(req.body)));
router.get('/cooperative-share/distribution/:id', wrap((req) => svc.getDistribution(req.params.id)));
router.get('/cooperative-share/distributions/:fpoId', wrap((req) => svc.listDistributions(req.params.fpoId)));

module.exports = router;
