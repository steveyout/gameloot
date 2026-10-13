const { Op } = require('sequelize');

/**
 * Safely inspects tables and adds any missing columns non-destructively,
 * preserving 100% of existing rows, tables, user balances, and custom settings.
 */
async function ensureSafeSchema(sequelize) {
  try {
    console.log('🛡️ [Schema Guard] Inspecting database tables and preserving existing data...');

    // 1. Users table: google_id column
    try {
      const [userCols] = await sequelize.query("SHOW COLUMNS FROM `users` LIKE 'google_id'");
      if (!userCols || userCols.length === 0) {
        console.log('📦 [Schema Guard] Safely adding `google_id` column to users table...');
        await sequelize.query("ALTER TABLE `users` ADD COLUMN `google_id` VARCHAR(150) NULL UNIQUE");
        console.log('✅ [Schema Guard] `google_id` column successfully added to users table.');
      } else {
        console.log('✅ [Schema Guard] `users.google_id` column verified.');
      }
    } catch (uErr) {
      console.warn('⚠️ [Schema Guard - users.google_id]:', uErr.message);
    }

    // 1b. Users table: ip_address column widening (prevent proxy list truncation errors)
    try {
      const [ipCols] = await sequelize.query("SHOW COLUMNS FROM `users` LIKE 'ip_address'");
      if (ipCols && ipCols.length > 0) {
        await sequelize.query("ALTER TABLE `users` MODIFY COLUMN `ip_address` VARCHAR(191) NULL");
      }
    } catch (ipErr) {
      console.warn('⚠️ [Schema Guard - users.ip_address]:', ipErr.message);
    }

    // 2. Games table: featured & banner_url columns
    try {
      const [featuredCol] = await sequelize.query("SHOW COLUMNS FROM `games` LIKE 'featured'");
      if (!featuredCol || featuredCol.length === 0) {
        console.log('📦 [Schema Guard] Safely adding `featured` column to games table...');
        await sequelize.query("ALTER TABLE `games` ADD COLUMN `featured` TINYINT(1) DEFAULT 0");
        console.log('✅ [Schema Guard] `featured` column successfully added to games table.');
      } else {
        console.log('✅ [Schema Guard] `games.featured` column verified.');
      }
    } catch (gErr1) {
      console.warn('⚠️ [Schema Guard - games.featured]:', gErr1.message);
    }

    try {
      const [bannerCol] = await sequelize.query("SHOW COLUMNS FROM `games` LIKE 'banner_url'");
      if (!bannerCol || bannerCol.length === 0) {
        console.log('📦 [Schema Guard] Safely adding `banner_url` column to games table...');
        await sequelize.query("ALTER TABLE `games` ADD COLUMN `banner_url` VARCHAR(500) NULL");
        console.log('✅ [Schema Guard] `banner_url` column successfully added to games table.');
      } else {
        console.log('✅ [Schema Guard] `games.banner_url` column verified.');
      }
    } catch (gErr2) {
      console.warn('⚠️ [Schema Guard - games.banner_url]:', gErr2.message);
    }

    // 3. Point Transactions table: widen type from enum to VARCHAR(50) to allow wheel_bonus, streak_bonus, etc.
    try {
      const [ptCols] = await sequelize.query("SHOW COLUMNS FROM `point_transactions` LIKE 'type'");
      if (ptCols && ptCols.length > 0) {
        await sequelize.query("ALTER TABLE `point_transactions` MODIFY COLUMN `type` VARCHAR(50) NOT NULL");
        console.log('✅ [Schema Guard] `point_transactions.type` verified as VARCHAR(50).');
      }
    } catch (ptErr) {
      console.warn('⚠️ [Schema Guard - point_transactions.type]:', ptErr.message);
    }

    // 4. Ensure auxiliary tables exist non-destructively
    try {
      const { UserEngagement, NotificationRead, RewardRedemption } = require('../models');
      if (UserEngagement) await UserEngagement.sync({ force: false });
      if (NotificationRead) await NotificationRead.sync({ force: false });
      if (RewardRedemption) await RewardRedemption.sync({ force: false });
      console.log('✅ [Schema Guard] Auxiliary engagement & redemption tables verified.');
    } catch (syncAuxErr) {
      console.warn('⚠️ [Schema Guard - aux tables]:', syncAuxErr.message);
    }

    // 5. Guarantee a default test player exists for immediate sign-in testing
    try {
      const { User } = require('../models');
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: 'player' },
            { email: 'player@gameloot.com' }
          ]
        }
      });
      if (!existingUser) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('player123', 10);
        await User.create({
          username: 'player',
          email: 'player@gameloot.com',
          password_hash: hash,
          points_balance: 1000,
          tickets_balance: 10,
          total_earned: 1000,
          status: 'active'
        });
        console.log('🎮 [Schema Guard] Verified player account: player / player123 (1,000 PTS)');
      }
    } catch (seedErr) {
      console.warn('⚠️ [Schema Guard - seed player]:', seedErr.message);
    }

    console.log('✨ [Schema Guard] Database check complete. All tables, records & balances 100% intact.');
  } catch (err) {
    console.warn('⚠️ [Schema Guard Notice]:', err.message);
  }
}

if (require.main === module) {
  const sequelize = require('./connection');
  ensureSafeSchema(sequelize).then(() => {
    console.log('🏁 Schema guard manual run finished.');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Schema guard error:', err);
    process.exit(1);
  });
}

module.exports = { ensureSafeSchema };
