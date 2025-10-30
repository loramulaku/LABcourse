'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const db = require('../models');

      // Check if admin user already exists
      const existingAdmin = await db.User.findOne({
        where: { email: 'admin@labcourse.com' },
      });

      if (existingAdmin) {
        console.log('ℹ️  Admin user already exists, skipping creation');
        return;
      }

      // Create admin user using Sequelize ORM
      const adminUser = await db.User.create({
        name: 'Admin User',
        email: 'admin@labcourse.com',
        password: 'admin123', // Will be hashed by the beforeCreate hook
        role: 'admin',
        account_status: 'active',
      });

      // Create admin user profile
      await db.UserProfile.create({
        user_id: adminUser.id,
        phone: '+355123456789',
        profile_image: 'uploads/default.png',
        notifications_enabled: true,
      });

      console.log('✅ Admin user created: admin@labcourse.com (password: admin123)');
    } catch (error) {
      console.error('❌ Error creating admin user:', error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error('  - ' + err.message));
      }
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const db = require('../models');

      // Delete admin user (cascade will handle profile deletion)
      await db.User.destroy({
        where: {
          email: 'admin@labcourse.com',
        },
      });

      console.log('⚠️  Admin user removed');
    } catch (error) {
      console.error('❌ Error removing admin user:', error.message);
      throw error;
    }
  },
};
