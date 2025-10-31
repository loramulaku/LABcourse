'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create departments table
    await queryInterface.createTable('departments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      head_doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      budget: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('departments', ['name'], {
      name: 'idx_departments_name',
    });

    await queryInterface.addIndex('departments', ['is_active'], {
      name: 'idx_departments_is_active',
    });

    // Add department_id column to doctors table
    await queryInterface.addColumn('doctors', 'department_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'specialization',
    });

    // Add foreign key constraint
    await queryInterface.addConstraint('doctors', {
      fields: ['department_id'],
      type: 'foreign key',
      name: 'fk_doctors_department_id',
      references: {
        table: 'departments',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Add index on department_id
    await queryInterface.addIndex('doctors', ['department_id'], {
      name: 'idx_doctors_department_id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('doctors', 'fk_doctors_department_id');

    // Remove index from doctors
    await queryInterface.removeIndex('doctors', 'idx_doctors_department_id');

    // Remove department_id column from doctors
    await queryInterface.removeColumn('doctors', 'department_id');

    // Drop departments table
    await queryInterface.dropTable('departments');
  },
};
