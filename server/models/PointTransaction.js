const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const PointTransaction = sequelize.define('PointTransaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('game_reward', 'daily_bonus', 'referral', 'redemption', 'admin_adjustment'),
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  balance_after: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reference_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'point_transactions'
});

module.exports = PointTransaction;
