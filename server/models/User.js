const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(191),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  google_id: {
    type: DataTypes.STRING(150),
    allowNull: true,
    unique: true
  },
  avatar: {
    type: DataTypes.STRING(500),
    defaultValue: 'https://api.dicebear.com/7.x/bottts/svg?seed=gameloot'
  },
  points_balance: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  tickets_balance: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  total_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  total_withdrawn: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'banned'),
    defaultValue: 'active'
  },
  device_id: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(64),
    allowNull: true
  }
}, {
  tableName: 'users'
});

User.prototype.validatePassword = async function (password) {
  if (!this.password_hash) return false;
  return bcrypt.compare(password, this.password_hash);
};

module.exports = User;
