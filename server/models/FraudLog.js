const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const FraudLog = sequelize.define('FraudLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('unreviewed', 'dismissed', 'actioned'),
    defaultValue: 'unreviewed'
  }
}, {
  tableName: 'fraud_logs'
});

module.exports = FraudLog;
