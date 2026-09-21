/**
 * Real backend routes for LogisticsMatchingPage.jsx's return-load-board
 * widget, backed by services/legacy/returnLoadBoardService.js.
 * postedBy filled from the authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/returnLoadBoardService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.post('/return-load-board/capacity', wrap((req) => svc.postCapacity(req.user.id, req.body)));
router.get('/return-load-board/search', wrap((req) => svc.searchAvailable(req.query)));
router.post('/return-load-board/posting/:postingId/book', wrap((req) => svc.bookPosting(req.params.postingId, req.body.shipmentId)));
router.post('/return-load-board/posting/:postingId/cancel', wrap((req) => svc.cancelPosting(req.params.postingId, req.user.id)));

module.exports = router;
