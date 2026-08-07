/**
 * Order Model
 * Sequelize ORM model for orders table
 */

const { Model, DataTypes } = require('sequelize');
const { getPostgreSQL } = require('../connection');

class Order extends Model {}

Order.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'),
    defaultValue: 'pending',
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  tax_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  shipping_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR',
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded'),
    defaultValue: 'pending',
  },
  payment_method: {
    type: DataTypes.ENUM('cod', 'upi', 'bank_transfer', 'card', 'wallet'),
    allowNull: true,
  },
  shipping_address_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  billing_address_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  expected_delivery_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  actual_delivery_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  coupon_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  erp_reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  erp_synced_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize: getPostgreSQL(),
  modelName: 'Order',
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['order_number'],
    },
    {
      fields: ['user_id'],
 },
    {
      fields: ['status'],
    },
    {
      fields: ['payment_status'],
    },
    {
      fields: ['created_at'],
    },
  ],
});

Order.associate = (models) => {
  Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  Order.belongsTo(models.Address, { foreignKey: 'shipping_address_id', as: 'shippingAddress' });
  Order.belongsTo(models.Address, { foreignKey: 'billing_address_id', as: 'billingAddress' });
  Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
  Order.hasOne(models.Payment, { foreignKey: 'order_id', as: 'payment' });
  Order.hasOne(models.Shipment, { foreignKey: 'order_id', as: 'shipment' });
};

module.exports = Order;
