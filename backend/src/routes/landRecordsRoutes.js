/**
 * Land Records Routes
 *
 * (2026-08-29) landRecordsService.js (468 lines, real, table-backed against
 * land_records - migration 011_farmer_portal_enhancements.sql) was never
 * required anywhere in index.js - a genuinely orphaned service. Wired here.
 * Also fixed a real honesty bug in the service itself: the government-sync
 * simulation was a silent empty-array no-op dressed up as a real sync -
 * see landRecordsService.js's fetchGovernmentLandRecords() for the fix.
 */

'use strict';

const express = require('express');
const router = express.Router();
const landRecordsService = require('../services/legacy/landRecordsService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const result = await landRecordsService.addLandRecord(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    let result = await landRecordsService.getFarmerLandRecords(req.user.id, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/regional-statistics', async (req, res) => {
  try {
    let result = await landRecordsService.getRegionalLandStatistics(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:recordId', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let result = await landRecordsService.getLandRecord(req.params.recordId, req.user.id, isAdmin);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.put('/:recordId', authMiddleware, async (req, res) => {
  try {
    let result = await landRecordsService.updateLandRecord(req.params.recordId, req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:recordId', authMiddleware, async (req, res) => {
  try {
    let result = await landRecordsService.deleteLandRecord(req.params.recordId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:recordId/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let result = await landRecordsService.verifyLandRecord(req.params.recordId, req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/sync-government', authMiddleware, async (req, res) => {
  try {
    let result = await landRecordsService.syncWithGovernmentLandRecords(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
