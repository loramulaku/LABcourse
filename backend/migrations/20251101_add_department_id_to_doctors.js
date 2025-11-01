'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before adding
    const tableDescription = await queryInterface.describeTable('doctors');
    
    if (!tableDescription.department_id) {
      // Add nullable department_id with FK to departments.id
      await queryInterface.addColumn('doctors', 'department_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Foreign key to departments table',
      });
      console.log('✅ Added department_id column');
    } else {
      console.log('ℹ️ department_id column already exists, skipping');
    }

    // Add index for faster joins (only if it doesn't exist)
    try {
      await queryInterface.addIndex('doctors', ['department_id'], {
        name: 'idx_doctors_department_id',
      });
      console.log('✅ Added department_id index');
    } catch (e) {
      console.log('ℹ️ department_id index already exists, skipping');
    }

    // Attempt to backfill department_id from legacy `department` name if both columns exist
    // This may fail silently if `department` column doesn't exist; that's okay.
    try {
      await queryInterface.sequelize.query(`
        UPDATE doctors d
        JOIN departments dep ON dep.name = d.department
        SET d.department_id = dep.id
      `);
    } catch (e) {
      // ignore if legacy column doesn't exist
    }

    // Add FK constraint (SET NULL on delete)
    try {
      await queryInterface.addConstraint('doctors', {
        fields: ['department_id'],
        type: 'foreign key',
        name: 'fk_doctors_department_id',
        references: { table: 'departments', field: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
      console.log('✅ Added foreign key constraint');
    } catch (e) {
      console.log('ℹ️ Foreign key constraint already exists, skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove FK and column
    try {
      await queryInterface.removeConstraint('doctors', 'fk_doctors_department_id');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('doctors', 'idx_doctors_department_id');
    } catch (e) {}
    await queryInterface.removeColumn('doctors', 'department_id');
  },
};
