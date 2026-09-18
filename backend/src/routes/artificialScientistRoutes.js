'use strict';

const express = require('express');
const scientist = require('../services/research/artificialScientistService');
const { authMiddleware, requireRole, userRateLimit } = require('../middleware/auth');

const router = express.Router();
const access = requireRole('researcher', 'research_lead', 'admin', 'super_admin');
const write = requireRole('researcher', 'research_lead', 'admin', 'super_admin');
const review = requireRole('research_lead', 'admin', 'super_admin');
const aiLimit = userRateLimit(20, 60_000);
const actor = (req) => req.user.id;
const wrap = (fn, created = false) => async (req, res) => {
  try { res.status(created ? 201 : 200).json({ success: true, data: await fn(req) }); }
  catch (error) { res.status(/not found/i.test(error.message) ? 404 : 400).json({ success: false, error: error.message }); }
};

router.use(authMiddleware);
router.post('/hypotheses', write, wrap((req) => scientist.createHypothesis(req.body, actor(req)), true));
router.get('/hypotheses/:id', access, wrap((req) => scientist.getResearchRecord('hypothesis', req.params.id)));
router.post('/hypotheses/:id/review', review, wrap((req) => scientist.reviewHypothesis(req.params.id, req.body.decision, actor(req), req.body)));
router.post('/experiments', write, wrap((req) => scientist.createExperiment(req.body, actor(req)), true));
router.get('/experiments/:id', access, wrap((req) => scientist.getResearchRecord('experiment', req.params.id)));
router.post('/experiments/:id/protocols', write, wrap((req) => scientist.reviseProtocol(req.params.id, req.body.protocol, actor(req)), true));
router.get('/protocols/:id', access, wrap((req) => scientist.getResearchRecord('protocol', req.params.id)));
router.post('/protocols/:id/review', review, wrap((req) => scientist.reviewProtocol(req.params.id, req.body.decision, req.body.comments, req.body.checklist, actor(req))));
router.post('/experiments/:id/transition', review, wrap((req) => scientist.transitionExperiment(req.params.id, req.body.state, actor(req))));
router.post('/experiments/:id/runs', write, wrap((req) => scientist.createRun(req.params.id, req.body, actor(req)), true));
router.get('/runs/:id', access, wrap((req) => scientist.getResearchRecord('run', req.params.id)));
router.post('/runs/:id/transition', write, wrap((req) => scientist.transitionRun(req.params.id, req.body.state, req.body, actor(req))));
router.post('/artifacts', write, wrap((req) => scientist.addArtifact(req.body.parent || {}, req.body, actor(req)), true));
router.post('/:entityType/:id/reviews', review, wrap((req) => scientist.recordReview(req.params.entityType, req.params.id, req.body, actor(req)), true));
router.post('/ai-assistance', write, aiLimit, wrap((req) => scientist.requestAIAssistance(req.body, actor(req)), true));

module.exports = router;
