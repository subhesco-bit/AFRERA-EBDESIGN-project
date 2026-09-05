/**
 * Project Systems Routes — AF-PS.
 * Projects, work breakdown structure, milestones, WBS cost rollup and
 * budget-vs-actual against the posted general ledger.
 * See backend/src/services/projectSystemsService.js for scope notes.
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const projectSystemsService = require('../services/legacy/projectSystemsService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

// Projects
router.post
    // Log request
    logger.debug('router.post request');('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const project = await projectSystemsService.createProject(req.body);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/', authMiddleware, async (req, res) => {
  try {
    const { companyId, ...filters } = req.query;
    const projects = await projectSystemsService.getProjects(companyId, filters);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/:projectId', authMiddleware, async (req, res) => {
  try {
    let project = await projectSystemsService.getProject(req.params.projectId);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(error.message === 'Project not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

router.post
    // Log request
    logger.debug('router.post request');('/:projectId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, actualStartDate, actualEndDate } = req.body;
    let project = await projectSystemsService.updateProjectStatus(
      req.params.projectId, status, { actualStartDate, actualEndDate }
    );
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Work Breakdown Structure
router.post
    // Log request
    logger.debug('router.post request');('/:projectId/wbs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const wbs = await projectSystemsService.createWbsElement(req.params.projectId, req.body);
    res.json({ success: true, data: wbs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/:projectId/wbs', authMiddleware, async (req, res) => {
  try {
    let wbs = await projectSystemsService.getProjectWbs(req.params.projectId);
    res.json({ success: true, data: wbs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/:projectId/wbs/rollup', authMiddleware, async (req, res) => {
  try {
    const rollup = await projectSystemsService.getWbsCostRollup(req.params.projectId);
    res.json({ success: true, data: rollup });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/wbs/:wbsId', authMiddleware, async (req, res) => {
  try {
    let wbs = await projectSystemsService.getWbsElement(req.params.wbsId);
    res.json({ success: true, data: wbs });
  } catch (error) {
    res.status(error.message === 'WBS element not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

router.post
    // Log request
    logger.debug('router.post request');('/wbs/:wbsId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, actualStartDate, actualEndDate } = req.body;
    let wbs = await projectSystemsService.updateWbsStatus(
      req.params.wbsId, status, { actualStartDate, actualEndDate }
    );
    res.json({ success: true, data: wbs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Milestones
router.post
    // Log request
    logger.debug('router.post request');('/:projectId/milestones', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const milestone = await projectSystemsService.createMilestone(req.params.projectId, req.body);
    res.json({ success: true, data: milestone });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/:projectId/milestones', authMiddleware, async (req, res) => {
  try {
    const milestones = await projectSystemsService.getProjectMilestones(req.params.projectId, req.query);
    res.json({ success: true, data: milestones });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/:projectId/milestones/summary', authMiddleware, async (req, res) => {
  try {
    const summary = await projectSystemsService.getMilestoneStatusSummary(req.params.projectId, req.query.asOfDate);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post
    // Log request
    logger.debug('router.post request');('/milestones/:milestoneId/complete', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { actualCompletionDate } = req.body;
    let milestone = await projectSystemsService.completeMilestone(req.params.milestoneId, actualCompletionDate);
    res.json({ success: true, data: milestone });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Budget vs. Actual
router.get
    // Log request
    logger.debug('router.get request');('/:projectId/budget-vs-actual', authMiddleware, async (req, res) => {
  try {
    const report = await projectSystemsService.getProjectBudgetVsActual(req.params.projectId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
