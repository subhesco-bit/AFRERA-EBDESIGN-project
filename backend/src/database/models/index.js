/**
 * DEAD CODE — DO NOT USE.  Marked 2026-08-04.
 *
 * Verified unreachable: 0 importers outside this directory, require('sequelize')
 * appears ONLY in these files, and Sequelize is never initialised in index.js.
 * The platform persists through raw pg SQL via database/pool.js.
 *
 * NOT completed deliberately. Finishing it would create a second, competing
 * persistence layer — two ORMs means two sources of truth for the schema,
 * which is exactly what the 17 duplicate table definitions already cost.
 */

/**
 * Database Models Index
 * Exports all Sequelize models and sets up associations
 */

const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');

const models = {
  User,
  Product,
  Order,
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
