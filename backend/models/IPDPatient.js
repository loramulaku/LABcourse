'use strict';

module.exports = (sequelize, DataTypes) => {
  const IPDPatient = sequelize.define('IPDPatient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bed_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    admission_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    discharge_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
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
  }, {
    tableName: 'ipd_patients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_ipd_patients_patient_id',
        fields: ['patient_id'],
      },
      {
        name: 'idx_ipd_patients_doctor_id',
        fields: ['doctor_id'],
      },
      {
        name: 'idx_ipd_patients_status',
        fields: ['status'],
      },
    ],
  });

  IPDPatient.associate = function(models) {
    IPDPatient.belongsTo(models.User, {
      foreignKey: 'patient_id',
      as: 'patient',
      onDelete: 'CASCADE',
    });

    IPDPatient.belongsTo(models.Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor',
      onDelete: 'CASCADE',
    });

    IPDPatient.belongsTo(models.Ward, {
      foreignKey: 'ward_id',
      as: 'ward',
      onDelete: 'CASCADE',
    });

    IPDPatient.belongsTo(models.Room, {
      foreignKey: 'room_id',
      as: 'room',
      onDelete: 'CASCADE',
    });

    IPDPatient.belongsTo(models.Bed, {
      foreignKey: 'bed_id',
      as: 'bed',
      onDelete: 'CASCADE',
    });

    IPDPatient.hasMany(models.DailyDoctorNote, {
      foreignKey: 'ipd_id',
      as: 'daily_notes',
      onDelete: 'CASCADE',
    });
  };

  return IPDPatient;
};
