// Production-Hardened Platform Core
module.exports = {
  // Error Handling
  errorHandler: require('./errorHandler'),

  // Caching
  cache: require('./cache'),

  // Validation
  validation: require('./validation'),

  // Monitoring
  monitoring: require('./monitoring'),

  // Service Template
  ProductionService: require('./productionService'),

  // API Documentation
  apiDocumentation: require('./apiDocumentation')
};
