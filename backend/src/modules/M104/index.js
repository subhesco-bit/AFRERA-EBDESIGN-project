// M104 - Equipment Rental
// index.js used to build its own router inline, duplicating routes.js and
// never picking up routes.js's edits (including the list/get routes added
// 2026-08-24). Fixed to require routes.js as the single source of truth.
module.exports = {
  controller: require('./controller'),
  service: require('./service'),
  router: require('./routes')
};
