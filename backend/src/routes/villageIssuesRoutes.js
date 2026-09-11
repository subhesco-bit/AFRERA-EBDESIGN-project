'use strict';

const express = require('express');
const authMiddleware = require('../middleware/auth');
const villageIssuesService = require('../services/legacy/villageIssuesService');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try { res.json({ success: true, data: await villageIssuesService.listIssues(req.query) }); }
  catch (error) { next(error); }
});

router.get('/summary/:villageId', async (req, res, next) => {
  try { res.json({ success: true, data: await villageIssuesService.getVillageIssueSummary(req.params.villageId) }); }
  catch (error) { next(error); }
});

router.get('/:issueId', async (req, res, next) => {
  try { res.json({ success: true, data: await villageIssuesService.getIssue(req.params.issueId) }); }
  catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await villageIssuesService.createIssue(req.body) }); }
  catch (error) { next(error); }
});

router.patch('/:issueId', async (req, res, next) => {
  try { res.json({ success: true, data: await villageIssuesService.updateIssue(req.params.issueId, req.body, req.user || {}) }); }
  catch (error) { next(error); }
});

router.post('/:issueId/updates', async (req, res, next) => {
  try {
    res.status(201).json({ success: true, data: await villageIssuesService.addIssueUpdate(req.params.issueId, {
      ...req.body,
      actor_id: req.user?.id || req.body.actor_id,
      actor_role: req.user?.role || req.body.actor_role,
    }) });
  } catch (error) { next(error); }
});

module.exports = router;
