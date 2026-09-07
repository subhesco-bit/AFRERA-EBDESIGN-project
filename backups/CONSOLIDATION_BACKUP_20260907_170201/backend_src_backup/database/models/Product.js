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
 * Product Model
 * Sequelize ORM model for products table
 */

const { Model, DataTypes } = require('sequelize');
const { getPostgreSQL } = require('../connection');

class Product extends Model {}

Product.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  sku: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  state_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  unit_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  usp: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  gi_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  gi_certificate_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  gi_registry_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  organic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  organic_certificate_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  nutrition_data: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  map_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  retail_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  weight_per_unit: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
  },
  dimensions: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  meta_title: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  sequelize: getPostgreSQL(),
  modelName: 'Product',
  tableName: 'products',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['slug'],
    },
    {
      fields: ['category_id'],
    },
    {
      fields: ['state_id'],
    },
    {
      fields: ['gi_status'],
    },
    {
      fields: ['is_active'],
    },
    {
      fields: ['featured'],
    },
  ],
});

Product.associate = (models) => {
  Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
  Product.belongsTo(models.State, { foreignKey: 'state_id', as: 'state' });
  Product.belongsTo(models.Unit, { foreignKey: 'unit_id', as: 'unit' });
  Product.hasMany(models.OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
  Product.hasMany(models.Cart, { foreignKey: 'product_id', as: 'cartItems' });
  Product.hasMany(models.Certification, { foreignKey: 'product_id', as: 'certifications' });
};

module.exports = Product;
