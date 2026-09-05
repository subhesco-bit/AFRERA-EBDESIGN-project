/**
 * Wikipedia Knowledge Reference Routes.
 * See services/wikipediaService.js — real Wikimedia REST API integration,
 * 24h in-memory cache, honest null (not fabricated) when no match is found.
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const wikipediaService = require('../services/legacy/wikipediaService');
const { authMiddleware } = require('../middleware/auth');

router.get
    // Log request
    logger.debug('router.get request');('/lookup', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'q query parameter is required' });
    const result = await wikipediaService.lookup(q);
    if (!result) {
      return res.json({ success: true, data: null, message: `No Wikipedia reference found for "${q}"` });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/summary/:title', authMiddleware, async (req, res) => {
  try {
    const result = await wikipediaService.getSummaryByTitle(req.params.title);
    if (!result) {
      return res.status(404).json({ success: false, error: `No Wikipedia page found for "${req.params.title}"` });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
