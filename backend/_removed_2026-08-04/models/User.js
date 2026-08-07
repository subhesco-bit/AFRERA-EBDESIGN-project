/**
 * User Model
 * Sequelize ORM model for users table
 */

const { Model, DataTypes } = require('sequelize');
const { getPostgreSQL } = require('../connection');

class User extends Model {}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'farmer', 'fpo', 'corporate', 'consumer', 'logistics', 'horeca'),
    defaultValue: 'consumer',
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  two_factor_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize: getPostgreSQL(),
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email'],
    },
    {
      unique: true,
      fields: ['phone'],
    },
    {
      fields: ['role'],
    },
  ],
});

// Define associations
User.associate = (models) => {
  User.hasOne(models.UserProfile, { foreignKey: 'user_id', as: 'profile' });
  User.hasMany(models.Address, { foreignKey: 'user_id', as: 'addresses' });
  User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
  User.hasOne(models.Farmer, { foreignKey: 'user_id', as: 'farmer' });
  User.hasMany(models.Policy, { foreignKey: 'user_id', as: 'policies' });
};

module.exports = User;
