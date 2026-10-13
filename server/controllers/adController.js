const { AdPlacement, User, PointTransaction, SystemSetting } = require('../models');
const { sendNotification } = require('../services/socket');

// Admin: Get all ad placements
async function getAdPlacements(req, res) {
  try {
    const placements = await AdPlacement.findAll({ order: [['id', 'ASC']] });
    return res.json({ success: true, placements });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve ad placements', error: err.message });
  }
}

// Admin: Update placement
async function updateAdPlacement(req, res) {
  try {
    const { id } = req.params;
    const placement = await AdPlacement.findByPk(id);
    if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });

    await placement.update(req.body);
    return res.json({ success: true, message: 'Ad placement updated', placement });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update ad placement', error: err.message });
  }
}

// Mobile Client: Get Active Ad Placements & Config
async function getClientAdConfig(req, res) {
  try {
    const placements = await AdPlacement.findAll({ where: { is_active: true } });
    const settings = await SystemSetting.findAll({
      where: {
        setting_key: ['ad_video_reward_pts', 'ad_reward_cooldown_sec', 'google_play_disclaimer', 'daily_max_points_global']
      }
    });

    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.setting_key] = s.setting_value; });

    return res.json({
      success: true,
      placements,
      config: {
        cooldown_seconds: parseInt(settingsMap['ad_reward_cooldown_sec'] || '90', 10),
        reward_pts: parseInt(settingsMap['ad_video_reward_pts'] || '3', 10),
        daily_max_pts: parseInt(settingsMap['daily_max_points_global'] || '120', 10),
        disclaimer: 'Rewards are loyalty points funded by in-app ads and sponsors. This is not gambling.'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve client ad config', error: err.message });
  }
}

// Mobile Client: Verify Completed Rewarded Ad View and award points
async function claimRewardedAd(req, res) {
  try {
    const { placement_key } = req.body;
    if (!placement_key) return res.status(400).json({ success: false, message: 'placement_key required' });

    const placement = await AdPlacement.findOne({ where: { placement_key, is_active: true } });
    if (!placement) return res.status(404).json({ success: false, message: 'Ad placement not found or inactive' });

    const user = await User.findByPk(req.user.userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account not eligible for rewards' });
    }

    const pointsToCredit = placement.reward_points;

    if (pointsToCredit > 0) {
      user.points_balance += pointsToCredit;
      user.total_earned += pointsToCredit;
      await user.save();

      await PointTransaction.create({
        user_id: user.id,
        type: 'game_reward',
        amount: pointsToCredit,
        balance_after: user.points_balance,
        description: `AdMob Video Reward: ${placement.name}`
      });
    }

    return res.json({
      success: true,
      message: `Earned +${pointsToCredit} points from rewarded ad!`,
      points_earned: pointsToCredit,
      new_balance: user.points_balance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify ad reward', error: err.message });
  }
}

module.exports = {
  getAdPlacements,
  updateAdPlacement,
  getClientAdConfig,
  claimRewardedAd
};
