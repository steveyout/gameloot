const { AdPlacement, User, PointTransaction, SystemSetting } = require('../models');
const { sendNotification } = require('../services/socket');

// Loot Box Probability Tables: Harder to hit jackpot, common Try Again
const LOOT_CHEST_TIERS = [
  { label: 'Try Again (Empty Chest)', points: 0, weight: 45, isTryAgain: true, isJackpot: false },
  { label: 'Bronze Loot (+2 PTS)', points: 2, weight: 35, isTryAgain: false, isJackpot: false },
  { label: 'Silver Stash (+5 PTS)', points: 5, weight: 13, isTryAgain: false, isJackpot: false },
  { label: 'Gold Trove (+15 PTS)', points: 15, weight: 5.5, isTryAgain: false, isJackpot: false },
  { label: 'Epic Vault (+30 PTS)', points: 30, weight: 1.3, isTryAgain: false, isJackpot: false },
  { label: 'LEGENDARY JACKPOT CHEST 👑 (+100 PTS)', points: 100, weight: 0.2, isTryAgain: false, isJackpot: true }
];

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

// Mobile Client: Verify Completed Rewarded Ad View / Loot Box Opening
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

    let pointsToCredit = placement.reward_points;
    let wonTier = null;

    // Daily Loot Chest utilizes true probability distribution (Harder Jackpot + Try Again)
    if (placement_key === 'rewarded_daily_chest') {
      const totalWeight = LOOT_CHEST_TIERS.reduce((acc, t) => acc + t.weight, 0);
      let rand = Math.random() * totalWeight;
      wonTier = LOOT_CHEST_TIERS[0];
      for (const tier of LOOT_CHEST_TIERS) {
        if (rand < tier.weight) {
          wonTier = tier;
          break;
        }
        rand -= tier.weight;
      }
      pointsToCredit = wonTier.points;
    }

    if (pointsToCredit > 0) {
      user.points_balance += pointsToCredit;
      user.total_earned += pointsToCredit;
      await user.save();

      await PointTransaction.create({
        user_id: user.id,
        type: 'ad_reward',
        amount: pointsToCredit,
        balance_after: user.points_balance,
        description: `Loot Drop: ${wonTier ? wonTier.label : placement.name}`
      });
    }

    const message = pointsToCredit > 0
      ? (wonTier?.isJackpot ? '👑 LEGENDARY JACKPOT! You unlocked +100 PTS!' : `Earned +${pointsToCredit} points from ${wonTier ? wonTier.label : placement.name}!`)
      : 'Chest was empty! Try again on your next daily loot box.';

    return res.json({
      success: true,
      message,
      points_earned: pointsToCredit,
      new_balance: user.points_balance,
      tier: wonTier
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
