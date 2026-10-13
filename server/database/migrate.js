const { sequelize } = require('../models');

async function migrate() {
  console.log('🔄 [ORM Migration] Connecting to MySQL and synchronizing schema...');
  try {
    await sequelize.authenticate();
    console.log('✅ [ORM Migration] Database connection established successfully.');

    // sync({ alter: true }) updates tables to match models without dropping data
    await sequelize.sync({ alter: true });
    console.log('🚀 [ORM Migration] All tables synchronized with Sequelize models!');
  } catch (error) {
    console.error('❌ [ORM Migration] Failed to migrate database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate().then(() => {
    console.log('🎉 Migration finished.');
    process.exit(0);
  });
}

module.exports = migrate;
