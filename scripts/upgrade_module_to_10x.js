#!/usr/bin/env node
/**
 * Batch helper: upgrade a thin module skeleton toward AFRERA 10/10 standard.
 * Usage:
 *   node scripts/upgrade_module_to_10x.js M100_CROP_MANAGEMENT
 *
 * Copies template service/routes patterns and prints checklist.
 * Does NOT invent domain ontology — that remains human/AI domain work.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const moduleId = process.argv[2];
if (!moduleId) {
  console.error('Usage: node scripts/upgrade_module_to_10x.js <MODULE_ID>');
  process.exit(1);
}

const root = path.join(__dirname, '..');
const modDir = path.join(root, 'modules', moduleId);
const templateDir = path.join(root, 'modules', 'TEMPLATES', 'MODULE_TEMPLATE');

if (!fs.existsSync(modDir)) {
  console.error('Module not found:', modDir);
  process.exit(1);
}

const backendDir = path.join(modDir, 'backend');
fs.mkdirSync(backendDir, { recursive: true });

const checklist = `
# 10x Upgrade Checklist — ${moduleId}

- [ ] module.json version → 2.0.0-10x, grade, tier, safety, api list
- [ ] backend/service.js: domain ontology + confidence + safety_floor + erp_hooks + metrics + outcome
- [ ] backend/routes.js: /process, domain endpoints, /capabilities, /metrics, /health
- [ ] Wire M400_AI_BACKBONE only for enrichment
- [ ] Register in MODULE_REGISTRY.json
- [ ] Add outcome_feedback path if decisions are field-applied
- [ ] Document remaining data gaps (live APIs, CV models, legal masters)

Template sources:
  ${path.join(templateDir, 'backend', 'service.js')}
  ${path.join(templateDir, 'backend', 'routes.js')}
  ${path.join(templateDir, 'module.json')}

Standard: AFRERA_COMPLETE_PROJECT_10X_STANDARD.md
`;

fs.writeFileSync(path.join(modDir, 'UPGRADE_10X_CHECKLIST.md'), checklist.trim() + '\n');
console.log('Wrote', path.join(modDir, 'UPGRADE_10X_CHECKLIST.md'));
console.log('Next: copy template service/routes and fill domain logic for', moduleId);
