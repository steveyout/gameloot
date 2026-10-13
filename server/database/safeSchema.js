const { DataTypes } = require('sequelize');

/**
 * Safely inspects tables and adds any missing columns non-destructively,
 * preserving 100% of existing rows, tables, user balances, and custom settings.
 */
async function ensureSafeSchema(sequelize) {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    // 1. Users table safety checks
    if (tables.includes('users')) {
      const userCols = await queryInterface.describeTable('users');
      if (!userCols.google_id) {
        console.log('📦 [Schema Guard] Safely adding google_id column to users table...');
        await queryInterface.addColumn('users', 'google_id', {
          type: DataTypes.STRING(150),
          allowNull: true,
          unique: true
        });
        console.log('✅ [Schema Guard] google_id column added to users table with data preserved.');
      }
    }

    // 2. Games table safety checks
    if (tables.includes('games')) {
      const gameCols = await queryInterface.describeTable('games');
      if (!gameCols.featured) {
        console.log('📦 [Schema Guard] Safely adding featured column to games table...');
        await queryInterface.addColumn('games', 'featured', {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        });
        console.log('✅ [Schema Guard] featured column added to games table with data preserved.');
      }
      if (!gameCols.banner_url) {
        console.log('📦 [Schema Guard] Safely adding banner_url column to games table...');
        await queryInterface.addColumn('games', 'banner_url', {
          type: DataTypes.STRING(500),
          allowNull: true
        });
      }
    }
  } catch (err) {
    console.warn('⚠️ [Schema Guard Notice]:', err.message);
  }
}

module.exports = { ensureSafeSchema };
