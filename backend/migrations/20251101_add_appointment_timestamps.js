'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('appointments');

    // Add completed_at column if it doesn't exist
    if (!tableDescription.completed_at) {
      await queryInterface.addColumn('appointments', 'completed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when appointment was marked as completed'
      });
    }

    // Add confirmed_at column if it doesn't exist
    if (!tableDescription.confirmed_at) {
      await queryInterface.addColumn('appointments', 'confirmed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when appointment was confirmed'
      });
    }

    console.log('✅ Appointment timestamp fields added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('appointments', 'completed_at');
    await queryInterface.removeColumn('appointments', 'confirmed_at');
    
    console.log('✅ Appointment timestamp fields removed');
  }
};
