const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const RewardItem = sequelize.define('RewardItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('paypal', 'crypto', 'google_play', 'steam', 'amazon', 'apple'),
    allowNull: false
  },
  cost_points: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cash_value_usd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  icon_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 999
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'reward_items'
});

module.exports = RewardItem;
