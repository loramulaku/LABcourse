"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use the project's models so hooks (e.g. password hashing) run
    const path = require('path');
    const db = require(path.join(__dirname, '..', 'models'));

    const { User, Bill, BillItem, sequelize } = db;

    const t = await sequelize.transaction();
    try {
      // Find or create regular user
      const [user] = await User.findOrCreate({
        where: { email: 'seed.user@example.local' },
        defaults: {
          name: 'Seed User',
          email: 'seed.user@example.local',
          password: 'SeedPass123!'
        },
        transaction: t
      });

      // Find or create admin user
      const [admin] = await User.findOrCreate({
        where: { email: 'seed.admin@example.local' },
        defaults: {
          name: 'Seed Admin',
          email: 'seed.admin@example.local',
          password: 'AdminPass123!',
          role: 'admin'
        },
        transaction: t
      });

      // Ensure admin role
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save({ transaction: t });
      }

      // Create a bill for the regular user
      const bill = await Bill.create({
        patientId: user.id,
        totalAmount: 100.00,
        isPaid: false,
        notes: 'Seeded bill for testing',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }, { transaction: t });

      await BillItem.create({
        billId: bill.id,
        description: 'Seed consultation',
        quantity: 1,
        amount: 100.00
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const path = require('path');
    const db = require(path.join(__dirname, '..', 'models'));
    const { User, Bill, BillItem, sequelize } = db;

    const t = await sequelize.transaction();
    try {
      // Remove bill items and bills with our seeded note
      await BillItem.destroy({ where: { description: 'Seed consultation' }, transaction: t });
      await Bill.destroy({ where: { notes: 'Seeded bill for testing' }, transaction: t });

      // Remove seeded users
      await User.destroy({ where: { email: ['seed.user@example.local', 'seed.admin@example.local'] }, transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
};
