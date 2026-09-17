// Routes for M029 - Farmer Health & Welfare
const express = require('express');
const router = express.Router();
// 2026-09-17: was require('../../modules/M029/service'), the generic M029
// scaffold whose listItems/getItem/... don't export any of the 8 method
// names this router calls (listHealthRecords/getWelfarePrograms/
// enrollWelfareProgram/...) - every route below threw "... is not a
// function" at runtime regardless of auth, a gap this file's own comments
// already flagged. services/farmerHealthService.js (top-level, not the
// M029 scaffold) was written specifically to implement the 8 methods this
// router expects, against the real schema (013_farmer_health_welfare_module.sql:
// farmer_health_records, welfare_programs, welfare_enrollments), but was
// never wired in here. Swapped to the real service; no route logic changed.
const farmerHealthService = require('../../services/farmerHealthService');
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
 * RESOLVED (2026-09-17): the gap noted above (farmerHealthService resolving
 * to the M029 scaffold, which threw "... is not a function" on every call
 * independent of auth) is fixed - this file now requires the real top-level
 * services/farmerHealthService.js. Per-record ownership on GET/PUT
 * /health-records/:id is now fully enforced: both routes carry
 * selfScopeUnlessAdmin (populating req.farmerId for non-admins) and pass
 * { farmerId, isAdmin } through to the service's own ownership check.
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

router.get('/health-records/:id', authMiddleware, selfScopeUnlessAdmin, async (req, res) => {
  try {
    // 2026-09-17: was calling getHealthRecord(id) with no second argument.
    // The service's ownership check is `!isAdmin && record.farmer_id !== farmerId`
    // - with both defaulted (isAdmin=false, farmerId=null) this returned null
    // (404) for every real record, admin or not, since farmer_id is never
    // actually null. Passing the resolved caller identity fixes it. Also
    // added the missing selfScopeUnlessAdmin middleware (already used on
    // LIST/POST above) - without it req.farmerId was never populated for
    // non-admins, so a real farmer would still 404 on their own record even
    // with the argument fix, while admins alone would work.
    const record = await farmerHealthService.getHealthRecord(parseInt(req.params.id), { farmerId: req.farmerId, isAdmin: isAdmin(req) });
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
    // 2026-09-17: same options-argument omission as GET /:id above -
    // createHealthRecord(payload) with no second arg meant isAdmin was
    // always false inside the service, so its
    // `isAdmin && payload.farmerId ? payload.farmerId : farmerId` always
    // took the `: farmerId` branch, i.e. the defaulted `null` - every
    // create failed with "farmerId is required" regardless of what the
    // route already merged into payload. Passing the resolved identity as
    // the second argument fixes it.
    const payload = isAdmin(req) ? req.body : { ...req.body, farmerId: req.farmerId };
    const record = await farmerHealthService.createHealthRecord(payload, { farmerId: req.farmerId, isAdmin: isAdmin(req) });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/health-records/:id', authMiddleware, selfScopeUnlessAdmin, async (req, res) => {
  try {
    // 2026-09-17: same options-argument omission - updateHealthRecord's
    // `!isAdmin && existing.farmer_id !== farmerId` always evaluated true
    // (isAdmin/farmerId both defaulted), so every update 404'd regardless
    // of who owned the record. Also added the missing selfScopeUnlessAdmin
    // middleware (see GET /:id above) so req.farmerId is actually populated
    // for non-admins.
    const record = await farmerHealthService.updateHealthRecord(parseInt(req.params.id), req.body, { farmerId: req.farmerId, isAdmin: isAdmin(req) });
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
    // 2026-09-17: same options-argument omission - deleteHealthRecord's
    // ownership check always evaluated true (isAdmin/farmerId both
    // defaulted), so every delete 404'd even though this route is already
    // admin-only.
    const deleted = await farmerHealthService.deleteHealthRecord(parseInt(req.params.id), { farmerId: req.farmerId, isAdmin: isAdmin(req) });
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
