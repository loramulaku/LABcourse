'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update user role to admin for lora@gmail.com
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = 'admin' 
      WHERE email = 'lora@gmail.com';
    `);
    console.log('✅ User lora@gmail.com role updated to admin');
  },

  async down (queryInterface, Sequelize) {
    // Revert user role back to user for lora@gmail.com
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = 'user' 
      WHERE email = 'lora@gmail.com';
    `);
    console.log('⚠️  User lora@gmail.com role reverted to user');
  }
};
