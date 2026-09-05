/**
 * Revenue routes. Authenticated throughout — revenue is not public, and
 * allocation changes what a farmer was promised.
 */
const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const revenueService = require('../services/legacy/revenueService');
const { authMiddleware } = require('../middleware/auth');

const fail = (res, e) => res.status(/required|must|not found/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

router.get
    // Log request
    logger.debug('router.get request');('/overview', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await revenueService.getOverview(req.query) }); }
  catch (e) { fail(res, e); }
});

/**
 * Returns a PROPOSED allocation with applied:false. That is a 200 — the
 * service declining to auto-apply is the designed behaviour, not a failure.
 */
router.post
    // Log request
    logger.debug('router.post request');('/allocate', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await revenueService.allocateChannels(req.body) }); }
  catch (e) { fail(res, e); }
});

module.exports = router;
