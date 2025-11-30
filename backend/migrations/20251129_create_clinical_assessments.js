'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clinical_assessments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      appointment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      
      // Clinical Content
      clinical_notes: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      diagnosis: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      chief_complaint: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      vitals: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      physical_examination: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
      // Treatment
      requires_admission: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      therapy_prescribed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      treatment_plan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      follow_up_instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      follow_up_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      admission_details: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      
      // Tests
      lab_tests_ordered: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      imaging_ordered: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      
      // Status
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'locked'),
        defaultValue: 'draft',
        allowNull: false,
      },
      is_locked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      locked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      locked_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      
      // Audit
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      submitted_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      last_modified_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      internal_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
      // Timestamps
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await queryInterface.addIndex('clinical_assessments', ['appointment_id'], {
      name: 'idx_assessment_appointment',
      unique: true,
    });

    await queryInterface.addIndex('clinical_assessments', ['doctor_id'], {
      name: 'idx_assessment_doctor',
    });

    await queryInterface.addIndex('clinical_assessments', ['patient_id'], {
      name: 'idx_assessment_patient',
    });

    await queryInterface.addIndex('clinical_assessments', ['status'], {
      name: 'idx_assessment_status',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('clinical_assessments');
  }
};
