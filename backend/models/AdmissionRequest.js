'use strict';

module.exports = (sequelize, DataTypes) => {
  const AdmissionRequest = sequelize.define('AdmissionRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    appointment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    requested_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    recommended_ward_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    recommended_room_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    treatment_plan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    urgency: {
      type: DataTypes.ENUM('Normal', 'Emergency'),
      allowNull: false,
      defaultValue: 'Normal',
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'admission_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_admission_requests_doctor_id',
        fields: ['doctor_id'],
      },
      {
        name: 'idx_admission_requests_patient_id',
        fields: ['patient_id'],
      },
      {
        name: 'idx_admission_requests_status',
        fields: ['status'],
      },
    ],
  });

  AdmissionRequest.associate = function(models) {
    AdmissionRequest.belongsTo(models.Appointment, {
      foreignKey: 'appointment_id',
      as: 'appointment',
      onDelete: 'SET NULL',
    });

    AdmissionRequest.belongsTo(models.Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor',
      onDelete: 'CASCADE',
    });

    AdmissionRequest.belongsTo(models.User, {
      foreignKey: 'patient_id',
      as: 'patient',
      onDelete: 'CASCADE',
    });

    AdmissionRequest.belongsTo(models.Ward, {
      foreignKey: 'recommended_ward_id',
      as: 'recommended_ward',
      onDelete: 'SET NULL',
    });
  };

  return AdmissionRequest;
};
