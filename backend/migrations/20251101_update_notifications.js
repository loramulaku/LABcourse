'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update notification_type ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN notification_type ENUM(
        'result_ready', 
        'appointment_approved', 
        'appointment_confirmed', 
        'appointment_cancelled', 
        'appointment_declined', 
        'general_message', 
        'system_alert'
      ) DEFAULT 'general_message'
    `);

    // Add appointment_id column if it doesn't exist
    const tableDescription = await queryInterface.describeTable('notifications');
    if (!tableDescription.appointment_id) {
      await queryInterface.addColumn('notifications', 'appointment_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Related appointment ID for appointment notifications',
        after: 'notification_type'
      });
    }

    console.log('✅ Notifications table updated successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('notifications', 'appointment_id');
    
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN notification_type ENUM(
        'result_ready', 
        'appointment_confirmed', 
        'appointment_cancelled', 
        'general_message', 
        'system_alert'
      ) DEFAULT 'general_message'
    `);
    
    console.log('✅ Notifications table reverted');
  }
};
