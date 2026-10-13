const { AdPlacement, User, PointTransaction, SystemSetting } = require('../models');

// Loot Box Probability Tables: Harder to hit jackpot, common Try Again
const LOOT_CHEST_TIERS = [
  { label: 'Try Again (Empty Chest)', points: 0, weight: 45, isTryAgain: true, isJackpot: false },
  { label: 'Bronze Loot (+2 PTS)', points: 2, weight: 35, isTryAgain: false, isJackpot: false },
  { label: 'Silver Stash (+5 PTS)', points: 5, weight: 13, isTryAgain: false, isJackpot: false },
  { label: 'Gold Trove (+15 PTS)', points: 15, weight: 5.5, isTryAgain: false, isJackpot: false },
  { label: 'Epic Vault (+30 PTS)', points: 30, weight: 1.3, isTryAgain: false, isJackpot: false },
  { label: 'LEGENDARY JACKPOT CHEST 👑 (+100 PTS)', points: 100, weight: 0.2, isTryAgain: false, isJackpot: true }
];

// Default Comprehensive Ad System Configuration
const DEFAULT_AD_CONFIG = {
  // Global Master Switches
  ads_enabled: true,
  test_mode: true,
  primary_provider: 'admob', // 'admob' | 'unity' | 'applovin' | 'ironsource' | 'meta' | 'mintegral'
  fallback_provider: 'unity',

  // Global Economics & Frequency
  global_cooldown_sec: 90,
  rewarded_pts: 3,
  daily_cap_per_user: 15,
  interstitial_frequency_games: 3,
  banner_refresh_sec: 30,

  // Known Ad Providers
  providers: {
    admob: {
      id: 'admob',
      name: 'Google AdMob',
      enabled: true,
      app_id_android: 'ca-app-pub-3940256099942544~3347511713',
      app_id_ios: 'ca-app-pub-3940256099942544~1458002511',
      rewarded_unit_id: 'ca-app-pub-3940256099942544/5224354917',
      interstitial_unit_id: 'ca-app-pub-3940256099942544/1033173712',
      banner_unit_id: 'ca-app-pub-3940256099942544/6300978111',
      app_open_unit_id: 'ca-app-pub-3940256099942544/3419832817',
      test_mode: true,
      notes: 'Google Play Services native ad mediation SDK for Android & iOS'
    },
    unity: {
      id: 'unity',
      name: 'Unity Ads',
      enabled: true,
      game_id_android: '5421980',
      game_id_ios: '5421981',
      rewarded_placement_id: 'Rewarded_Android',
      interstitial_placement_id: 'Interstitial_Android',
      banner_placement_id: 'Banner_Android',
      test_mode: true,
      notes: 'High-eCPM gaming video ads and playable interactive end-cards'
    },
    applovin: {
      id: 'applovin',
      name: 'AppLovin MAX',
      enabled: false,
      sdk_key: '',
      rewarded_unit_id: 'max_rewarded_01',
      interstitial_unit_id: 'max_interstitial_01',
      banner_unit_id: 'max_banner_01',
      test_mode: true,
      notes: 'Real-time in-app bidding and mediation with premium demand'
    },
    ironsource: {
      id: 'ironsource',
      name: 'ironSource (LevelPlay)',
      enabled: false,
      app_key: '',
      rewarded_instance: 'DefaultRewardedVideo',
      interstitial_instance: 'DefaultInterstitial',
      banner_instance: 'DefaultBanner',
      test_mode: true,
      notes: 'Unity LevelPlay mediation engine with rewarded user progression hooks'
    },
    meta: {
      id: 'meta',
      name: 'Meta Audience Network',
      enabled: false,
      app_id: '',
      rewarded_placement_id: '',
      interstitial_placement_id: '',
      banner_placement_id: '',
      test_mode: true,
      notes: 'High-converting Facebook & Instagram audience network mobile ads'
    },
    mintegral: {
      id: 'mintegral',
      name: 'Mintegral',
      enabled: false,
      app_id: '',
      app_key: '',
      rewarded_unit_id: '',
      interstitial_unit_id: '',
      banner_unit_id: '',
      test_mode: true,
      notes: 'Programmatic ad platform specializing in global mobile game traffic'
    }
  }
};

