/**
 * Utility script to test if a password matches a user's stored hash
 * Usage: node utils/testPassword.js <email> <password>
 */

const argon2 = require('argon2');
const bcrypt = require('bcrypt');
const { User } = require('../models');

async function testPassword(email, password) {
  try {
    // Find user using Sequelize
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'name', 'password'],
    });

    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    console.log('✅ User found:', user.name);
    console.log('');
    console.log('Testing password...');
    console.log('  Provided password:', password);
    console.log('  Password length:', password.length);
    console.log('  Stored hash:', user.password.substring(0, 30) + '...');
    console.log('  Hash type:', user.password.startsWith('$argon2') ? 'Argon2' : user.password.startsWith('$2') ? 'bcrypt' : 'unknown');
    console.log('');

    // Test with appropriate method
    let match = false;
    if (user.password.startsWith('$argon2')) {
      match = await argon2.verify(user.password, password);
    } else if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      match = await bcrypt.compare(password, user.password);
    }
    
    if (match) {
      console.log('✅ ✅ ✅ PASSWORD MATCHES! ✅ ✅ ✅');
      console.log('');
      console.log('This password is correct for user:', email);
    } else {
      console.log('❌ ❌ ❌ PASSWORD DOES NOT MATCH! ❌ ❌ ❌');
      console.log('');
      console.log('The password you entered is incorrect.');
      console.log('');
      console.log('To reset the password, run:');
      console.log('  node utils/resetUserPassword.js', email, '<newPassword>');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node utils/testPassword.js <email> <password>');
  console.log('Example: node utils/testPassword.js user@example.com mypassword');
  process.exit(1);
}

testPassword(email, password);
