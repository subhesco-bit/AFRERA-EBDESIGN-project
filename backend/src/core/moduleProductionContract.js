'use strict';

/**
 * Production contract for every EBDESIGN module.
 *
 * Enforcement helper only: it does not replace existing module architecture.
 */
const REQUIRED_CATEGORIES = new Set(['platform', 'domain', 'enterprise', 'erp', 'ai']);
const REQUIRED_SURFACES = ['backend', 'api', 'frontend', 'workflow', 'security', 'testing', 'documentation'];

function validateManifest(manifest, modulePath = 'module') {
  const errors = [];
  const warnings = [];
  if (!manifest || typeof manifest !== 'object') return { valid: false, errors: ['Manifest must be an object'], warnings };
  for (const field of ['moduleId', 'name', 'version', 'category']) {
    if (!manifest[field] || typeof manifest[field] !== 'string') errors.push(`${modulePath}: missing ${field}`);
  }
  if (manifest.category && !REQUIRED_CATEGORIES.has(String(manifest.category).toLowerCase())) {
    warnings.push(`${modulePath}: non-standard category '${manifest.category}'`);
  }
  const execution = manifest.execution || {};
  for (const surface of REQUIRED_SURFACES) if (!execution[surface]) warnings.push(`${modulePath}: execution.${surface} is not declared`);
  if (!manifest.dependencies) warnings.push(`${modulePath}: dependencies are not declared`);
  if (!manifest.testing) warnings.push(`${modulePath}: testing contract is not declared`);
  return { valid: errors.length === 0, errors, warnings };
}

function getRequiredSurfaces() { return [...REQUIRED_SURFACES]; }

module.exports = { REQUIRED_CATEGORIES, REQUIRED_SURFACES, validateManifest, getRequiredSurfaces };
