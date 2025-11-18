'use strict';

/**
 * Migration: create opd_visits table matching backend/models/OPDVisit.js
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('opd_visits', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      visit_type: {
        type: Sequelize.ENUM('consultation', 'followup', 'quick'),
        allowNull: false,
        defaultValue: 'consultation'
      },
      status: {
        type: Sequelize.ENUM('open', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'open'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      consultation_fee: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: true
      },
      billed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      bill_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'bills',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table first then drop enum types (Postgres)
    await queryInterface.dropTable('opd_visits');
    // In Postgres, enum types remain after drop; attempt to remove them if exist
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_opd_visits_visit_type\";");
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_opd_visits_status\";");
    }
  }
};
