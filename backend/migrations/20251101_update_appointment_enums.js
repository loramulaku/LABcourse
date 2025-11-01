'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update status ENUM to include APPROVED and COMPLETED
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'DECLINED', 'CANCELLED') 
      DEFAULT 'PENDING'
    `);

    // Update payment_status ENUM to include expired
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN payment_status ENUM('unpaid', 'paid', 'refunded', 'expired') 
      DEFAULT 'unpaid'
    `);

    console.log('✅ Appointment ENUM fields updated successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN status ENUM('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED') 
      DEFAULT 'PENDING'
    `);

    // Revert payment_status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN payment_status ENUM('unpaid', 'paid', 'refunded') 
      DEFAULT 'unpaid'
    `);

    console.log('✅ Appointment ENUM fields reverted');
  }
};
