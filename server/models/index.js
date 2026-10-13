const sequelize = require('../database/connection');
const Admin = require('./Admin');
const Category = require('./Category');
const Game = require('./Game');
const User = require('./User');
const GameSession = require('./GameSession');
const RewardItem = require('./RewardItem');
const RewardRedemption = require('./RewardRedemption');
const PointTransaction = require('./PointTransaction');
const SystemSetting = require('./SystemSetting');
const FraudLog = require('./FraudLog');
const Quiz = require('./Quiz');
const SurfTask = require('./SurfTask');
const Survey = require('./Survey');
const AdPlacement = require('./AdPlacement');
const Notification = require('./Notification');
const NotificationRead = require('./NotificationRead');
const UserEngagement = require('./UserEngagement');

// Define Relationships (Associations)
Category.hasMany(Game, { foreignKey: 'category_id', as: 'games', onDelete: 'SET NULL' });
Game.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

User.hasMany(GameSession, { foreignKey: 'user_id', as: 'sessions', onDelete: 'CASCADE' });
GameSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Game.hasMany(GameSession, { foreignKey: 'game_id', as: 'sessions', onDelete: 'CASCADE' });
GameSession.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });

User.hasMany(RewardRedemption, { foreignKey: 'user_id', as: 'redemptions', onDelete: 'CASCADE' });
RewardRedemption.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

RewardItem.hasMany(RewardRedemption, { foreignKey: 'reward_item_id', as: 'redemptions', onDelete: 'SET NULL' });
RewardRedemption.belongsTo(RewardItem, { foreignKey: 'reward_item_id', as: 'reward_item' });

User.hasMany(PointTransaction, { foreignKey: 'user_id', as: 'transactions', onDelete: 'CASCADE' });
PointTransaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(FraudLog, { foreignKey: 'user_id', as: 'fraud_logs', onDelete: 'SET NULL' });
FraudLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Game.hasMany(FraudLog, { foreignKey: 'game_id', as: 'fraud_logs', onDelete: 'SET NULL' });
FraudLog.belongsTo(Game, { foreignKey: 'game_id', as: 'game' });

// Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'personal_notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'recipient' });

Notification.hasMany(NotificationRead, { foreignKey: 'notification_id', as: 'reads', onDelete: 'CASCADE' });
NotificationRead.belongsTo(Notification, { foreignKey: 'notification_id', as: 'notification' });

User.hasMany(NotificationRead, { foreignKey: 'user_id', as: 'notification_reads', onDelete: 'CASCADE' });
NotificationRead.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User Engagement (Streaks, Wheel, VIP)
User.hasOne(UserEngagement, { foreignKey: 'user_id', as: 'engagement', onDelete: 'CASCADE' });
UserEngagement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Admin,
  Category,
  Game,
  User,
  GameSession,
  RewardItem,
  RewardRedemption,
  PointTransaction,
  SystemSetting,
  FraudLog,
  Quiz,
  SurfTask,
  Survey,
  AdPlacement,
  Notification,
  NotificationRead,
  UserEngagement
};
