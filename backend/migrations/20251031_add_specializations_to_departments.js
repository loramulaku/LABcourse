'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add specializations column to departments table
    await queryInterface.addColumn('departments', 'specializations', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of specializations for this department',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove specializations column from departments table
    await queryInterface.removeColumn('departments', 'specializations');
  },
};
