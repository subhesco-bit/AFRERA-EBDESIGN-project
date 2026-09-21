'use strict';

const { ValidationError } = require('../../utils/errors');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The current foundation schema uses UUID villages. Retained governance-era
// databases may still use integer IDs; preserve those without lossy conversion.
function normalizeVillageId(value) {
  const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  if (UUID.test(text)) return text;
  const numeric = Number(text);
  if (/^\d+$/.test(text) && Number.isSafeInteger(numeric) && numeric > 0) return numeric;
  throw new ValidationError('Valid village id is required');
}

module.exports = { normalizeVillageId };