// Helper: load parsed ad configuration from DB
async function loadStoredAdConfig() {
  try {
    const row = await SystemSetting.findByPk('ad_system_config');
    if (row && row.setting_value) {
      const parsed = JSON.parse(row.setting_value);
      // Merge with default providers in case new providers were added
      return {
        ...DEFAULT_AD_CONFIG,
        ...parsed,
        providers: {
          ...DEFAULT_AD_CONFIG.providers,
          ...(parsed.providers || {})
        }
      };
    }
  } catch (err) {
    console.warn('Notice loading ad_system_config:', err.message);
  }
  return DEFAULT_AD_CONFIG;
}

// Admin: Get complete Ad Configuration & Placements
async function getAdminAdConfig(req, res) {
  try {
    const config = await loadStoredAdConfig();
    const placements = await AdPlacement.findAll({ order: [['id', 'ASC']] });
    return res.json({
      success: true,
      config,
      placements
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve ad configuration', error: err.message });
  }
}

// Admin: Update full Ad Configuration
async function updateAdminAdConfig(req, res) {
  try {
    const { config } = req.body;
    if (!config) return res.status(400).json({ success: false, message: 'Configuration payload is required' });

    const currentConfig = await loadStoredAdConfig();
    const updatedConfig = {
      ...currentConfig,
      ...config,
      providers: {
        ...currentConfig.providers,
        ...(config.providers || {})
      }
    };

    // Store in SystemSetting
    await SystemSetting.upsert({
      setting_key: 'ad_system_config',
      setting_value: JSON.stringify(updatedConfig),
      setting_label: 'Ad Networks & Global Configuration',
      setting_type: 'json',
      description: 'Global master ad switches, active networks (AdMob, Unity, AppLovin, ironSource, Meta, Mintegral), and unit IDs'
    });

    // Also synchronize individual settings for fast queries
    if (updatedConfig.rewarded_pts !== undefined) {
      await SystemSetting.upsert({
        setting_key: 'ad_video_reward_pts',
        setting_value: String(updatedConfig.rewarded_pts),
        setting_label: 'Rewarded Ad Video Reward',
        setting_type: 'number',
        description: 'Points earned per watched rewarded video'
      });
    }

    if (updatedConfig.global_cooldown_sec !== undefined) {
      await SystemSetting.upsert({
        setting_key: 'ad_reward_cooldown_sec',
        setting_value: String(updatedConfig.global_cooldown_sec),
        setting_label: 'Ad Cooldown Time (sec)',
        setting_type: 'number',
        description: 'Google Play ad spam policy compliance cooldown'
      });
    }

    return res.json({
      success: true,
      message: 'Ad system configuration updated successfully',
      config: updatedConfig
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update ad configuration', error: err.message });
  }
}

// Admin: Quick Master Toggle (Enable or Disable all ads globally)
async function toggleGlobalAds(req, res) {
  try {
    const { enabled } = req.body;
    const isEnabled = Boolean(enabled);

    const config = await loadStoredAdConfig();
    config.ads_enabled = isEnabled;

    await SystemSetting.upsert({
      setting_key: 'ad_system_config',
      setting_value: JSON.stringify(config),
      setting_label: 'Ad Networks & Global Configuration',
      setting_type: 'json',
      description: 'Global master ad switches, active networks, and unit IDs'
    });

    return res.json({
      success: true,
      message: isEnabled ? 'All ads are now ENABLED globally' : 'All ads are now DISABLED globally',
      ads_enabled: isEnabled
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle global ads', error: err.message });
  }
}

// Admin: Get all ad placements
async function getAdPlacements(req, res) {
  try {
    const placements = await AdPlacement.findAll({ order: [['id', 'ASC']] });
    return res.json({ success: true, placements });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve ad placements', error: err.message });
  }
}

// Admin: Create new ad placement
async function createAdPlacement(req, res) {
  try {
    const { placement_key, name, ad_type, ad_unit_id_android, cooldown_seconds, daily_cap, reward_points, est_ecpm_usd, is_active } = req.body;
    if (!placement_key || !name || !ad_type) {
      return res.status(400).json({ success: false, message: 'placement_key, name, and ad_type are required' });
    }

    const existing = await AdPlacement.findOne({ where: { placement_key } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Placement with key '${placement_key}' already exists` });
    }

    const placement = await AdPlacement.create({
      placement_key,
      name,
      ad_type,
      ad_unit_id_android: ad_unit_id_android || 'ca-app-pub-3940256099942544/5224354917',
      cooldown_seconds: parseInt(cooldown_seconds || 60, 10),
      daily_cap: parseInt(daily_cap || 20, 10),
      reward_points: parseInt(reward_points || 2, 10),
      est_ecpm_usd: parseFloat(est_ecpm_usd || 15.00),
      is_active: is_active !== false
    });

    return res.json({ success: true, message: 'Ad placement created successfully', placement });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create ad placement', error: err.message });
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

// Admin: Delete ad placement
async function deleteAdPlacement(req, res) {
  try {
    const { id } = req.params;
    const placement = await AdPlacement.findByPk(id);
    if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });

    await placement.destroy();
    return res.json({ success: true, message: 'Ad placement deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete ad placement', error: err.message });
  }
}

// Mobile Client: Get Active Ad Placements & Config (respects global master toggle & providers)
async function getClientAdConfig(req, res) {
  try {
    const config = await loadStoredAdConfig();

    // If ads are disabled globally by administrator
    if (!config.ads_enabled) {
      return res.json({
        success: true,
        ads_enabled: false,
        placements: [],
        config: {
          ads_enabled: false,
          message: 'Ads are currently paused by administrator'
        }
      });
    }

    // Active placements in database
    const placements = await AdPlacement.findAll({ where: { is_active: true } });

    // Active ad providers
    const activeProviders = Object.entries(config.providers || {})
      .filter(([_, p]) => p.enabled)
      .map(([key, p]) => ({
        id: key,
        name: p.name,
        test_mode: p.test_mode || config.test_mode
      }));

    const primaryProvider = config.providers[config.primary_provider] || config.providers.admob;
    const fallbackProvider = config.providers[config.fallback_provider] || null;

    return res.json({
      success: true,
      ads_enabled: true,
      test_mode: Boolean(config.test_mode),
      primary_provider: {
        id: config.primary_provider,
        name: primaryProvider?.name || 'Google AdMob',
        app_id_android: primaryProvider?.app_id_android || primaryProvider?.game_id_android || '',
        rewarded_unit_id: primaryProvider?.rewarded_unit_id || primaryProvider?.rewarded_placement_id || '',
        interstitial_unit_id: primaryProvider?.interstitial_unit_id || primaryProvider?.interstitial_placement_id || '',
        banner_unit_id: primaryProvider?.banner_unit_id || primaryProvider?.banner_placement_id || ''
      },
      fallback_provider: fallbackProvider ? {
        id: config.fallback_provider,
        name: fallbackProvider.name,
        rewarded_unit_id: fallbackProvider.rewarded_unit_id || fallbackProvider.rewarded_placement_id || ''
      } : null,
      active_providers: activeProviders,
      placements,
      config: {
        ads_enabled: true,
        cooldown_seconds: parseInt(config.global_cooldown_sec || 90, 10),
        reward_pts: parseInt(config.rewarded_pts || 3, 10),
        daily_cap_per_user: parseInt(config.daily_cap_per_user || 15, 10),
        daily_max_pts: parseInt(config.daily_cap_per_user || 15, 10) * parseInt(config.rewarded_pts || 3, 10),
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
    const config = await loadStoredAdConfig();

    // Verify ads are enabled globally
    if (!config.ads_enabled) {
      return res.status(403).json({
        success: false,
        message: 'Ad rewards are currently paused by administrator'
      });
    }

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
  getAdminAdConfig,
  updateAdminAdConfig,
  toggleGlobalAds,
  getAdPlacements,
  createAdPlacement,
  updateAdPlacement,
  deleteAdPlacement,
  getClientAdConfig,
  claimRewardedAd,
  DEFAULT_AD_CONFIG
};
