const bcrypt = require('bcryptjs');
const {
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
  Notification
} = require('../models');

async function seed() {
  console.log('🌱 [ORM Seed] Running database seeders with Google Play Compliance...');

  try {
    // 1. Admin Superadmin
    const adminEmail = 'admin@gameloot.com';
    const existingAdmin = await Admin.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await Admin.create({
        username: 'admin',
        email: adminEmail,
        password_hash: passwordHash,
        role: 'superadmin',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150'
      });
      console.log('👑 Superadmin seeded: admin@gameloot.com / admin123');
    }

    // 1b. Default Player
    const playerEmail = 'player@gameloot.com';
    const existingPlayer = await User.findOne({ where: { email: playerEmail } });
    if (!existingPlayer) {
      const playerPass = await bcrypt.hash('player123', 10);
      await User.create({
        username: 'player',
        email: playerEmail,
        password_hash: playerPass,
        points_balance: 1000,
        tickets_balance: 10,
        total_earned: 1000,
        status: 'active'
      });
      console.log('🎮 Player account seeded: player / player123 (1,000 PTS)');
    }

    // 2. Categories
    const categoriesData = [
      { name: 'Arcade & Retro', slug: 'arcade', icon: 'Gamepad2', description: 'Fast-paced classic reflex arcade challenges', display_order: 1 },
      { name: 'Puzzle & Brain', slug: 'puzzle', icon: 'Brain', description: 'Test logic, puzzle solving, and memory skills', display_order: 2 },
      { name: 'Action & Adventure', slug: 'action', icon: 'Flame', description: 'Exciting combat, dodging, and adventure platforms', display_order: 3 },
      { name: 'Casual & Relaxing', slug: 'casual', icon: 'Coffee', description: 'Simple, addictive one-tap and relaxing sessions', display_order: 4 },
      { name: 'Sports & Racing', slug: 'sports', icon: 'Trophy', description: 'High speed drives, athletic skills, and sports fun', display_order: 5 }
    ];

    for (const cat of categoriesData) {
      await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat
      });
    }
    console.log('📁 Categories seeded.');

    // 3. Games (Google Play Ad-Funded Sustainable Rates: 1-2 PTS per min)
    const arcCat = await Category.findOne({ where: { slug: 'arcade' } });
    const puzCat = await Category.findOne({ where: { slug: 'puzzle' } });
    const actCat = await Category.findOne({ where: { slug: 'action' } });
    const casCat = await Category.findOne({ where: { slug: 'casual' } });
    const sptCat = await Category.findOne({ where: { slug: 'sports' } });

    const gamesData = [
      {
        title: '2048 Cyber Edition',
        slug: '2048-cyber',
        category_id: puzCat ? puzCat.id : 1,
        description: 'Swipe and merge numbers to hit the legendary 2048 tile. Highly addictive mental puzzle!',
        thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
        banner_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
        embed_url: 'https://play2048.co/',
        orientation: 'portrait',
        reward_rate: 1, // 1 pt/min ($0.001)
        max_daily_reward: 30, // max 30 pts/day ($0.030)
        min_play_seconds: 45,
        featured: true,
        rating: 4.9,
        play_count: 1420
      },
      {
        title: 'Hextris Hexagon Mania',
        slug: 'hextris-mania',
        category_id: arcCat ? arcCat.id : 1,
        description: 'Fast paced hexagonal puzzle game inspired by Tetris. Match 3 colors to clear lines before hex overflows!',
        thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
        banner_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
        embed_url: 'https://hextris.io/',
        orientation: 'any',
        reward_rate: 1,
        max_daily_reward: 30,
        min_play_seconds: 45,
        featured: true,
        rating: 4.8,
        play_count: 980
      },
      {
        title: 'Tower Master 3D',
        slug: 'tower-master-3d',
        category_id: casCat ? casCat.id : 1,
        description: 'Stack blocks with precision timing to construct the highest skyscraper in the metropolis.',
        thumbnail_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&q=80',
        banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80',
        embed_url: 'https://flappybird.io/',
        orientation: 'portrait',
        reward_rate: 1,
        max_daily_reward: 25,
        min_play_seconds: 30,
        featured: false,
        rating: 4.7,
        play_count: 670
      },
      {
        title: 'Retro Space Invaders',
        slug: 'space-invaders-retro',
        category_id: actCat ? actCat.id : 1,
        description: 'Defend planet Earth from waves of cosmic alien armadas in this arcade classic revival.',
        thumbnail_url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=500&q=80',
        banner_url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=1200&q=80',
        embed_url: 'https://freeinvaders.org/',
        orientation: 'landscape',
        reward_rate: 2,
        max_daily_reward: 40,
        min_play_seconds: 60,
        featured: true,
        rating: 4.9,
        play_count: 1850
      },
      {
        title: 'Speed Neon Racer',
        slug: 'speed-neon-racer',
        category_id: sptCat ? sptCat.id : 1,
        description: 'Blaze through neon-lit futuristic highways, dodge supersonic traffic, and beat the clock!',
        thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80',
        banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
        embed_url: 'https://slowroads.io/',
        orientation: 'landscape',
        reward_rate: 2,
        max_daily_reward: 40,
        min_play_seconds: 60,
        featured: true,
        rating: 4.85,
        play_count: 2310
      }
    ];

    for (const g of gamesData) {
      await Game.findOrCreate({
        where: { slug: g.slug },
        defaults: g
      });
    }
    console.log('🎮 Games catalog updated with Google Play low sustainable reward rates.');

    // 4. Reward Items (Google Play Sustainable: 1,000 PTS = $1.00 USD)
    const rewardItemsData = [
      { title: 'PayPal $1.00 Micro Cashout', type: 'paypal', cost_points: 1000, cash_value_usd: 1.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/174/174861.png', description: 'Fast entry-level payout to PayPal balance', stock: 500 },
      { title: 'PayPal $5.00 Payout', type: 'paypal', cost_points: 5000, cash_value_usd: 5.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/174/174861.png', description: 'Cash direct to verified PayPal email', stock: 200 },
      { title: 'Google Play $5 Gift Card', type: 'google_play', cost_points: 5000, cash_value_usd: 5.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/888/888857.png', description: 'Digital redemption code for Android Play Store', stock: 100 },
      { title: 'Steam Wallet $5 Code', type: 'steam', cost_points: 5000, cash_value_usd: 5.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/220/220223.png', description: 'Steam wallet digital code voucher', stock: 80 },
      { title: 'USDT $5 Crypto Payout', type: 'crypto', cost_points: 5000, cash_value_usd: 5.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/7047/7047059.png', description: 'Sent to your BEP20 or Polygon address', stock: 150 },
      { title: 'Amazon $10 Gift Card', type: 'amazon', cost_points: 10000, cash_value_usd: 10.00, icon_url: 'https://cdn-icons-png.flaticon.com/512/5968/5968204.png', description: 'Shop anything on Amazon store', stock: 50 }
    ];

    for (const r of rewardItemsData) {
      await RewardItem.findOrCreate({
        where: { title: r.title },
        defaults: r
      });
    }
    console.log('🎁 Reward items synchronized.');

    // 5. System Settings (Google Play Compliant Anti-Deception & Sustainability)
    const defaultSettings = [
      { setting_key: 'points_per_usd', setting_value: '1000', setting_label: 'Points per $1.00 USD', setting_type: 'number', description: 'Base exchange rate (1,000 points = $1.00 USD; 1 point = $0.001)' },
      { setting_key: 'min_payout_points', setting_value: '1000', setting_label: 'Minimum Cashout Threshold', setting_type: 'number', description: 'Low $1.00 threshold so users trust the app without excessive unachievable barriers' },
      { setting_key: 'daily_max_points_global', setting_value: '120', setting_label: 'Global Daily Points Cap', setting_type: 'number', description: 'Limits max payout liability per user to $0.12/day, well covered by ad impressions' },
      { setting_key: 'ping_interval_seconds', setting_value: '45', setting_label: 'Heartbeat Ping Interval (sec)', setting_type: 'number', description: 'Time interval required for valid proof-of-play ping' },
      { setting_key: 'ad_video_reward_pts', setting_value: '3', setting_label: 'Rewarded Ad Video Reward', setting_type: 'number', description: 'Points earned per watched rewarded video ($0.003 payout vs $0.015+ ad eCPM)' },
      { setting_key: 'ad_reward_cooldown_sec', setting_value: '90', setting_label: 'Ad Cooldown Time (sec)', setting_type: 'number', description: 'Google Play ad spam policy compliance - minimum spacing between ad prompts' },
      { setting_key: 'maintenance_mode', setting_value: 'false', setting_label: 'Maintenance Mode', setting_type: 'boolean', description: 'Temporarily disable earnings and cashouts' },
      { setting_key: 'google_play_disclaimer', setting_value: 'true', setting_label: 'Google Play Policy Disclaimer', setting_type: 'boolean', description: 'Disclose that points are loyalty rewards funded by sponsors, not real money gambling' },
      { setting_key: 'app_latest_version', setting_value: '1.1.0', setting_label: 'App Latest Version', setting_type: 'string', description: 'Latest public release version string (SemVer)' },
      { setting_key: 'app_min_version', setting_value: '1.0.0', setting_label: 'App Minimum Required Version', setting_type: 'string', description: 'Minimum version required. Any version below this is blocked from continuing' },
      { setting_key: 'app_version_code', setting_value: '11', setting_label: 'App Version Code (Android)', setting_type: 'number', description: 'Latest Android versionCode integer from build gradle' },
      { setting_key: 'app_force_update', setting_value: 'true', setting_label: 'Force App Update', setting_type: 'boolean', description: 'When enabled, lock users on older versions with a non-dismissible update modal' },
      { setting_key: 'app_update_url', setting_value: 'https://play.google.com/store/apps/details?id=com.gameloot.app', setting_label: 'Google Play Store URL', setting_type: 'string', description: 'Link opened when user taps Update on Google Play' },
      { setting_key: 'app_download_apk_url', setting_value: 'https://gameloot.app/releases/GameLoot-v1.1.0.apk', setting_label: 'Direct APK Download URL', setting_type: 'string', description: 'Fallback direct APK link for sideloading or non-GMS devices' },
      { setting_key: 'app_release_notes', setting_value: '• High-speed HTML5 game rendering optimizations\n• Daily loot chest 2x reward boost\n• Instant wallet payouts & enhanced security\n• Google Play compliance & anti-cheat engine update', setting_label: 'Release Notes (What\'s New)', setting_type: 'textarea', description: 'Displayed in update modal explaining changes to users' }
    ];

    for (const s of defaultSettings) {
      await SystemSetting.findOrCreate({
        where: { setting_key: s.setting_key },
        defaults: s
      });
    }
    console.log('⚙️ System settings updated for ad-revenue sustainability.');

    // 6. AdMob / Ad Placements
    const adPlacements = [
      {
        placement_key: 'rewarded_session_boost',
        name: 'Game Session 2x Points Multiplier',
        ad_type: 'rewarded_video',
        ad_unit_id_android: 'ca-app-pub-3940256099942544/5224354917',
        cooldown_seconds: 90,
        daily_cap: 15,
        reward_points: 3,
        est_ecpm_usd: 16.50
      },
      {
        placement_key: 'interstitial_game_exit',
        name: 'Game Return to Lobby Interstitial',
        ad_type: 'interstitial',
        ad_unit_id_android: 'ca-app-pub-3940256099942544/1033173712',
        cooldown_seconds: 120,
        daily_cap: 10,
        reward_points: 0,
        est_ecpm_usd: 8.00
      },
      {
        placement_key: 'rewarded_daily_chest',
        name: 'Daily Free Loot Chest',
        ad_type: 'rewarded_video',
        ad_unit_id_android: 'ca-app-pub-3940256099942544/5224354917',
        cooldown_seconds: 300,
        daily_cap: 5,
        reward_points: 5,
        est_ecpm_usd: 18.00
      },
      {
        placement_key: 'banner_bottom_home',
        name: 'Sticky Bottom Banner',
        ad_type: 'banner',
        ad_unit_id_android: 'ca-app-pub-3940256099942544/6300978111',
        cooldown_seconds: 30,
        daily_cap: 200,
        reward_points: 0,
        est_ecpm_usd: 1.20
      }
    ];

    for (const ad of adPlacements) {
      await AdPlacement.findOrCreate({
        where: { placement_key: ad.placement_key },
        defaults: ad
      });
    }
    console.log('📺 Google AdMob placements synchronized.');

    // 7. Sample Initial Broadcast Notifications
    const sampleNotifications = [
      {
        title: '🎉 Welcome to GameLoot! Claim Starter Gift',
        message: 'Welcome to the ultimate play-to-earn HTML5 gaming arcade! Tap below to claim your complimentary +50 PTS welcome gift.',
        type: 'bonus',
        bonus_points: 50,
        action_screen: 'wallet',
        target_audience: 'all',
        sender_admin: 'GameLoot Staff'
      },
      {
        title: '⚡ Weekend 2X Point Multiplier Active!',
        message: 'All play sessions in Speed Neon Racer and Space Invaders will yield 2x points this weekend. Hop into the arcade now!',
        type: 'announcement',
        bonus_points: 0,
        action_screen: 'lobby',
        target_audience: 'all',
        sender_admin: 'GameLoot Staff'
      },
      {
        title: '💎 Daily Streak & Lucky Wheel Unlocked!',
        message: 'Check in every day to collect free points and spin the Lucky Wheel for up to 500 PTS jackpot rewards!',
        type: 'reward',
        bonus_points: 25,
        action_screen: 'earn',
        target_audience: 'all',
        sender_admin: 'GameLoot Staff'
      }
    ];

    for (const n of sampleNotifications) {
      await Notification.findOrCreate({
        where: { title: n.title },
        defaults: n
      });
    }
    console.log('🔔 Sample notifications initialized.');

    console.log('✨ [ORM Seed] Seeding completed successfully with Google Play Compliance.');
  } catch (error) {
    console.error('❌ [ORM Seed] Failed to seed database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seed().then(() => {
    process.exit(0);
  });
}

module.exports = seed;
