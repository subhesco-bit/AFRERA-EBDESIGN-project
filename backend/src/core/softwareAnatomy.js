'use strict';

const anatomy = require('../../../.ai/autonomous-program/SOFTWARE_ANATOMY.json');

function validateLayer(layerName, layerValue) {
  const errors = [];
  if (layerValue === undefined) return ['missing layer ' + layerName];
  if (layerValue === null) return ['layer ' + layerName + ' cannot be null'];
  if (typeof layerValue !== 'object') return ['layer ' + layerName + ' must be an object'];
  if (layerValue.notApplicable === true) {
    if (!layerValue.rationale) errors.push(layerName + ': notApplicable requires rationale');
    if (!layerValue.reviewer) errors.push(layerName + ': notApplicable requires reviewer');
    return errors;
  }
  const contract = anatomy.layerContracts[layerName] || [];
  for (const field of contract) {
    if (!(field in layerValue)) errors.push(layerName + ': missing ' + field);
  }
  return errors;
}

function validateAnatomy(definition) {
  const errors = [];
  if (!definition || typeof definition !== 'object') return { valid:false, errors:['definition must be an object'], completeness:0 };
  if (!definition.moduleId) errors.push('moduleId is required');
  if (!definition.domainId) errors.push('domainId is required');
  for (const layer of anatomy.requiredLayers) errors.push(...validateLayer(layer, definition[layer]));
  for (const concern of anatomy.crossCutting) {
    if (!(concern in definition)) errors.push('missing cross-cutting concern ' + concern);
  }
  const required = anatomy.requiredLayers.length + anatomy.crossCutting.length + 2;
  const present = required - errors.filter((error) => error.startsWith('missing layer ') || error.startsWith('missing cross-cutting') || / is required$/.test(error)).length;
  const completeness = Math.max(0, Math.min(1, present / required));
  return { valid:errors.length===0, errors, completeness, requiredLayers:[...anatomy.requiredLayers], crossCutting:[...anatomy.crossCutting] };
}

function assertAnatomy(definition) {
  const result = validateAnatomy(definition);
  if (!result.valid) throw new Error('Invalid software anatomy: ' + result.errors.join('; '));
  return definition;
}

function createSkeleton(moduleId, domainId) {
  const result = { moduleId, domainId };
  for (const layer of anatomy.requiredLayers) {
    result[layer] = Object.fromEntries((anatomy.layerContracts[layer] || []).map((field) => [field, []]));
  }
  for (const concern of anatomy.crossCutting) result[concern] = {};
  return result;
}

module.exports = { anatomy, validateLayer, validateAnatomy, assertAnatomy, createSkeleton };
