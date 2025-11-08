'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tariff items
    await queryInterface.createTable('tariff_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(50) },
      name: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT },
      unit_price: { type: Sequelize.DECIMAL(12,2), defaultValue: 0.0 },
      unit: { type: Sequelize.STRING(50) },
      category: { type: Sequelize.STRING(100) },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Invoices
    await queryInterface.createTable('invoices', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      reference: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      patient_id: { type: Sequelize.INTEGER, allowNull: true },
      issuer_id: { type: Sequelize.INTEGER, allowNull: true },
      invoiceable_type: { type: Sequelize.STRING(50) },
      invoiceable_id: { type: Sequelize.INTEGER },
      total_amount: { type: Sequelize.DECIMAL(12,2), defaultValue: 0.0 },
      currency: { type: Sequelize.STRING(3), defaultValue: 'EUR' },
      status: { type: Sequelize.ENUM('draft','issued','paid','partially_paid','cancelled','refunded'), defaultValue: 'draft' },
      due_date: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Invoice items
    await queryInterface.createTable('invoice_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      invoice_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'invoices', key: 'id' }, onDelete: 'CASCADE' },
      description: { type: Sequelize.STRING(255), allowNull: false },
      tariff_item_id: { type: Sequelize.INTEGER, allowNull: true },
      quantity: { type: Sequelize.INTEGER, defaultValue: 1 },
      unit_price: { type: Sequelize.DECIMAL(12,2), defaultValue: 0.0 },
      total: { type: Sequelize.DECIMAL(12,2), defaultValue: 0.0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Payments
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      invoice_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'invoices', key: 'id' }, onDelete: 'CASCADE' },
      amount: { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0.0 },
      currency: { type: Sequelize.STRING(3), defaultValue: 'EUR' },
      method: { type: Sequelize.ENUM('stripe','cash','card','insurance','other'), defaultValue: 'stripe' },
      provider_ref: { type: Sequelize.STRING(255) },
      status: { type: Sequelize.ENUM('pending','completed','failed','refunded'), defaultValue: 'pending' },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('invoice_items');
    await queryInterface.dropTable('invoices');
    await queryInterface.dropTable('tariff_items');
  }
};
