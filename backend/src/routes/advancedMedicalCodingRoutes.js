'use strict';

// Keep the route discoverable under backend/src/routes while the single
// implementation source remains in services for direct testing and reuse.
module.exports = require('../services/advancedMedicalCodingService');
