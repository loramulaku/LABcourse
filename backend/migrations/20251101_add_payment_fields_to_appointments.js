'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Adding payment and status timestamp fields to appointments table...');
    
    const tableDescription = await queryInterface.describeTable('appointments');
    
    // Add payment_link if it doesn't exist
    if (!tableDescription.payment_link) {
      await queryInterface.addColumn('appointments', 'payment_link', {
        type: Sequelize.STRING(500),
        allowNull: true,
        after: 'currency'
      });
      console.log('✅ Added payment_link column');
    }
    
    // Add payment_deadline if it doesn't exist
    if (!tableDescription.payment_deadline) {
      await queryInterface.addColumn('appointments', 'payment_deadline', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'payment_link'
      });
      console.log('✅ Added payment_deadline column');
    }
    
    // Add approved_at if it doesn't exist
    if (!tableDescription.approved_at) {
      await queryInterface.addColumn('appointments', 'approved_at', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'payment_deadline'
      });
      console.log('✅ Added approved_at column');
    }
    
    // Add rejected_at if it doesn't exist
    if (!tableDescription.rejected_at) {
      await queryInterface.addColumn('appointments', 'rejected_at', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'approved_at'
      });
      console.log('✅ Added rejected_at column');
    }
    
    // Add rejection_reason if it doesn't exist
    if (!tableDescription.rejection_reason) {
      await queryInterface.addColumn('appointments', 'rejection_reason', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'rejected_at'
      });
      console.log('✅ Added rejection_reason column');
    }
    
    // Add paid_at if it doesn't exist
    if (!tableDescription.paid_at) {
      await queryInterface.addColumn('appointments', 'paid_at', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'rejection_reason'
      });
      console.log('✅ Added paid_at column');
    }
    
    // Add cancelled_at if it doesn't exist
    if (!tableDescription.cancelled_at) {
      await queryInterface.addColumn('appointments', 'cancelled_at', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'paid_at'
      });
      console.log('✅ Added cancelled_at column');
    }
    
    // Add completed_at if it doesn't exist
    if (!tableDescription.completed_at) {
      await queryInterface.addColumn('appointments', 'completed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'cancelled_at'
      });
      console.log('✅ Added completed_at column');
    }
    
    // Add confirmed_at if it doesn't exist
    if (!tableDescription.confirmed_at) {
      await queryInterface.addColumn('appointments', 'confirmed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'completed_at'
      });
      console.log('✅ Added confirmed_at column');
    }
    
    console.log('✅ All payment and timestamp fields added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔧 Removing payment and status timestamp fields from appointments table...');
    
    const tableDescription = await queryInterface.describeTable('appointments');
    
    const columnsToRemove = [
      'payment_link',
      'payment_deadline',
      'approved_at',
      'rejected_at',
      'rejection_reason',
      'paid_at',
      'cancelled_at',
      'completed_at',
      'confirmed_at'
    ];
    
    for (const column of columnsToRemove) {
      if (tableDescription[column]) {
        await queryInterface.removeColumn('appointments', column);
        console.log(`✅ Removed ${column} column`);
      }
    }
    
    console.log('✅ All payment and timestamp fields removed');
  }
};
