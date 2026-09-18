'use strict';

const express = require('express');
const coverage = require('../services/platform/indiaCoverageService');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const wrap = (fn) => async (req, res) => {
  try { res.json({ success: true, data: await fn(req) }); }
  catch (error) { res.status(error.statusCode || 500).json({ success: false, error: error.statusCode ? error.message : 'Coverage operation failed' }); }
};

router.get('/', authMiddleware, wrap((req) => coverage.listCoverage(req.query)));
router.patch('/:name/stage', authMiddleware, requireRole('admin', 'super_admin'), wrap((req) => coverage.changeStage(req.params.name, req.body, req.user.id)));

module.exports = router;
