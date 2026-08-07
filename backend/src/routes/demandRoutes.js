/**
 * Demand routes. Reads are public (a farmer should see market signal without
 * an account); nothing here writes.
 */
const express = require('express');
const router = express.Router();
const demandService = require('../services/demandService');

const fail = (res, e) => res.status(/required/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

router.get('/forecast', async (req, res) => {
  try { res.json({ success: true, data: await demandService.getForecast(req.query) }); }
  catch (e) { fail(res, e); }
});

router.get('/heatmap', async (req, res) => {
  try { res.json({ success: true, data: await demandService.getHeatmap(req.query) }); }
  catch (e) { fail(res, e); }
});

router.get('/mandi-signal', async (req, res) => {
  try { res.json({ success: true, data: await demandService.getMandiSignal(req.query) }); }
  catch (e) { fail(res, e); }
});

module.exports = router;
