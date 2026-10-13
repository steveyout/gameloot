const { sequelize } = require('../models');
const { ensureSafeSchema } = require('./safeSchema');

async function migrate() {
  console.log('🔄 [ORM Migration] Connecting to MySQL and synchronizing schema safely...');
  try {
    await sequelize.authenticate();
    console.log('✅ [ORM Migration] Database connection established successfully.');

    // sync({ force: false, alter: false }) creates missing tables without dropping or altering existing data
    await sequelize.sync({ force: false, alter: false });

    // Non-destructive schema check: adds missing columns without touching existing records
    await ensureSafeSchema(sequelize);

    console.log('🚀 [ORM Migration] Schema synchronization complete. All existing database records 100% preserved!');
  } catch (error) {
    console.error('❌ [ORM Migration] Failed to migrate database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate().then(() => {
    console.log('🎉 Safe migration finished.');
    process.exit(0);
  });
}

module.exports = migrate;
