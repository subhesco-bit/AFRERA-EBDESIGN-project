/**
 * authService (thin wrapper)
 *
 * (2026-09-19) Superseded by ./authService/ (see that directory's index.js
 * doc comment: "Split from the former single-file services/authService.js
 * into this directory... behavior is unchanged"). But Node module
 * resolution prefers a `.js` file over a same-named directory, so as long as
 * this flat file existed, every `require('./authService')` /
 * `require('../services/authService')` in the codebase silently kept
 * resolving to this old copy instead of the intended split directory -
 * including its hard `throw` on a missing JWT_SECRET, which crashed server
 * boot in dev even though the new directory's userAuth/config already
 * degrades gracefully with a warning. Collapsed to a re-export so resolution
 * reaches the real implementation, without deleting the tracked file.
 */

'use strict';

module.exports = require('./authService/index.js');
