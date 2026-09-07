// M087 - Alert Management (mislabeled "Pest Forecasting" before 2026-08-17;
// the service is a generic BI/ops alerting system, nothing pest-specific).
// router added 2026-08-17 so the dynamic module-scaffold loop in
// backend/src/index.js actually mounts this - service.js/controller.js were
// real and complete but had never been wired to routes.js.
module.exports = { controller: require('./controller'), service: require('./service'), router: require('./routes') };
