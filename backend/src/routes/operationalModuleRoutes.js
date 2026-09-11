'use strict';

const router = require('express').Router();
const service = require('../services/operationalModuleService');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

router.get('/', asyncHandler(async (req, res) => {
  const entities = await service.listEntities({
    moduleKey: req.query.moduleKey || undefined,
    status: req.query.status || undefined,
    ownerUserId: req.query.ownerUserId || undefined,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  res.json({ success: true, data: entities });
}));

router.post('/', asyncHandler(async (req, res) => {
  const entity = await service.createEntity({
    moduleKey: req.body.moduleKey,
    ownerUserId: req.user?.id || req.body.ownerUserId || null,
    status: req.body.status || 'active',
    payload: req.body.payload || {},
  });
  res.status(201).json({ success: true, data: entity });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const entity = await service.getEntity(req.params.id);
  if (!entity) return res.status(404).json({ success: false, error: 'Operational entity not found' });
  return res.json({ success: true, data: entity });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const entity = await service.updateEntity(req.params.id, {
    status: req.body.status,
    payload: req.body.payload,
  });
  if (!entity) return res.status(404).json({ success: false, error: 'Operational entity not found' });
  return res.json({ success: true, data: entity });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await service.softDeleteEntity(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Operational entity not found' });
  return res.status(204).send();
}));

router.__ebdesign = {
  contract: 'operational-module-v1',
  scope: 'MAIN-reconciled operational ERP capabilities',
  transactionalWrites: true,
};

module.exports = router;
