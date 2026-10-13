const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const SurfTask = sequelize.define('SurfTask', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  website_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    defaultValue: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80'
  },
  reward_points: {
    type: DataTypes.INTEGER,
    defaultValue: 25
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  daily_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  surf_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'surf_tasks'
});

module.exports = SurfTask;
