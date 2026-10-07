require('dotenv').config();
const { sequelize, User } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');

    await sequelize.sync({ alter: true });
    console.log('✅ Models synced');

    const users = [
      {
        email: 'admin@cms.com',
        password_hash: 'admin123',
        full_name: 'System Admin',
        role: 'admin',
        is_verified: true,
      },
      {
        email: 'officer@cms.com',
        password_hash: 'officer123',
        full_name: 'Officer Smith',
        role: 'officer',
        is_verified: true,
      },
      {
        email: 'detective@cms.com',
        password_hash: 'detective123',
        full_name: 'Detective Bekele',
        role: 'detective',
        is_verified: true,
      },
      {
        email: 'citizen@cms.com',
        password_hash: 'citizen123',
        full_name: 'John Citizen',
        role: 'citizen',
        is_verified: true,
      },
    ];

    for (const u of users) {
      const [user, created] = await User.findOrCreate({
        where: { email: u.email },
        defaults: u,
      });
      console.log(created ? `✅ Created: ${u.email}` : `ℹ️  Exists: ${u.email}`);
    }

    console.log('\n🎉 Seed complete!\n');
    console.log('Test credentials:');
    console.log('  Admin:     admin@cms.com     / admin123');
    console.log('  Officer:   officer@cms.com   / officer123');
    console.log('  Detective: detective@cms.com / detective123');
    console.log('  Citizen:   citizen@cms.com   / citizen123\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
})();