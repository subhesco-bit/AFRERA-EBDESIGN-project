/**
 * Return-Load Board Routes. See services/returnLoadBoardService.js.
 */

const express = require('express');
const router = express.Router();
const returnLoadBoardService = require('../services/returnLoadBoardService');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const posting = await returnLoadBoardService.postCapacity(req.user.id, req.body);
    res.status(201).json({ success: true, data: posting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { originAddress, destinationAddress, minCapacityKg } = req.query;
    const postings = await returnLoadBoardService.searchAvailable({ originAddress, destinationAddress, minCapacityKg });
    res.json({ success: true, count: postings.length, data: postings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:postingId/book', authMiddleware, async (req, res) => {
  try {
    const posting = await returnLoadBoardService.bookPosting(req.params.postingId, req.body.shipmentId);
    res.json({ success: true, data: posting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:postingId', authMiddleware, async (req, res) => {
  try {
    const posting = await returnLoadBoardService.cancelPosting(req.params.postingId, req.user.id);
    res.json({ success: true, data: posting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
