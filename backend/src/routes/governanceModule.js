/**
 * Governance Module Routes
 * API endpoints for Village Management, Panchayat Integration, CSR Tracking, and Compliance
 */

const express = require('express');
const router = express.Router();
const governanceService = require('../services/legacy/governanceService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { PROCUREMENT_ROLES } = require('../middleware/roleGroups');
const { adminMiddleware } = require('../middleware/admin');
const { authRateLimit } = require('../middleware/rateLimiter');

// Village Management Routes
router.post('/villages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const village = await governanceService.createVillage(req.body);
    res.json({ success: true, data: village });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/villages', authMiddleware, async (req, res) => {
  try {
    const villages = await governanceService.getVillages(req.query);
    res.json({ success: true, data: villages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/villages/:villageId', authMiddleware, async (req, res) => {
  try {
    const { villageId } = req.params;
    let village = await governanceService.getVillage(villageId);
    res.json({ success: true, data: village });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/villages/:villageId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { villageId } = req.params;
    let village = await governanceService.updateVillage(villageId, req.body);
    res.json({ success: true, data: village });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Panchayat Integration Routes
router.post('/panchayats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const panchayat = await governanceService.createPanchayat(req.body);
    res.json({ success: true, data: panchayat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/panchayats', authMiddleware, async (req, res) => {
  try {
    const panchayats = await governanceService.getPanchayats(req.query);
    res.json({ success: true, data: panchayats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/panchayats/:panchayatId', authMiddleware, async (req, res) => {
  try {
    const { panchayatId } = req.params;
    let panchayat = await governanceService.getPanchayat(panchayatId);
    res.json({ success: true, data: panchayat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/panchayats/:panchayatId/schemes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { panchayatId } = req.params;
    const scheme = await governanceService.addPanchayatScheme(panchayatId, req.body);
    res.json({ success: true, data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CSR Tracking Routes
router.post('/csr-projects', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const project = await governanceService.createCSRProject(req.body);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/csr-projects', authMiddleware, async (req, res) => {
  try {
    const projects = await governanceService.getCSRProjects(req.query);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/csr-projects/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    let project = await governanceService.getCSRProject(projectId);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/csr-projects/:projectId', authRateLimit, authMiddleware, requireRole(...PROCUREMENT_ROLES), async (req, res) => {
  try {
    const { projectId } = req.params;
    let project = await governanceService.updateCSRProject(projectId, req.body);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/csr-projects/:projectId/contributions', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const contribution = await governanceService.addCSRContribution(projectId, req.user.id, req.body);
    res.json({ success: true, data: contribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/csr/statistics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await governanceService.getCSRStatistics(req.query);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compliance Routes
router.post('/compliance-reports', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const report = await governanceService.createComplianceReport(req.body);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/compliance-reports', authMiddleware, async (req, res) => {
  try {
    const reports = await governanceService.getComplianceReports(req.query);
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/compliance-reports/:reportId', authMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params;
    let report = await governanceService.getComplianceReport(reportId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/compliance-reports/:reportId/review', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params;
    let report = await governanceService.reviewComplianceReport(reportId, req.user.id, req.body);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/compliance/statistics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let stats = await governanceService.getComplianceStatistics(req.query);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Platform intermediary-compliance readiness (FSSAI/Grievance/Nodal/GSTIN)
router.get('/compliance/gaps', authMiddleware, async (req, res) => {
  try {
    const data = await governanceService.complianceGaps();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/compliance/ready', authMiddleware, async (req, res) => {
  try {
    const isReady = await governanceService.complianceReady();
    res.json({ success: true, data: { isReady } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cooperative Management Routes
router.post('/cooperatives', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const cooperative = await governanceService.createCooperative(req.body);
    res.json({ success: true, data: cooperative });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cooperatives', authMiddleware, async (req, res) => {
  try {
    const cooperatives = await governanceService.getCooperatives(req.query);
    res.json({ success: true, data: cooperatives });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/cooperatives/:cooperativeId/members', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { cooperativeId } = req.params;
    const membership = await governanceService.addCooperativeMember(cooperativeId, req.user.id, req.body);
    res.json({ success: true, data: membership });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
