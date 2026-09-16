/**
 * Public Data Routes — REST wrapper for
 * services/publicDataExtractorService.js's real, DB-backed
 * (public_data_sources/public_data_extraction_runs/public_data_records
 * tables) listSources/registerSource/extractDataset methods, matching
 * PublicDataExtractorPage.jsx's publicDataAPI.listSources()/
 * .registerSource()/.extract() calls - this file used to be a dead
 * "Route operational" scaffold with no connection to that service at
 * all.
 */

'use strict';

const express = require('express');
const publicDataExtractorService = require('../services/publicDataExtractorService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/sources', async (req, res, next) => {
  try {
    const sources = await publicDataExtractorService.listSources();
    res.json({ success: true, data: sources });
  } catch (error) {
    next(error);
  }
});

router.post('/sources', async (req, res, next) => {
  try {
    const source = await publicDataExtractorService.registerSource(req.body, req.user.id);
    res.json({ success: true, data: source });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/sources/:sourceId/extract', async (req, res, next) => {
  try {
    const result = await publicDataExtractorService.extractDataset(req.params.sourceId, req.body, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
