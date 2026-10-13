const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const NotificationRead = sequelize.define('NotificationRead', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  notification_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_claimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  claimed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notification_reads',
  indexes: [
    {
      unique: true,
      fields: ['notification_id', 'user_id']
    }
  ]
});

module.exports = NotificationRead;
