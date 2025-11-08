'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Wards table
    await queryInterface.createTable('wards', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
      total_beds: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Optional fallback if room-based model is not used',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 2. Create Rooms table
    await queryInterface.createTable('rooms', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      ward_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'wards',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      room_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      room_type: {
        type: Sequelize.ENUM(
          'Single',
          'Double',
          'ICU',
          'Maternity',
          'Pediatric',
          'Emergency',
          'General'
        ),
        allowNull: false,
        defaultValue: 'General',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 3. Create Beds table
    await queryInterface.createTable('beds', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'rooms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      bed_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'),
        allowNull: false,
        defaultValue: 'Available',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 4. Create IPD Patients table
    await queryInterface.createTable('ipd_patients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
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
        onDelete: 'CASCADE',
      },
      ward_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'wards',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'rooms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      bed_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'beds',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      admission_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      discharge_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
          'Admitted',
          'UnderCare',
          'TransferRequested',
          'DischargeRequested',
          'Discharged'
        ),
        allowNull: false,
        defaultValue: 'Admitted',
      },
      primary_diagnosis: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      treatment_plan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      urgency: {
        type: Sequelize.ENUM('Normal', 'Emergency'),
        allowNull: false,
        defaultValue: 'Normal',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 5. Create Admission Requests table
    await queryInterface.createTable('admission_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      appointment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      requested_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      recommended_ward_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'wards',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      recommended_room_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      diagnosis: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      treatment_plan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      urgency: {
        type: Sequelize.ENUM('Normal', 'Emergency'),
        allowNull: false,
        defaultValue: 'Normal',
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 6. Create Daily Doctor Notes table
    await queryInterface.createTable('daily_doctor_notes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      ipd_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ipd_patients',
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
        onDelete: 'CASCADE',
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('rooms', ['ward_id'], {
      name: 'idx_rooms_ward_id',
    });

    await queryInterface.addIndex('beds', ['room_id'], {
      name: 'idx_beds_room_id',
    });

    await queryInterface.addIndex('beds', ['status'], {
      name: 'idx_beds_status',
    });

    await queryInterface.addIndex('ipd_patients', ['patient_id'], {
      name: 'idx_ipd_patients_patient_id',
    });

    await queryInterface.addIndex('ipd_patients', ['doctor_id'], {
      name: 'idx_ipd_patients_doctor_id',
    });

    await queryInterface.addIndex('ipd_patients', ['status'], {
      name: 'idx_ipd_patients_status',
    });

    await queryInterface.addIndex('admission_requests', ['doctor_id'], {
      name: 'idx_admission_requests_doctor_id',
    });

    await queryInterface.addIndex('admission_requests', ['patient_id'], {
      name: 'idx_admission_requests_patient_id',
    });

    await queryInterface.addIndex('admission_requests', ['status'], {
      name: 'idx_admission_requests_status',
    });

    await queryInterface.addIndex('daily_doctor_notes', ['ipd_id'], {
      name: 'idx_daily_doctor_notes_ipd_id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('daily_doctor_notes');
    await queryInterface.dropTable('admission_requests');
    await queryInterface.dropTable('ipd_patients');
    await queryInterface.dropTable('beds');
    await queryInterface.dropTable('rooms');
    await queryInterface.dropTable('wards');
  },
};
