const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const UserEngagement = sequelize.define('UserEngagement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  current_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  longest_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_checkin_date: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Format YYYY-MM-DD'
  },
  last_wheel_spin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_spins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  vip_tier: {
    type: DataTypes.ENUM('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'),
    defaultValue: 'Bronze'
  }
}, {
  tableName: 'user_engagements'
});

module.exports = UserEngagement;
