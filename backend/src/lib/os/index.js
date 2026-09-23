'use strict';
/** Digital super-organism registry — real port from pine-shadow src/lib/os/index.ts equivalent.
 * Replaces the earlier fabricated OSLayer service-registry stub, which did not
 * reflect pine-shadow's actual OS layer (a governance/classification kernel,
 * not a boot/service registry). */

const catalog = require('./catalog');
const runtime = require('./runtime');
const constitution = require('./constitution');
const suitability = require('./suitability');
const terms = require('./terms');
const envelope = require('./envelope');
const compose = require('./compose');

module.exports = {
  ...catalog,
  ...runtime,
  ...constitution,
  ...suitability,
  ...terms,
  ...envelope,
  ...compose,
};
