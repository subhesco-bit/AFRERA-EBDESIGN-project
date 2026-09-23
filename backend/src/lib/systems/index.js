'use strict';
/** Real port of pine-shadow src/lib/systems/index.ts. Corrects the earlier
 * pass, which wired index.js straight to catalog.js and so was missing
 * SYSTEM_BY_ID, systemStatusVariant, filterSystems, organsForSystem,
 * systemsForOrgan — and had a slightly wrong, invented systemStats()
 * (missing the `|| actual === 'duplicate' || !isComplete` condition on
 * wiredButSkeleton, and missing livingPlugs/partialPlugs/missingPlugs
 * entirely). This is the real, verified function bodies. */

const { CONCEPTS } = require('../lattice/concepts');
const { AI_SYSTEMS, MODULE_DIRS_ON_DISK, NAMED_AI_MODULE_FOLDERS } = require('./catalog');

const CONCEPT_BY_ID = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));
const SYSTEM_BY_ID = Object.fromEntries(AI_SYSTEMS.map((s) => [s.id, s]));

function systemStatusVariant(actual) {
  if (actual === 'partial') return 'partial';
  if (actual === 'duplicate') return 'partial';
  return 'gap';
}

function systemStats() {
  const wiredButSkeleton = AI_SYSTEMS.filter((s) => s.declared === 'WIRED' && (s.actual === 'skeleton' || s.actual === 'duplicate' || !s.isComplete)).length;
  const stubs = AI_SYSTEMS.filter((s) => s.bytesCanonical > 0 && s.bytesCanonical < 2000).length;
  const duplicates = AI_SYSTEMS.filter((s) => s.actual === 'duplicate').length;
  return {
    systems: AI_SYSTEMS.length, wiredButSkeleton, stubs, duplicates, livingPlugs: 0,
    partialPlugs: AI_SYSTEMS.filter((s) => s.actual === 'partial').length,
    missingPlugs: AI_SYSTEMS.filter((s) => s.actual !== 'partial').length,
    moduleDirs: MODULE_DIRS_ON_DISK, namedAiModules: NAMED_AI_MODULE_FOLDERS,
  };
}

function filterSystems(opts) {
  const q = opts.query.trim().toLowerCase();
  return AI_SYSTEMS.filter((s) => {
    if (opts.family !== 'all' && s.family !== opts.family) return false;
    if (opts.actual === 'stub') {
      if (!(s.bytesCanonical > 0 && s.bytesCanonical < 2000)) return false;
    } else if (opts.actual !== 'all' && s.actual !== opts.actual) {
      return false;
    }
    if (!q) return true;
    const hay = `${s.name} ${s.moduleId} ${s.silo} ${s.contract} ${s.path}`.toLowerCase();
    return hay.includes(q);
  });
}

function organsForSystem(s) {
  return s.organs.map((id) => CONCEPT_BY_ID[id]).filter(Boolean);
}

function systemsForOrgan(organId) {
  return AI_SYSTEMS.filter((s) => s.organs.includes(organId));
}

module.exports = {
  AI_SYSTEMS, MODULE_DIRS_ON_DISK, NAMED_AI_MODULE_FOLDERS, SYSTEM_BY_ID,
  systemStatusVariant, systemStats, filterSystems, organsForSystem, systemsForOrgan,
};
