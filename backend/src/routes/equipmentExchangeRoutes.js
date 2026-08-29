/**
 * Second-Use Equipment Exchange Routes. See services/equipmentExchangeService.js.
 */

const express = require('express');
const router = express.Router();
const equipmentExchangeService = require('../services/legacy/equipmentExchangeService');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const listing = await equipmentExchangeService.createListing(req.user.id, req.body);
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { equipmentType, stateId, pricingType } = req.query;
    const listings = await equipmentExchangeService.listAvailable({
      equipmentType, stateId: stateId ? Number(stateId) : undefined, pricingType,
    });
    res.json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:listingId', async (req, res) => {
  try {
    const listing = await equipmentExchangeService.getListing(req.params.listingId);
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/:listingId/reserve', authMiddleware, async (req, res) => {
  try {
    const listing = await equipmentExchangeService.reserveListing(req.params.listingId, req.user.id);
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:listingId/complete', authMiddleware, async (req, res) => {
  try {
    const listing = await equipmentExchangeService.completeExchange(req.params.listingId, req.user.id);
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:listingId', authMiddleware, async (req, res) => {
  try {
    const listing = await equipmentExchangeService.withdrawListing(req.params.listingId, req.user.id);
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
