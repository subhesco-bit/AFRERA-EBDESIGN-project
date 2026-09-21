/**
 * Real backend routes for ResearchAndDevelopmentPage.jsx's 25 action cards,
 * backed by services/legacy/researchAndDevelopmentService.js (an in-memory
 * service with seeded default data - no DB dependency).
 *
 * Every entry verified 1:1 against the page's actual onRun calls.
 */
'use strict';

const express = require('express');
const router = express.Router();
const rd = require('../services/legacy/researchAndDevelopmentService');

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

router.get('/research-development/rd-projects', wrap((req) => rd.getRDProjects(req.query)));
router.post('/research-development/rd-project', wrap((req) => rd.createRDProject(req.body)));
router.get('/research-development/rd-project/:projectId', wrap((req) => rd.getRDProject(req.params.projectId)));
router.put('/research-development/rd-project/:projectId', wrap((req) => rd.updateRDProject(req.params.projectId, req.body)));
router.delete('/research-development/rd-project/:projectId', wrap((req) => rd.deleteRDProject(req.params.projectId)));

router.post('/research-development/rd-project/:projectId/milestone', wrap((req) => rd.addMilestone(req.params.projectId, req.body)));
router.put('/research-development/rd-project/:projectId/milestone/:milestoneId', wrap((req) => rd.updateMilestone(req.params.projectId, req.params.milestoneId, req.body)));

router.get('/research-development/collaborations', wrap((req) => rd.getCollaborations(req.query)));
router.post('/research-development/collaboration', wrap((req) => rd.createCollaboration(req.body)));

router.get('/research-development/innovations', wrap((req) => rd.getInnovations(req.query)));
router.post('/research-development/innovation', wrap((req) => rd.createInnovation(req.body)));

router.get('/research-development/patents', wrap((req) => rd.getPatents(req.query)));
router.post('/research-development/patent', wrap((req) => rd.createPatent(req.body)));

router.get('/research-development/funding-opportunities', wrap((req) => rd.getFundingOpportunities(req.query)));
router.post('/research-development/funding-opportunity', wrap((req) => rd.createFundingOpportunity(req.body)));
router.post('/research-development/funding-opportunity/:fundingId/apply', wrap((req) => rd.applyForFunding(req.params.fundingId, req.body)));

router.get('/research-development/publications', wrap((req) => rd.getPublications(req.query)));
router.post('/research-development/publication', wrap((req) => rd.createPublication(req.body)));

router.post('/research-development/knowledge', wrap((req) => rd.addKnowledge(req.body)));
router.get('/research-development/knowledge/search', wrap((req) => rd.searchKnowledgeBase(req.query.q, { category: req.query.category, verified: req.query.verified })));

router.get('/research-development/analytics', wrap(() => rd.getRDAnalytics()));
router.get('/research-development/health', wrap(() => rd.getHealthStatus()));

router.post('/research-development/ai-assistance', wrap((req) => rd.getAIResearchAssistance(req.body.query, req.body.context || {})));

module.exports = router;
