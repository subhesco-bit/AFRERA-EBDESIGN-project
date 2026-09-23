'use strict';
/** One catalog. Core + missing mesh.
 *
 * NOTE ON SCOPE: pine-shadow's src/lib/lattice/bridges-mesh.ts holds an
 * additional ~1275 lines / ~100+ bridge definitions extending this core set.
 * That file was not ported in this pass (see .ai/COMPLETE_INTEGRATION_REPORT.html
 * for the exact byte/line accounting of what is and isn't ported yet).
 * MESH_BRIDGES is left as an empty array here rather than fabricated, so
 * latticeStats() undercounts bridges honestly instead of inventing rows. */

const { CORE_BRIDGES } = require('./bridges-core');

const MESH_BRIDGES = [];

const BRIDGES = [...CORE_BRIDGES, ...MESH_BRIDGES];

module.exports = { CORE_BRIDGES, MESH_BRIDGES, BRIDGES };
