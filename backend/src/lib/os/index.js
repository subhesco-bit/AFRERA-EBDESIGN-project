'use strict';
/** Digital super-organism registry — real port from pine-shadow src/lib/os/index.ts equivalent.
 * Replaces the earlier fabricated OSLayer service-registry stub, which did not
 * reflect pine-shadow's actual OS layer (a governance/classification kernel,
 * not a boot/service registry). Now includes events.js, passport.js,
 * todos.js, matrix.js — the previously-unported remainder. */

const catalog = require('./catalog');
const runtime = require('./runtime');
const constitution = require('./constitution');
const suitability = require('./suitability');
const terms = require('./terms');
const envelope = require('./envelope');
const compose = require('./compose');
const events = require('./events');
const passport = require('./passport');
const todos = require('./todos');
const matrix = require('./matrix');

module.exports = {
  ...catalog, ...runtime, ...constitution, ...suitability, ...terms,
  ...envelope, ...compose, ...events, ...passport, ...todos, ...matrix,
};
