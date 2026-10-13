const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');
const bcrypt = require('bcryptjs');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { len: [3, 100] }
  },
  email: {
    type: DataTypes.STRING(191),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('superadmin', 'admin', 'moderator'),
    defaultValue: 'admin'
  },
  avatar: {
    type: DataTypes.STRING(255),
    defaultValue: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  }
}, {
  tableName: 'admins'
});

Admin.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = Admin;
