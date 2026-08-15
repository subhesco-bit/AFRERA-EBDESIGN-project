/**
 * Glut Early-Warning Routes. See services/glutWarningService.js.
 */

const express = require('express');
const router = express.Router();
const glutWarningService = require('../services/glutWarningService');
const { authMiddleware } = require('../middleware/auth');

router.get('/check', authMiddleware, async (req, res) => {
  try {
    const { categoryId, stateId } = req.query;
    const result = await glutWarningService.checkGlutRisk(
      categoryId ? Number(categoryId) : undefined,
      stateId ? Number(stateId) : undefined
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/scan', authMiddleware, async (req, res) => {
  try {
    const { stateId } = req.query;
    const atRiskCategories = await glutWarningService.scanAllCategories(stateId ? Number(stateId) : undefined);
    res.json({ success: true, count: atRiskCategories.length, data: atRiskCategories });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
