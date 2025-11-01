'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before adding
    const tableDescription = await queryInterface.describeTable('doctors');
    
    if (!tableDescription.specializations) {
      await queryInterface.addColumn('doctors', 'specializations', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of specializations for this doctor',
      });
      console.log('✅ Added specializations column');
    } else {
      console.log('ℹ️ specializations column already exists, skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('doctors', 'specializations');
  },
};
