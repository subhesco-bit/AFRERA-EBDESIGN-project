/**
 * Database Models Index
 * Exports all Sequelize models and sets up associations
 */

const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');

// Import other models (to be created)
// const UserProfile = require('./UserProfile');
// const Address = require('./Address');
// const Category = require('./Category');
// const State = require('./State');
// const OrderItem = require('./OrderItem');
// const Cart = require('./Cart');
// const Farmer = require('./Farmer');
// const FPO = require('./FPO');
// const Loan = require('./Loan');
// const Policy = require('./Policy');
// const Shipment = require('./Shipment');
// const Contract = require('./Contract');
// const Asset = require('./Asset');

const models = {
  User,
  Product,
  Order,
  // Add other models as they are created
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
