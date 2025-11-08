'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before adding
    const tableDescription = await queryInterface.describeTable('bills');
    
    if (!tableDescription.paidAmount) {
      await queryInterface.addColumn('bills', 'paidAmount', {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: true
      });
    }

    if (!tableDescription.paymentMethod) {
      await queryInterface.addColumn('bills', 'paymentMethod', {
        type: Sequelize.ENUM('cash', 'card', 'insurance', 'bank_transfer', 'online', 'other'),
        allowNull: true
      });
    }

    if (!tableDescription.paymentDate) {
      await queryInterface.addColumn('bills', 'paymentDate', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableDescription.billType) {
      await queryInterface.addColumn('bills', 'billType', {
        type: Sequelize.ENUM('consultation', 'treatment', 'lab_test', 'package', 'other'),
        defaultValue: 'other',
        allowNull: true
      });
    }

    if (!tableDescription.packageId) {
      await queryInterface.addColumn('bills', 'packageId', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    // Create billing_packages table if it doesn't exist
    const tables = await queryInterface.showAllTables();
    
    if (!tables.includes('billing_packages')) {
      await queryInterface.createTable('billing_packages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      packageType: {
        type: Sequelize.ENUM('maternity', 'surgery', 'diagnostic', 'wellness', 'emergency', 'other'),
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duration in days'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      includedServices: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of included services/items'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
    }

    // Create payment_history table if it doesn't exist
    if (!tables.includes('payment_history')) {
      await queryInterface.createTable('payment_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      billId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'bills',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'card', 'insurance', 'bank_transfer', 'online', 'other'),
        allowNull: false
      },
      transactionRef: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Transaction reference number'
      },
      receivedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      paymentDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
    }

    // Add foreign key constraint for packageId if not exists
    const constraints = await queryInterface.showConstraint('bills');
    const fkExists = constraints.some(c => c.constraintName === 'fk_bills_package');
    
    if (!fkExists && tables.includes('billing_packages')) {
      await queryInterface.addConstraint('bills', {
      fields: ['packageId'],
      type: 'foreign key',
      name: 'fk_bills_package',
      references: {
        table: 'billing_packages',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('bills', 'fk_bills_package');

    // Drop tables
    await queryInterface.dropTable('payment_history');
    await queryInterface.dropTable('billing_packages');

    // Remove columns from bills table
    await queryInterface.removeColumn('bills', 'packageId');
    await queryInterface.removeColumn('bills', 'billType');
    await queryInterface.removeColumn('bills', 'paymentDate');
    await queryInterface.removeColumn('bills', 'paymentMethod');
    await queryInterface.removeColumn('bills', 'paidAmount');
  }
};
