'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('appointments');

    // Add payment_link column if it doesn't exist
    if (!tableDescription.payment_link) {
      await queryInterface.addColumn('appointments', 'payment_link', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Stripe payment link URL sent to patient after doctor approval'
      });
    }

    // Add payment_deadline column if it doesn't exist
    if (!tableDescription.payment_deadline) {
      await queryInterface.addColumn('appointments', 'payment_deadline', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '24 hours from doctor approval for patient to complete payment'
      });
    }

    // Add approved_at column if it doesn't exist
    if (!tableDescription.approved_at) {
      await queryInterface.addColumn('appointments', 'approved_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when doctor approved the appointment'
      });
    }

    // Add rejected_at column if it doesn't exist
    if (!tableDescription.rejected_at) {
      await queryInterface.addColumn('appointments', 'rejected_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when doctor rejected the appointment'
      });
    }

    // Add rejection_reason column if it doesn't exist
    if (!tableDescription.rejection_reason) {
      await queryInterface.addColumn('appointments', 'rejection_reason', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason provided by doctor for rejecting the appointment'
      });
    }

    console.log('✅ Appointment approval fields added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('appointments', 'payment_link');
    await queryInterface.removeColumn('appointments', 'payment_deadline');
    await queryInterface.removeColumn('appointments', 'approved_at');
    await queryInterface.removeColumn('appointments', 'rejected_at');
    await queryInterface.removeColumn('appointments', 'rejection_reason');
    
    console.log('✅ Appointment approval fields removed');
  }
};
