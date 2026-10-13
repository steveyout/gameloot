const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const SystemSetting = sequelize.define('SystemSetting', {
  setting_key: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  setting_label: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  setting_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'string'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'system_settings'
});

module.exports = SystemSetting;
