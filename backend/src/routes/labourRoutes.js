'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const service = require('../services/labourService');

const router = express.Router();
router.use(authMiddleware);

const handle = (fn, successStatus = 200) => async (req, res, next) => {
  try {
    const data = await fn(req);
    res.status(successStatus).json({ success: true, data });
  } catch (error) {
    next(error);
  }
  // 2026-09-15: the closing brace above (and the ';' below) used to be
  // missing - only a lone CR separated it from the router.get('/workers',
  // ...) that follows, so every route registration below ran as dead code
  // inside handle()'s own catch block instead of at module scope. Same
  // bug shape as seedVaultRoutes_merged.js/unifiedAIRoutes_merged.js/
  // trackDartRoutes_merged.js earlier this session - node -c and
  // require() both stayed silent, only a live request would have caught
  // it (this file was never mounted, so nothing had yet).
};

router.get('/workers', handle(() => service.listWorkers()));
router.post('/workers', handle((req) => service.createWorker(req.body), 201));
router.put('/workers/:id', handle((req) => service.updateWorker(req.params.id, req.body)));
router.get('/attendance', handle(() => service.listAttendance()));
router.post('/attendance', handle((req) => service.recordAttendance(req.body), 201));
router.get('/payments', handle(() => service.listPayments()));
router.post('/payments', handle((req) => service.recordPayment(req.body), 201));

module.exports = router;