/**
 * Utility script to reset a user's password
 * Usage: node utils/resetUserPassword.js <email> <newPassword>
 */

const { User } = require('../models');

async function resetPassword(email, newPassword) {
  try {
    // Find user using Sequelize
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'name'],
    });

    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    console.log('✅ User found:', user.name, '(ID:', user.id + ')');
    console.log('🔐 Hashing password with Argon2...');

    // Update password using Sequelize (hooks will auto-hash with Argon2)
    await User.update(
      { password: newPassword },
      {
        where: { id: user.id }
        // hooks enabled - will hash with Argon2
      }
    );

    console.log('✅ Password updated successfully!');
    console.log('');
    console.log('You can now login with:');
    console.log('  Email:', email);
    console.log('  Password:', newPassword);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node utils/resetUserPassword.js <email> <newPassword>');
  console.log('Example: node utils/resetUserPassword.js user@example.com newpass123');
  process.exit(1);
}

resetPassword(email, newPassword);
