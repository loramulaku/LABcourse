'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('appointments', 'requires_admission', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: null,
      comment: 'True if patient requires IPD admission, False if therapy only',
    });

    await queryInterface.addColumn('appointments', 'therapy_prescribed', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Therapy details when admission is not required',
    });

    await queryInterface.addColumn('appointments', 'clinical_assessment', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Doctor clinical assessment after confirmed appointment',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('appointments', 'requires_admission');
    await queryInterface.removeColumn('appointments', 'therapy_prescribed');
    await queryInterface.removeColumn('appointments', 'clinical_assessment');
  },
};
