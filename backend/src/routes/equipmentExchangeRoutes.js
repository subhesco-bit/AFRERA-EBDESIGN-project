/**
 * Second-Use Equipment Exchange Routes. See services/equipmentExchangeService.js.
 */

const express = require('express');
const router = express.Router();
const equipmentExchangeService = require('../services/legacy/equipmentExchangeService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const { rateLimiters } = require('../middleware/rateLimit');
const { SIGNAL } = require('../core/signalBus');
const { validateId, parsePageQuery, bodyValidator, validateBody, validateOperationsBody, emitMutation, fail, queryValidator } = require('./operationsRouteSupport');

function validateListing(body) {
  validateOperationsBody(body, ['equipmentName', 'conditionGrade'], {
    numbers: { priceInr: { min: 0, max: 1000000000 }, stateId: { min: 1, max: 100000, integer: true } },
    enums: { pricingType: ['free', 'priced'] },
  });
  if (body.pricingType === 'priced' && (body.priceInr === undefined || body.priceInr === null || body.priceInr === '')) throw new Error('priceInr is required for a priced listing');
  if (body.images !== undefined && (!Array.isArray(body.images) || body.images.length > 20)) throw new Error('images must be an array with at most 20 items');
}

function validateExchangeQuery(query) {
  if (query.stateId !== undefined) {
    const stateId = Number(query.stateId);
    if (!Number.isInteger(stateId) || stateId < 1 || stateId > 100000) throw new Error('stateId is outside the allowed range');
  }
  if (query.pricingType !== undefined && !['free', 'priced'].includes(query.pricingType)) throw new Error('pricingType must be one of: free, priced');
}

router.post('/', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateBody(), bodyValidator(validateListing), async (req, res) => {
  try {
    const listing = await equipmentExchangeService.createListing(req.user.id, req.body);
    emitMutation(req, 'create', listing, SIGNAL.EQUIPMENT_EXCHANGE_CHANGED, 'equipment_exchange_routes');
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    return fail(req, res, error, 'exchange.create', error.status || 500);
  }
});

router.get('/', rateLimiters.read, parsePageQuery, queryValidator(validateExchangeQuery), async (req, res) => {
  try {
    const { equipmentType, stateId, pricingType } = req.query;
    const listings = await equipmentExchangeService.listAvailable({
      equipmentType, stateId: stateId ? Number(stateId) : undefined, pricingType,
    });
    res.json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    return fail(req, res, error, 'exchange.list', error.status || 500);
  }
});

router.get('/:listingId', rateLimiters.read, validateId, async (req, res) => {
  try {
    let listing = await equipmentExchangeService.getListing(req.params.listingId);
    res.json({ success: true, data: listing });
  } catch (error) {
    return fail(req, res, error, 'exchange.get', 404);
  }
});

router.post('/:listingId/reserve', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, async (req, res) => {
  try {
    let listing = await equipmentExchangeService.reserveListing(req.params.listingId, req.user.id);
    emitMutation(req, 'reserve', listing, SIGNAL.EQUIPMENT_EXCHANGE_CHANGED, 'equipment_exchange_routes');
    res.json({ success: true, data: listing });
  } catch (error) {
    return fail(req, res, error, 'exchange.reserve', error.status || 500);
  }
});

router.post('/:listingId/complete', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, async (req, res) => {
  try {
    let listing = await equipmentExchangeService.completeExchange(req.params.listingId, req.user.id);
    emitMutation(req, 'complete', listing, SIGNAL.EQUIPMENT_EXCHANGE_CHANGED, 'equipment_exchange_routes');
    res.json({ success: true, data: listing });
  } catch (error) {
    return fail(req, res, error, 'exchange.complete', error.status || 500);
  }
});

router.delete('/:listingId', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, async (req, res) => {
  try {
    let listing = await equipmentExchangeService.withdrawListing(req.params.listingId, req.user.id);
    emitMutation(req, 'withdraw', listing, SIGNAL.EQUIPMENT_EXCHANGE_CHANGED, 'equipment_exchange_routes');
    res.json({ success: true, data: listing });
  } catch (error) {
    return fail(req, res, error, 'exchange.withdraw', error.status || 500);
  }
});

module.exports = router;
