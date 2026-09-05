/**
 * Regional Variety Directory Routes.
 * See services/regionalVarietyService.js. Public GET endpoints (browsing
 * the directory is educational/discovery content, not sensitive), write
 * endpoints (image request, create-listing) require auth.
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const regionalVarietyService = require('../services/legacy/regionalVarietyService');
const { authMiddleware } = require('../middleware/auth');

router.get
    // Log request
    logger.debug('router.get request');('/', async (req, res) => {
  try {
    const { category, giStatus, state, search } = req.query;
    const varieties = await regionalVarietyService.list({ category, giStatus, state, search });
    res.json({ success: true, count: varieties.length, data: varieties });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/categories', async (req, res) => {
  try {
    const categories = await regionalVarietyService.listCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/:id', async (req, res) => {
  try {
    const variety = await regionalVarietyService.getById(req.params.id);
    res.json({ success: true, data: variety });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post
    // Log request
    logger.debug('router.post request');('/:id/generate-image', authMiddleware, async (req, res) => {
  try {
    const result = await regionalVarietyService.requestVarietyImage(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post
    // Log request
    logger.debug('router.post request');('/:id/create-listing', authMiddleware, async (req, res) => {
  try {
    const product = await regionalVarietyService.createListingFromVariety(req.params.id, {
      ...req.body,
      sellerId: req.body.sellerId || req.user?.id,
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
