/**
 * Project Systems Routes — AF-PS.
 * Projects, work breakdown structure, milestones, WBS cost rollup and
 * budget-vs-actual against the posted general ledger.
 * See backend/src/services/projectSystemsService.js for scope notes.
 */

const express = require('express');
const router = express.Router();
const projectSystemsService = require('../services/projectSystemsService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

// Projects
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const project = await projectSystemsService.createProject(req.body);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { companyId, ...filters } = req.query;
    const projects = await projectSystemsService.getProjects(companyId, filters);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await projectSystemsService.getProject(req.params.projectId);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(error.message === 'Project not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

router.post('/:projectId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, actualStartDate, actualEndDate } = req.body;
    const project = await projectSystemsService.updateProjectStatus(
      req.params.projectId, status, { actualStartDate, actualEndDate }
    );
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Work Breakdown Structure
router.post('/:projectId/wbs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const wbs = await projectSystemsService.createWbsElement(req.params.projectId, req.body);
    res.json({ success: true, data: wbs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:projectId/wbs', authMiddleware, async (req, res) => {
  try {
    const wbs = await projectSystemsService.getProjectWbs(req.params.projectId);
    res.json({ success: true, data: wbs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:projectId/wbs/rollup', authMiddleware, async (req, res) => {
  try {
    const rollup = await projectSystemsService.getWbsCostRollup(req.params.projectId);
    res.json({ success: true, data: rollup });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/wbs/:wbsId', authMiddleware, async (req, res) => {
  try {
    const wbs = await projectSystemsService.getWbsElement(req.params.wbsId);
    res.json({ success: true, data: wbs });
  } catch (error) {
    res.status(error.message === 'WBS element not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

router.post('/wbs/:wbsId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, actualStartDate, actualEndDate } = req.body;
    const wbs = await projectSystemsService.updateWbsStatus(
      req.params.wbsId, status, { actualStartDate, actualEndDate }
    );
    res.json({ success: true, data: wbs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Milestones
router.post('/:projectId/milestones', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const milestone = await projectSystemsService.createMilestone(req.params.projectId, req.body);
    res.json({ success: true, data: milestone });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:projectId/milestones', authMiddleware, async (req, res) => {
  try {
    const milestones = await projectSystemsService.getProjectMilestones(req.params.projectId, req.query);
    res.json({ success: true, data: milestones });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:projectId/milestones/summary', authMiddleware, async (req, res) => {
  try {
    const summary = await projectSystemsService.getMilestoneStatusSummary(req.params.projectId, req.query.asOfDate);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/milestones/:milestoneId/complete', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { actualCompletionDate } = req.body;
    const milestone = await projectSystemsService.completeMilestone(req.params.milestoneId, actualCompletionDate);
    res.json({ success: true, data: milestone });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Budget vs. Actual
router.get('/:projectId/budget-vs-actual', authMiddleware, async (req, res) => {
  try {
    const report = await projectSystemsService.getProjectBudgetVsActual(req.params.projectId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
