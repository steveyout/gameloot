const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const AdPlacement = sequelize.define('AdPlacement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  placement_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'e.g. rewarded_game_session, rewarded_quiz, interstitial_game_exit, banner_home'
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  ad_type: {
    type: DataTypes.ENUM('rewarded_video', 'interstitial', 'banner', 'app_open'),
    allowNull: false
  },
  ad_unit_id_android: {
    type: DataTypes.STRING(255),
    defaultValue: 'ca-app-pub-3940256099942544/5224354917', // Google AdMob Rewarded Test ID
    comment: 'AdMob or AppLovin ad unit ID'
  },
  cooldown_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    comment: 'Minimum time between showing this ad to prevent Google Play spam violations'
  },
  daily_cap: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
    comment: 'Max impressions per user/day'
  },
  reward_points: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    comment: 'Points rewarded to user upon verified completed watch (Sustainable: $0.002 = 2 pts)'
  },
  est_ecpm_usd: {
    type: DataTypes.DECIMAL(6, 2),
    defaultValue: 15.00,
    comment: 'Estimated eCPM in USD (e.g. $15 eCPM = $0.015 per rewarded video watch)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'ad_placements'
});

module.exports = AdPlacement;
