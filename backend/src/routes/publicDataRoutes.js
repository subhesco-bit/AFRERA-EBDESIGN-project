'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const service = require('../services/publicDataExtractorService');

const router = express.Router();

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) return res.status(401).json({ error: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();

}

}

}

router.use(authMiddleware, requireRole('admin', 'organization_admin'));

router.get('/sources', async (req, res, next) => {
  try { return res.json({ success: true, data: await service.listSources() }); } catch (error) { return next(error); }
});

router.post('/sources', async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await service.registerSource(req.body, req.user.id) }); } catch (error) { return next(error); }
});

router.post('/sources/:sourceId/extract', async (req, res, next) => {
  try { return res.json({ success: true, data: await service.extractDataset(req.params.sourceId, req.body?.filter || {}, req.user.id) }); } catch (error) { return next(error); }
});

module.exports = router;
