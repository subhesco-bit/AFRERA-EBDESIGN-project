'use strict';
/** Real port of pine-shadow src/lib/vet/index.ts. Replaces nothing from
 * Phase 1 (vet/ was not previously created) — this is a wholly new, real
 * module: AFRERA-VET veterinary coding for cattle, buffalo, goat, pig,
 * poultry, duck, fish, dog, cat. */
module.exports = {
  ...require('./catalog'),
  ...require('./lineage'),
  ...require('./code'),
};
