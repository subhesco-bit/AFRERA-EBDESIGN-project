'use strict';

/**
 * Village Governance Routes
 * Mounted by the normal backend route loader under /api/v1/village-governance.
 */

const express = require('express');
const router = express.Router();
const service = require('../services/villageGovernanceService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

router.use(authMiddleware);

router.post('/panchayats/:panchayatId/villages/:villageId/link', adminMiddleware, async (req, res) => {
  try {
    const data = await service.linkVillageToPanchayat(req.params.panchayatId, req.params.villageId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/villages/:villageId/panchayats', async (req, res) => {
  try {
    const data = await service.listVillagePanchayats(req.params.villageId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/villages/:villageId/councils', adminMiddleware, async (req, res) => {
  try {
    const data = await service.createVillageCouncil({ ...req.body, village_id: req.params.villageId });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/villages/:villageId/councils', async (req, res) => {
  try {
    const data = await service.listVillageCouncils(req.params.villageId, req.query.status);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/councils/:councilId/members', adminMiddleware, async (req, res) => {
  try {
    const data = await service.addCouncilMember(req.params.councilId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/councils/:councilId/members', async (req, res) => {
  try {
    const data = await service.listCouncilMembers(req.params.councilId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/villages/:villageId/groups', adminMiddleware, async (req, res) => {
  try {
    const data = await service.createVillageGroup({ ...req.body, village_id: req.params.villageId });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/villages/:villageId/groups', async (req, res) => {
  try {
    const data = await service.listVillageGroups(req.params.villageId, req.query.group_type);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/groups/:groupId/members', adminMiddleware, async (req, res) => {
  try {
    const data = await service.addGroupMember(req.params.groupId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/groups/:groupId/members', async (req, res) => {
  try {
    const data = await service.listGroupMembers(req.params.groupId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/villages/:villageId/summary', async (req, res) => {
  try {
    const data = await service.getVillageGovernanceSummary(req.params.villageId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
