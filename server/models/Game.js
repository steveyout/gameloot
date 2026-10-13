const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  banner_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  embed_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  orientation: {
    type: DataTypes.ENUM('portrait', 'landscape', 'any'),
    defaultValue: 'any'
  },
  reward_rate: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    comment: 'Points awarded per 60 seconds of valid active play'
  },
  max_daily_reward: {
    type: DataTypes.INTEGER,
    defaultValue: 500
  },
  min_play_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  play_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 4.8
  }
}, {
  tableName: 'games'
});

module.exports = Game;
