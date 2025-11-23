'use strict';

/**
 * Therapy Model - Clean Sequelize Model
 * 
 * All business logic has been moved to TherapyController
 * All queries use Sequelize ORM (no raw SQL)
 */

module.exports = (sequelize, DataTypes) => {
  const Therapy = sequelize.define('Therapy', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    appointment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    therapy_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    medications: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dosage: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    frequency: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    follow_up_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    therapy_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    patient_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    doctor_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'confirmed', 'active', 'on_hold', 'completed', 'cancelled', 'overdue'),
      defaultValue: 'draft',
    },
  }, {
    tableName: 'therapies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_therapy_appointment',
        fields: ['appointment_id'],
      },
      {
        name: 'idx_therapy_doctor',
        fields: ['doctor_id'],
      },
      {
        name: 'idx_therapy_patient',
        fields: ['patient_id'],
      },
      {
        name: 'idx_therapy_status',
        fields: ['status'],
      },
      {
        name: 'idx_therapy_follow_up',
        fields: ['follow_up_date'],
      },
    ],
  });

  // Define associations
  Therapy.associate = function(models) {
    Therapy.belongsTo(models.Appointment, {
      foreignKey: 'appointment_id',
      as: 'appointment',
      onDelete: 'CASCADE',
    });

    Therapy.belongsTo(models.Doctor, {
      foreignKey: 'doctor_id',
      onDelete: 'CASCADE',
    });

    Therapy.belongsTo(models.User, {
      foreignKey: 'patient_id',
      as: 'patient',
      onDelete: 'CASCADE',
    });
  };

  return Therapy;
};
