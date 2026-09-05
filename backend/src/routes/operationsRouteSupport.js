'use strict';

const { validateId, parsePageQuery, bodyValidator, queryValidator, date, dateTime, enumValue, numberValue, fail, requestId } = require('./climateRouteSupport');
const { validateBody } = require('../middleware/inputValidation');
const { logger } = require('../utils/logger');
const { signalBus, SEVERITY } = require('../core/signalBus');

function validateOperationsBody(body, requiredFields = [], rules = {}) {
  if (!Object.keys(body).length) throw new Error('At least one field is required');
  const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) throw new Error(`${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} required`);
  for (const field of rules.dates || []) date(body[field], field);
  for (const field of rules.dateTimes || []) dateTime(body[field], field);
  for (const [field, options] of Object.entries(rules.numbers || {})) numberValue(body[field], field, options);
  for (const [field, values] of Object.entries(rules.enums || {})) enumValue(body[field], field, values);
}

function emitMutation(req, operation, item, signalType, source) {
  const id = String(item?.id || req.params.id || req.params.listingId || 'unknown');
  const correlationId = requestId(req, source);
  logger.info(`${source}:mutation`, { operation, entityId: id, requestId: correlationId });
  signalBus.emitSignal(signalType, { operation, resourceId: id }, {
    severity: SEVERITY.INFO, source, entityId: id, correlationId,
  });
}

module.exports = {
  validateId, parsePageQuery, bodyValidator, queryValidator, validateBody, fail, requestId,
  validateOperationsBody, emitMutation,
};