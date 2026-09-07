// Routes for M029 - Farmer Health & Welfare
const express = require('express');
const router = express.Router();
const farmerHealthService = require('../../modules/M029/service');
const { authMiddleware } = require('../../middleware/auth');
const { adminMiddleware } = require('../../middleware/admin');
const { resolveFarmerId } = require('../../middleware/resolveFarmerId');

/**
 * SECURITY FIX (H4, 2026-08-16): every route below previously had zero
 * authentication and no ownership check, letting any unauthenticated caller
 * CRUD any farmer's health/welfare record (PII). All 8 routes now require
 * authMiddleware. Routes that accept an explicit farmerId (list,
 * health-summary, welfare-enrollment) are scoped to the caller's OWN
 * resolved farmerId via the shared resolveFarmerId middleware (same pattern
 * already used correctly in farmerPortalEnhancements.js /
 * middleware/resolveFarmerId.js), unless the caller is an admin - mirroring
 * the authMiddleware+adminMiddleware convention already used for privileged
 * operations in sibling route files (farmerRoutes.js,
 * farmerPortalEnhancements.js). DELETE is admin-only as the safest interim
 * posture for a destructive operation with no ownership signal available.
 *
 * KNOWN RESIDUAL GAP (out of scope for this fix, flagged separately):
 * farmerHealthService here resolves to modules/M029/service.js, a generic
 * scaffold whose listItems/getItem/createItem/updateItem/deleteItem accept
 * neither a farmerId filter nor any of the method names this router actually
 * calls (listHealthRecords/getHealthRecord/createHealthRecord/
 * updateHealthRecord/deleteHealthRecord/getFarmerHealthSummary/
 * getWelfarePrograms/enrollWelfareProgram are not exported by that module) -
 * every route below already throws "... is not a function" at runtime
 * independent of auth, even though the real schema
 * (013_farmer_health_welfare_module.sql) has a proper farmer_id column on
 * farmer_health_records/welfare_enrollments. That is a separate "wrong
 * service wired up" bug (same class as FIXES.md M1), not an auth-boundary
 * issue, so per-record ownership (GET/PUT /health-records/:id) can't be
 * fully enforced until the real service is wired in.
 */

// Admin bypass wrapper around the shared resolveFarmerId middleware: admins
// don't have a farmers row, so they skip scoping and may act on any
// farmerId they explicitly pass; everyone else gets scoped to their own.
function selfScopeUnlessAdmin(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  return resolveFarmerId(req, res, next);
}

function isAdmin(req) {
  return req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
}

// Health Records Routes
router.get('/health-records', authMiddleware, selfScopeUnlessAdmin, async (req, res) => {
  try {
    const { page, limit, farmerId } = req.query;
    // Non-admins are always scoped to their own resolved farmerId, regardless
    // of what farmerId they pass in the query string.
    const scopedFarmerId = isAdmin(req)
      ? (farmerId ? parseInt(farmerId) : null)
      : req.farmerId;
    const result = await farmerHealthService.listHealthRecords({
      page: parseInt(page),
      limit: parseInt(limit),
      farmerId: scopedFarmerId
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/health-records/:id', authMiddleware, async (req, res) => {
  try {
    const record = await farmerHealthService.getHealthRecord(parseInt(req.params.id));
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/health-records', authMiddleware, selfScopeUnlessAdmin, async (req, res) => {
  try {
    const payload = isAdmin(req) ? req.body : { ...req.body, farmerId: req.farmerId };
    const record = await farmerHealthService.createHealthRecord(payload);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/health-records/:id', authMiddleware, async (req, res) => {
  try {
    const record = await farmerHealthService.updateHealthRecord(parseInt(req.params.id), req.body);
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/health-records/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deleted = await farmerHealthService.deleteHealthRecord(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Farmer Health Summary
router.get('/farmers/:farmerId/health-summary', authMiddleware, selfScopeUnlessAdmin, async (req, res) => {
  try {
    const requestedFarmerId = parseInt(req.params.farmerId);
    if (!isAdmin(req) && req.farmerId !== requestedFarmerId) {
      return res.status(403).json({ error: 'You may only view your own health summary' });
    }
    const summary = await farmerHealthService.getFarmerHealthSummary(requestedFarmerId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Welfare Programs Routes
router.get('/welfare-programs', authMiddleware, async (req, res) => {
  try {
    const { page, limit, eligibility } = req.query;
    const result = await farmerHealthService.getWelfarePrograms({
      page: parseInt(page),
      limit: parseInt(limit),
      eligibility
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/welfare-enrollments', authMiddleware, selfScopeUnlessAdmin, async (req, res) => {
  try {
    const { programId } = req.body;
    const farmerId = isAdmin(req) ? parseInt(req.body.farmerId) : req.farmerId;
    const enrollment = await farmerHealthService.enrollWelfareProgram(
      parseInt(farmerId),
      parseInt(programId)
    );
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
