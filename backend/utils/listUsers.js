const { User } = require('../models');

(async () => {
  try {
    // Get all users using Sequelize
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'account_status'],
      order: [['id', 'ASC']],
    });
    
    console.log('');
    console.log('All Users in Database:');
    console.log('======================================');
    users.forEach(u => {
      console.log(`ID: ${u.id} | ${u.email}`);
      console.log(`   Name: ${u.name}`);
      console.log(`   Role: ${u.role} | Status: ${u.account_status}`);
      console.log('---');
    });
    console.log('======================================');
    console.log('Total users:', users.length);
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
