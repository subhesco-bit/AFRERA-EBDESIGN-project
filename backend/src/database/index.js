'use strict';

// Compatibility entry point for modules that import `../database`.
// Connection lifecycle remains owned by connection.js.
module.exports = require('./connection');
