'use strict';
/** Real port of pine-shadow src/lib/body/index.ts. Replaces the earlier
 * fabricated actionExecutor.js / reflexSystem.js / operationalAnatomy.js
 * (backend/src/services/body/), which modeled a generic "action queue with
 * timeouts and compensation logic" — not pine-shadow's actual body-part
 * reflex kernel (skin/eye/ear/heart/vein/muscle/relax/ligament/hand/
 * finger/feet gates with real mass-conservation and climate-reflex logic). */
module.exports = {
  ...require('./anatomy'),
  ...require('./actions'),
  ...require('./reflex'),
};
