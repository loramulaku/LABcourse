/**
 * Utility script to check user details
 * Usage: node utils/checkUser.js <email>
 */

const { User } = require('../models');

async function checkUser(email) {
  try {
    // Find user using Sequelize
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'name', 'role', 'account_status', 'password', 'created_at'],
    });

    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    console.log('✅ User found!');
    console.log('');
    console.log('User Details:');
    console.log('  ID:', user.id);
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Account Status:', user.account_status);
    console.log('  Created:', user.created_at);
    console.log('');
    console.log('Password Info:');
    console.log('  Hash (first 30 chars):', user.password.substring(0, 30) + '...');
    console.log('  Hash length:', user.password.length);
    console.log('  Is bcrypt hash:', user.password.startsWith('$2b$') || user.password.startsWith('$2a$'));
    console.log('  Is argon2 hash:', user.password.startsWith('$argon2'));
    console.log('');

    console.log('To test password, run:');
    console.log('  node utils/testPassword.js', email, '<password>');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.log('Usage: node utils/checkUser.js <email>');
  console.log('Example: node utils/checkUser.js user@example.com');
  process.exit(1);
}

checkUser(email);
