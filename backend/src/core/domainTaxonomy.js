'use strict';

const path = require('path');
const taxonomy = require(path.resolve(__dirname, '../../../.ai/autonomous-program/CANONICAL_DOMAIN_TAXONOMY.json'));

const LEVELS = taxonomy.hierarchy;
const domains = new Map(taxonomy.domains.map((item) => [item.id, item]));
const systems = new Map(taxonomy.systemPatterns.map((item) => [item.id, item]));

function validateNode(node) {
  const errors = [];
  if (!node || typeof node !== 'object') return ['node must be an object'];
  for (const field of taxonomy.requiredMetadata) {
    if (!(field in node)) errors.push('missing ' + field);
  }
  if (node.level && !LEVELS.includes(node.level)) errors.push('invalid level ' + node.level);
  if (node.level === 'domain') {
    if (node.parentId !== null) errors.push('domain parentId must be null');
  } else if (node.parentId == null) {
    errors.push((node.level || 'node') + ' requires parentId');
  }
  if (node.securityClass && !taxonomy.securityClasses.includes(node.securityClass)) {
    errors.push('invalid securityClass ' + node.securityClass);
  }
  if (node.dataClassification && !taxonomy.dataClassifications.includes(node.dataClassification)) {
    errors.push('invalid dataClassification ' + node.dataClassification);
  }
  if (node.lifecycle && !taxonomy.lifecycle.includes(node.lifecycle)) {
    errors.push('invalid lifecycle ' + node.lifecycle);
  }
  return errors;
}

function validateTaxonomy() {
  const errors = [];
  const ids = new Set();
  for (const node of [...taxonomy.domains, ...taxonomy.systemPatterns]) {
    if (ids.has(node.id)) errors.push('duplicate id ' + node.id);
    ids.add(node.id);
    for (const error of validateNode(node)) errors.push(node.id + ': ' + error);
  }
  for (const system of taxonomy.systemPatterns) {
    if (!domains.has(system.parentId)) errors.push(system.id + ': missing domain parent ' + system.parentId);
  }
  return { valid: errors.length === 0, errors, domainCount: taxonomy.domains.length, systemPatternCount: taxonomy.systemPatterns.length, hierarchy: [...LEVELS] };
}

function getDomain(idOrCode) {
  const value = String(idOrCode || '').toUpperCase();
  return domains.get(value.startsWith('DOMAIN:') ? value : 'DOMAIN:' + value) || null;
}

function getSystem(id) {
  return systems.get(String(id || '').toUpperCase()) || null;
}

function assertNode(node) {
  const errors = validateNode(node);
  if (errors.length) throw new Error('Invalid taxonomy node: ' + errors.join('; '));
  return node;
}

function childId(parentId, level, slug) {
  const normalizedLevel = String(level || '').toLowerCase();
  if (!LEVELS.includes(normalizedLevel)) throw new Error('Unknown taxonomy level: ' + level);
  const cleanSlug = String(slug || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!cleanSlug) throw new Error('slug is required');
  return normalizedLevel.toUpperCase() + ':' + String(parentId).replace(/^[A-Z]+:/, '') + ':' + cleanSlug;
}

module.exports = { taxonomy, LEVELS, getDomain, getSystem, validateNode, validateTaxonomy, assertNode, childId };
