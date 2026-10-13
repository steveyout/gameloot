const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const RewardRedemption = sequelize.define('RewardRedemption', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reward_item_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reward_title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  reward_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  points_spent: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cash_value_usd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payout_details: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
    defaultValue: 'pending'
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'reward_redemptions'
});

module.exports = RewardRedemption;
