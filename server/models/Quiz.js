const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: 'Gaming Trivia'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    defaultValue: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500&q=80'
  },
  reward_points: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  time_limit_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  questions_count: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  // JSON array: [{ question, options: [string], correct_index: number }]
  questions_json: {
    type: DataTypes.JSON,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  completion_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'quizzes'
});

module.exports = Quiz;
