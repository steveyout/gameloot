const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Survey = sequelize.define('Survey', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  provider: {
    type: DataTypes.STRING(100),
    defaultValue: 'GameLoot Research'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    defaultValue: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&q=80'
  },
  reward_points: {
    type: DataTypes.INTEGER,
    defaultValue: 150
  },
  estimated_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  // JSON array of questions: [{ id, question, type: 'single'|'multiple'|'text', options: [string] }]
  questions_json: {
    type: DataTypes.JSON,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  response_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'surveys'
});

module.exports = Survey;
