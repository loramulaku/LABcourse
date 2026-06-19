'use strict';

// This file is an exact duplicate of 20251108000000-create-billing-tables.js.
// The up() is a no-op so db:migrate never crashes on a fresh database where
// 20251108000000 already created these tables.
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('bills')) {
      await queryInterface.createTable('bills', {
        id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        patientId:   { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
        totalAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        isPaid:      { type: Sequelize.BOOLEAN, defaultValue: false },
        notes:       { type: Sequelize.TEXT, allowNull: true },
        dueDate:     { type: Sequelize.DATE, allowNull: true },
        createdAt:   { type: Sequelize.DATE, allowNull: false },
        updatedAt:   { type: Sequelize.DATE, allowNull: false },
      });
    }
    if (!tables.includes('bill_items')) {
      await queryInterface.createTable('bill_items', {
        id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        billId:      { type: Sequelize.INTEGER, allowNull: false, references: { model: 'bills', key: 'id' }, onDelete: 'CASCADE' },
        description: { type: Sequelize.STRING, allowNull: false },
        quantity:    { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        amount:      { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        createdAt:   { type: Sequelize.DATE, allowNull: false },
        updatedAt:   { type: Sequelize.DATE, allowNull: false },
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // down is handled by 20251108000000
  },
};
