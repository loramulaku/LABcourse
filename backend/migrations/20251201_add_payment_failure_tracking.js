'use strict';

/**
 * Migration: Add Payment Failure Tracking
 * 
 * This migration adds support for tracking payment failures in the appointments table:
 * - Adds 'failed' status to payment_status ENUM
 * - Adds payment_failure_reason column to store error details
 * - Adds index on payment_status for performance
 * 
 * Part of: Webhook Event Handler System
 * Related: WebhookEventHandler.js, PaymentService.js
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔧 Adding payment failure tracking to appointments table...');
    
    const tableDescription = await queryInterface.describeTable('appointments');
    
    // Step 1: Update payment_status ENUM to include 'failed'
    console.log('📝 Updating payment_status ENUM...');
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN payment_status 
      ENUM('unpaid', 'paid', 'refunded', 'expired', 'failed') 
      DEFAULT 'unpaid'
    `);
    console.log('✅ Added "failed" to payment_status ENUM');
    
    // Step 2: Add payment_failure_reason column if it doesn't exist
    if (!tableDescription.payment_failure_reason) {
      console.log('📝 Adding payment_failure_reason column...');
      await queryInterface.addColumn('appointments', 'payment_failure_reason', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'payment_status',
        comment: 'Stores the reason why payment failed (e.g., card declined, insufficient funds)'
      });
      console.log('✅ Added payment_failure_reason column');
    } else {
      console.log('ℹ️  payment_failure_reason column already exists, skipping');
    }
    
    // Step 3: Add index on payment_status for performance (if it doesn't exist)
    console.log('📝 Creating index on payment_status...');
    try {
      // Check if index exists
      const [indexes] = await queryInterface.sequelize.query(`
        SHOW INDEX FROM appointments WHERE Key_name = 'idx_payment_status'
      `);
      
      if (indexes.length === 0) {
        await queryInterface.addIndex('appointments', ['payment_status'], {
          name: 'idx_payment_status',
          using: 'BTREE'
        });
        console.log('✅ Created index idx_payment_status');
      } else {
        console.log('ℹ️  Index idx_payment_status already exists, skipping');
      }
    } catch (error) {
      console.log('⚠️  Could not create index (may already exist):', error.message);
    }
    
    console.log('✅ Payment failure tracking migration completed successfully');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔧 Reverting payment failure tracking from appointments table...');
    
    const tableDescription = await queryInterface.describeTable('appointments');
    
    // Step 1: Remove index if it exists
    console.log('📝 Removing index on payment_status...');
    try {
      const [indexes] = await queryInterface.sequelize.query(`
        SHOW INDEX FROM appointments WHERE Key_name = 'idx_payment_status'
      `);
      
      if (indexes.length > 0) {
        await queryInterface.removeIndex('appointments', 'idx_payment_status');
        console.log('✅ Removed index idx_payment_status');
      } else {
        console.log('ℹ️  Index idx_payment_status does not exist, skipping');
      }
    } catch (error) {
      console.log('⚠️  Could not remove index:', error.message);
    }
    
    // Step 2: Remove payment_failure_reason column if it exists
    if (tableDescription.payment_failure_reason) {
      console.log('📝 Removing payment_failure_reason column...');
      await queryInterface.removeColumn('appointments', 'payment_failure_reason');
      console.log('✅ Removed payment_failure_reason column');
    } else {
      console.log('ℹ️  payment_failure_reason column does not exist, skipping');
    }
    
    // Step 3: Revert payment_status ENUM (remove 'failed')
    console.log('📝 Reverting payment_status ENUM...');
    
    // First, update any 'failed' statuses to 'unpaid' to avoid data loss
    await queryInterface.sequelize.query(`
      UPDATE appointments 
      SET payment_status = 'unpaid' 
      WHERE payment_status = 'failed'
    `);
    console.log('ℹ️  Updated failed payments to unpaid status');
    
    // Then modify the ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN payment_status 
      ENUM('unpaid', 'paid', 'refunded', 'expired') 
      DEFAULT 'unpaid'
    `);
    console.log('✅ Reverted payment_status ENUM (removed "failed")');
    
    console.log('✅ Payment failure tracking rollback completed');
  }
};
