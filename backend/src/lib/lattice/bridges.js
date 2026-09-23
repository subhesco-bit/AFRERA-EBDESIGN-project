'use strict';
/** One catalog. Core + missing mesh. Status is this organism, not GitHub WIRED.
 * bridges-mesh.js (105 bridges) is now ported — see its own file header for
 * how the mechanical TS->JS conversion was done. */

const { CORE_BRIDGES } = require('./bridges-core');
const { MESH_BRIDGES } = require('./bridges-mesh');

const BRIDGES = [...CORE_BRIDGES, ...MESH_BRIDGES];

module.exports = { CORE_BRIDGES, MESH_BRIDGES, BRIDGES };
