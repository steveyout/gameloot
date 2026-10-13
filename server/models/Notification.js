const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'null indicates global broadcast to all users'
  },
  title: {
    type: DataTypes.STRING(191),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('announcement', 'bonus', 'alert', 'reward', 'system'),
    defaultValue: 'announcement'
  },
  bonus_points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  action_screen: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  target_audience: {
    type: DataTypes.ENUM('all', 'specific', 'active_24h'),
    defaultValue: 'all'
  },
  sender_admin: {
    type: DataTypes.STRING(100),
    defaultValue: 'System Admin'
  }
}, {
  tableName: 'notifications'
});

module.exports = Notification;
