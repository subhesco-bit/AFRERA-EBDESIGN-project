'use strict';

const router = require('express').Router();
const auth = require('../middleware/auth');
const service = require('../services/operationalModuleService');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function canReadAcrossOwners(req) {
  return ['admin', 'super_admin', 'system_admin'].includes(req.user?.role);
}

// Operational ERP data is protected application data.
router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const ownerUserId = canReadAcrossOwners(req)
    ? (req.query.ownerUserId || undefined)
    : req.user.id;

  const entities = await service.listEntities({
    moduleKey: req.query.moduleKey || undefined,
    status: req.query.status || undefined,
    ownerUserId,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  res.json({ success: true, data: entities });
}));

router.post('/', asyncHandler(async (req, res) => {
  const entity = await service.createEntity({
    moduleKey: req.body.moduleKey,
    // Never trust a client-supplied owner for ordinary users.
    ownerUserId: canReadAcrossOwners(req) && req.body.ownerUserId
      ? req.body.ownerUserId
      : req.user.id,
    status: req.body.status || 'active',
    payload: req.body.payload || {},
  });
  res.status(201).json({ success: true, data: entity });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const entity = await service.getEntity(req.params.id);
  if (!entity) return res.status(404).json({ success: false, error: 'Operational entity not found' });
  if (!canReadAcrossOwners(req) && entity.owner_user_id && entity.owner_user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Operational entity not found' });
  }
  return res.json({ success: true, data: entity });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const existing = await service.getEntity(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Operational entity not found' });
  if (!canReadAcrossOwners(req) && existing.owner_user_id && existing.owner_user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Operational entity not found' });
  }

  const entity = await service.updateEntity(req.params.id, {
    status: req.body.status,
    payload: req.body.payload,
  });
  if (!entity) return res.status(404).json({ success: false, error: 'Operational entity not found' });
  return res.json({ success: true, data: entity });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await service.getEntity(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Operational entity not found' });
  if (!canReadAcrossOwners(req) && existing.owner_user_id && existing.owner_user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Operational entity not found' });
  }

  const deleted = await service.softDeleteEntity(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Operational entity not found' });
  return res.status(204).send();
}));

router.__ebdesign = {
  contract: 'operational-module-v1',
  scope: 'MAIN-reconciled operational ERP capabilities',
  transactionalWrites: true,
  authenticationRequired: true,
  ownerIsolation: true,
};

module.exports = router;
