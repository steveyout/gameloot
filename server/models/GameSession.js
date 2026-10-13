const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const GameSession = sequelize.define('GameSession', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  session_token: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  points_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_ping_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'abandoned', 'flagged'),
    defaultValue: 'active'
  },
  ip_address: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'game_sessions'
});

module.exports = GameSession;
